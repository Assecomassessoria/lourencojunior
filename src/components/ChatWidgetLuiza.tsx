import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Mic, Maximize2, Minimize2,
  ThumbsUp, ThumbsDown, User, Mail, Phone, LogOut,
  Settings, Volume2, VolumeX, Bell, BellOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LuizaAdminModal from "./LuizaAdminModal";

type ChatMsg = { role: "user" | "assistant"; content: string; feedback?: "up" | "down" };

const INITIAL_GREETING =
  "Olá! Sou a Luiza, sua assistente virtual do Simulador Corretor de Elite 4.0. Estou aqui para ajudar você a realizar vendas seguras e otimizar suas simulações. Como posso ajudar hoje?";

const MAX_INTERACTIONS = 15;

const ChatWidgetLuiza = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualAlertsEnabled, setVisualAlertsEnabled] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const [userData, setUserData] = useState({ name: "", email: "", whatsapp: "" });
  const [interactionCount, setInteractionCount] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessage(false);
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.lang = "pt-BR";
      r.interimResults = false;
      r.onresult = (e: any) => {
        setInput(e.results[0][0].transcript);
        setIsListening(false);
      };
      r.onerror = () => setIsListening(false);
      recognitionRef.current = r;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.name || !userData.email || !userData.whatsapp) return;
    setSubmitting(true);
    try {
      // Save lead to DB
      const leadId = crypto.randomUUID();
      await supabase.from("luiza_leads").insert({
        id: leadId,
        nome: userData.name,
        email: userData.email,
        whatsapp: userData.whatsapp,
      });

      // Send email notification to consultant (fire-and-forget)
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "luiza-new-lead",
            recipientEmail: "lourenco.consultorimob@gmail.com",
            idempotencyKey: `luiza-lead-${leadId}`,
            templateData: {
              nome: userData.name,
              email: userData.email,
              whatsapp: userData.whatsapp,
              capturedAt: new Date().toLocaleString("pt-BR"),
            },
          },
        })
        .catch((e) => console.error("email notify error:", e));

      // Open WhatsApp with lead info
      const message = `Novo Lead - Luiza Elite IA 🚀\n\nNome: ${userData.name}\nE-mail: ${userData.email}\nWhatsApp: ${userData.whatsapp}\n\nInteressado em iniciar a simulação/consultoria agora.`;
      window.open(`https://wa.me/5511946770625?text=${encodeURIComponent(message)}`, "_blank");

      setIsRegistered(true);
      toast.success("Cadastro recebido! Iniciando consultoria...");
    } catch (err) {
      console.error(err);
      setIsRegistered(true); // release anyway
    } finally {
      setSubmitting(false);
    }
  };

  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const a = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      a.volume = 0.4;
      a.play().catch(() => {});
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (interactionCount >= MAX_INTERACTIONS) {
      toast.info("Limite de mensagens atingido. Reinicie o chat para continuar.");
      return;
    }

    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);
    setInteractionCount((c) => c + 1);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-luiza`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        },
      );

      if (resp.status === 429) {
        toast.error("Muitas mensagens. Aguarde um instante.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Créditos de IA esgotados. Contate o administrador.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("stream falhou");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let assistantStarted = false;

      const upsert = (chunk: string) => {
        acc += chunk;
        setMessages((prev) => {
          if (!assistantStarted) {
            assistantStarted = true;
            return [...prev, { role: "assistant", content: acc }];
          }
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: acc } : m,
          );
        });
      };

      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      playSound();
      if (!isOpen) setHasNewMessage(true);
    } catch (e) {
      console.error("chat error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro ao se comunicar com a IA." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (i: number, fb: "up" | "down") => {
    setMessages((prev) => prev.map((m, idx) => (idx === i ? { ...m, feedback: fb } : m)));
  };

  const handleLogout = () => {
    setIsRegistered(false);
    setUserData({ name: "", email: "", whatsapp: "" });
    setInteractionCount(0);
    setMessages([{ role: "assistant", content: INITIAL_GREETING }]);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className={`bg-primary text-accent p-4 rounded-full shadow-lg hover:opacity-90 transition-all relative ${
              hasNewMessage && visualAlertsEnabled ? "animate-bounce" : ""
            }`}
            aria-label="Abrir chat com Luiza"
          >
            <MessageCircle size={28} />
            {hasNewMessage && visualAlertsEnabled && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full border-2 border-card" />
            )}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`${
              isExpanded ? "fixed inset-4" : "w-[340px] h-[520px]"
            } bg-card border-2 border-primary rounded-lg shadow-2xl flex flex-col overflow-hidden`}
          >
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-[280px] border border-border">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-primary flex items-center gap-2">
                        <Settings size={18} /> Configurações
                      </h4>
                      <button onClick={() => setIsSettingsOpen(false)}>
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {soundEnabled ? (
                            <Volume2 size={18} className="text-accent" />
                          ) : (
                            <VolumeX size={18} className="text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">Som</span>
                        </div>
                        <button
                          onClick={() => setSoundEnabled((v) => !v)}
                          className={`w-10 h-6 rounded-full relative transition-colors ${
                            soundEnabled ? "bg-accent" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-card rounded-full shadow transition-all ${
                              soundEnabled ? "left-5" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {visualAlertsEnabled ? (
                            <Bell size={18} className="text-accent" />
                          ) : (
                            <BellOff size={18} className="text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">Alertas visuais</span>
                        </div>
                        <button
                          onClick={() => setVisualAlertsEnabled((v) => !v)}
                          className={`w-10 h-6 rounded-full relative transition-colors ${
                            visualAlertsEnabled ? "bg-accent" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-card rounded-full shadow transition-all ${
                              visualAlertsEnabled ? "left-5" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSettingsOpen(false)}
                      className="btn-gold w-full mt-8 py-2 rounded-lg font-bold"
                    >
                      Salvar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-primary text-accent p-3 flex justify-between items-center select-none">
              <h3 className="font-bold font-display">Luiza — Elite 4.0</h3>
              <div className="flex gap-2">
                <button onClick={() => setIsSettingsOpen(true)} title="Configurações">
                  <Settings size={18} />
                </button>
                {isRegistered && (
                  <button onClick={handleLogout} title="Sair">
                    <LogOut size={18} />
                  </button>
                )}
                <button onClick={() => setIsExpanded((v) => !v)}>
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isRegistered ? (
              <div className="flex-1 p-6 overflow-y-auto bg-muted">
                <div className="text-center mb-6">
                  <h4 className="text-primary font-bold text-lg font-display">
                    Cadastro de Elite
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Preencha os dados para iniciar sua consultoria personalizada.
                  </p>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      required
                      maxLength={100}
                      type="text"
                      placeholder="Nome Completo"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      required
                      maxLength={255}
                      type="email"
                      placeholder="E-mail"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      required
                      maxLength={30}
                      type="tel"
                      placeholder="WhatsApp"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none"
                      value={userData.whatsapp}
                      onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold w-full font-bold py-3 rounded-lg shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Enviando..." : "Iniciar Consultoria de Elite"}
                  </button>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAdminOpen(true)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Admin"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3 bg-background space-y-3">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap break-words ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {m.content}
                        {m.role === "assistant" && i > 0 && (
                          <div className="flex gap-2 mt-2 opacity-70">
                            <button
                              onClick={() => handleFeedback(i, "up")}
                              className={m.feedback === "up" ? "text-accent" : ""}
                            >
                              <ThumbsUp size={12} />
                            </button>
                            <button
                              onClick={() => handleFeedback(i, "down")}
                              className={m.feedback === "down" ? "text-destructive" : ""}
                            >
                              <ThumbsDown size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                        Luiza está digitando...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-border p-2 bg-card">
                  <div className="text-[10px] text-muted-foreground text-center mb-1">
                    {interactionCount}/{MAX_INTERACTIONS} mensagens
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-colors ${
                        isListening ? "bg-destructive text-destructive-foreground" : "bg-muted text-foreground"
                      }`}
                      title="Falar"
                    >
                      <Mic size={18} />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Digite sua mensagem..."
                      maxLength={500}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-accent outline-none"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="bg-primary text-accent p-2 rounded-lg disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      <LuizaAdminModal open={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </>
  );
};

export default ChatWidgetLuiza;
