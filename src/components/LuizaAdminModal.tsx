import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ADMIN_PASSWORD = "472370";

type Lead = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  created_at: string;
};

const LuizaAdminModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [tab, setTab] = useState<"kb" | "leads">("kb");
  const [instructions, setInstructions] = useState("");
  const [kbId, setKbId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAuthed(false);
      setPwd("");
    }
  }, [open]);

  useEffect(() => {
    if (!authed) return;
    (async () => {
      const { data: kb } = await supabase
        .from("luiza_kb")
        .select("id, custom_instructions")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (kb) {
        setKbId(kb.id);
        setInstructions(kb.custom_instructions ?? "");
      }
      const { data: ld } = await supabase
        .from("luiza_leads")
        .select("*")
        .order("created_at", { ascending: false });
      setLeads((ld as Lead[]) ?? []);
    })();
  }, [authed]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      toast.error("Senha incorreta");
    }
  };

  const saveKb = async () => {
    setSaving(true);
    if (kbId) {
      const { error } = await supabase
        .from("luiza_kb")
        .update({ custom_instructions: instructions, updated_at: new Date().toISOString() })
        .eq("id", kbId);
      if (error) toast.error("Erro ao salvar"); else toast.success("Instruções salvas!");
    } else {
      const { data, error } = await supabase
        .from("luiza_kb")
        .insert({ custom_instructions: instructions })
        .select("id")
        .single();
      if (error) toast.error("Erro ao salvar");
      else {
        setKbId(data.id);
        toast.success("Instruções salvas!");
      }
    }
    setSaving(false);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("luiza_leads").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead excluído");
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-primary text-accent p-4 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 font-display">
              <Settings size={18} /> Painel Admin — Luiza
            </h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>

          {!authed ? (
            <form onSubmit={handleAuth} className="p-8 space-y-4">
              <p className="text-sm text-muted-foreground">Digite a senha de administrador.</p>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="Senha"
                  className="w-full p-3 pr-10 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" className="btn-gold w-full py-3 rounded-lg font-bold">
                Entrar
              </button>
            </form>
          ) : (
            <>
              <div className="flex border-b border-border">
                <button
                  onClick={() => setTab("kb")}
                  className={`flex-1 py-3 font-medium text-sm ${tab === "kb" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                >
                  Treinamento da IA
                </button>
                <button
                  onClick={() => setTab("leads")}
                  className={`flex-1 py-3 font-medium text-sm ${tab === "leads" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                >
                  Leads ({leads.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {tab === "kb" ? (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">
                        Instruções personalizadas para a Luiza
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        Adicione informações extras, regras ou contexto que a IA usará nas respostas.
                      </span>
                    </label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={12}
                      placeholder="Ex: Sempre mencionar a promoção atual de 30% off para novos corretores..."
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none font-body text-sm"
                    />
                    <button
                      onClick={saveKb}
                      disabled={saving}
                      className="btn-gold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leads.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Nenhum lead capturado ainda.
                      </p>
                    ) : (
                      leads.map((l) => (
                        <div
                          key={l.id}
                          className="border border-border rounded-lg p-3 flex items-center justify-between gap-3 bg-background"
                        >
                          <div className="text-sm flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{l.nome}</p>
                            <p className="text-muted-foreground truncate">{l.email}</p>
                            <p className="text-muted-foreground">{l.whatsapp}</p>
                            <p className="text-xs text-muted-foreground/70">
                              {new Date(l.created_at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteLead(l.id)}
                            className="text-destructive hover:opacity-70 p-2"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LuizaAdminModal;
