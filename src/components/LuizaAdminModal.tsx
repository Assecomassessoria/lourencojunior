import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Trash2, Save, Eye, EyeOff, Upload, FileText, Loader2 } from "lucide-react";
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

type Doc = {
  id: string;
  nome: string;
  arquivo_url: string;
  arquivo_path: string;
  paginas: number | null;
  ativo: boolean | null;
  created_at: string;
};

const LuizaAdminModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [tab, setTab] = useState<"kb" | "docs" | "leads">("kb");
  const [instructions, setInstructions] = useState("");
  const [kbId, setKbId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      await loadDocs();
    })();
  }, [authed]);

  const loadDocs = async () => {
    const { data } = await supabase
      .from("luiza_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((data as Doc[]) ?? []);
  };

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

  const uploadPdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("PDF muito grande (máx 20MB)");
      return;
    }
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("luiza-docs").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("luiza-docs").getPublicUrl(path);
      const { data: doc, error: insErr } = await supabase
        .from("luiza_documents")
        .insert({ nome: file.name, arquivo_url: pub.publicUrl, arquivo_path: path })
        .select()
        .single();
      if (insErr) throw insErr;
      toast.info("Extraindo texto do PDF...");
      const { error: fnErr } = await supabase.functions.invoke("extract-pdf", {
        body: { documentId: doc.id },
      });
      if (fnErr) toast.error("Upload ok, mas falha ao extrair texto");
      else toast.success("PDF adicionado e processado!");
      await loadDocs();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteDoc = async (d: Doc) => {
    if (!confirm(`Excluir "${d.nome}"?`)) return;
    await supabase.storage.from("luiza-docs").remove([d.arquivo_path]);
    const { error } = await supabase.from("luiza_documents").delete().eq("id", d.id);
    if (error) toast.error("Erro ao excluir");
    else {
      setDocs((prev) => prev.filter((x) => x.id !== d.id));
      toast.success("Documento removido");
    }
  };

  const toggleDoc = async (d: Doc) => {
    const { error } = await supabase
      .from("luiza_documents")
      .update({ ativo: !d.ativo })
      .eq("id", d.id);
    if (error) toast.error("Erro ao atualizar");
    else {
      setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, ativo: !d.ativo } : x)));
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
                  Instruções
                </button>
                <button
                  onClick={() => setTab("docs")}
                  className={`flex-1 py-3 font-medium text-sm ${tab === "docs" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                >
                  PDFs ({docs.length})
                </button>
                <button
                  onClick={() => setTab("leads")}
                  className={`flex-1 py-3 font-medium text-sm ${tab === "leads" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                >
                  Leads ({leads.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {tab === "kb" && (
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
                )}

                {tab === "docs" && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Treine a Luiza com PDFs do simulador
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        O texto dos PDFs ativos é enviado à IA como base de conhecimento oficial.
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])}
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="btn-gold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading ? "Enviando..." : "Enviar PDF"}
                      </button>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6 text-sm">
                        Nenhum PDF enviado ainda.
                      </p>
                    ) : (
                      docs.map((d) => (
                        <div
                          key={d.id}
                          className="border border-border rounded-lg p-3 flex items-center gap-3 bg-background"
                        >
                          <FileText size={20} className="text-accent shrink-0" />
                          <div className="flex-1 min-w-0">
                            <a
                              href={d.arquivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-sm text-foreground truncate block hover:text-accent"
                            >
                              {d.nome}
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {d.paginas ? `${d.paginas} pág` : "—"} ·{" "}
                              {new Date(d.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!d.ativo}
                              onChange={() => toggleDoc(d)}
                            />
                            Ativo
                          </label>
                          <button
                            onClick={() => deleteDoc(d)}
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

                {tab === "leads" && (
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
