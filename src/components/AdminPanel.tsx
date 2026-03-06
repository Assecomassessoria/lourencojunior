import { useState, useCallback } from "react";
import { Settings, X, Plus, Image, FileText, Link, MessageSquare, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_PASSWORD = "472370";

type Empreendimento = {
  id: string;
  nome: string;
  descricao: string | null;
  detalhe: string | null;
  preco: string | null;
  imagem_url: string | null;
  ativo: boolean | null;
  ordem: number | null;
};

type Foto = {
  id: string;
  foto_url: string;
  ordem: number | null;
};

const AdminPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [preco, setPreco] = useState("Sob Consulta");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [novoDepoimento, setNovoDepoimento] = useState("");

  // Estados de fotos e empreendimentos
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [empFotos, setEmpFotos] = useState<Foto[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (isAuthenticated) {
      setIsOpen(true);
    } else {
      setShowPasswordInput(true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordInput(false);
      setIsOpen(true);
      setPassword("");
      toast.success("Acesso administrativo liberado!");
    } else {
      toast.error("Senha incorreta!");
      setPassword("");
    }
  };

  const loadEmpreendimentos = useCallback(async () => {
    const { data } = await supabase.from("empreendimentos").select("*").order("ordem", { ascending: true });
    if (data) setEmpreendimentos(data);
  }, []);

  const loadFotosForEmp = useCallback(async (empId: string) => {
    const { data } = await supabase
      .from("empreendimento_fotos")
      .select("id, foto_url, ordem")
      .eq("empreendimento_id", empId)
      .order("ordem", { ascending: true });
    if (data) setEmpFotos(data);
  }, []);

  const openModal = async (id: string) => {
    if (id === "fotos" || id === "add") {
      await loadEmpreendimentos();
    }
    setActiveModal(id);
  };

  const uploadImage = async (file: File, path: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${path}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("empreendimentos").upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("empreendimentos").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleAddEmpreendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (imageFiles.length < 6) {
      toast.error("Adicione pelo menos 6 fotos");
      return;
    }

    setSaving(true);
    try {
      const slug = nome.toLowerCase().replace(/\s+/g, "-");
      const { data: empData, error } = await supabase
        .from("empreendimentos")
        .insert({ nome, descricao, detalhe, preco, ordem: empreendimentos.length + 1 })
        .select("id")
        .single();

      if (error) throw error;

      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadImage(imageFiles[i], slug);
        await supabase.from("empreendimento_fotos").insert({
          empreendimento_id: empData.id,
          foto_url: url,
          ordem: i,
        });
      }

      toast.success("Sucesso!");
      setActiveModal(null);
      setImageFiles([]);
      setNome("");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (files: FileList | null, target: "add" | "manage") => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (target === "add") {
      setImageFiles((prev) => [...prev, ...arr].slice(0, 10));
    } else {
      setPhotoFiles((prev) => [...prev, ...arr].slice(0, 10));
    }
  };

  const menuItems = [
    { id: "add", label: "Novo Empreendimento", icon: Plus },
    { id: "fotos", label: "Gerenciar Fotos", icon: Image },
    { id: "textos", label: "Alterar Textos", icon: FileText },
    { id: "links", label: "Atualizar Links", icon: Link },
    { id: "depo", label: "Depoimentos", icon: MessageSquare },
  ];

  return (
    <>
      {/* Botão Flutuante e Login */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleToggle}
          className="bg-primary w-12 h-12 rounded-full text-accent shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Settings className="w-5 h-5" />
        </button>

        {showPasswordInput && !isAuthenticated && (
          <div className="absolute bottom-14 left-0 bg-card p-4 rounded-xl shadow-2xl border border-border w-64">
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full p-2 border border-border rounded-lg bg-background text-sm outline-none"
                autoFocus
              />
              <button type="submit" className="btn-gold w-full py-2 rounded-lg text-xs">
                Entrar
              </button>
            </form>
          </div>
        )}

        {isOpen && isAuthenticated && (
          <div className="absolute bottom-14 left-0 bg-card p-6 rounded-xl shadow-2xl border border-border w-72">
            <h5 className="font-bold border-b border-border mb-4 pb-2 text-primary">Painel do Site</h5>
            <ul className="space-y-3">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => openModal(item.id)}
                  className="cursor-pointer text-foreground hover:text-accent flex items-center gap-3 text-sm transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modais */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-primary/70 backdrop-blur-sm z-[100] flex items-center justify-center"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-card p-8 rounded-xl max-w-lg w-full m-4 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-primary text-lg">{menuItems.find((m) => m.id === activeModal)?.label}</h3>
              <button onClick={() => setActiveModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === "add" && (
              <form onSubmit={handleAddEmpreendimento} className="space-y-3">
                <input
                  placeholder="Nome *"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full border border-border p-3 rounded-lg bg-background"
                />
                <textarea
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background h-20"
                />
                <button type="submit" disabled={saving} className="btn-gold w-full py-3 rounded-lg">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </form>
            )}

            {activeModal === "depo" && (
              <div className="space-y-3">
                <textarea
                  value={novoDepoimento}
                  onChange={(e) => setNovoDepoimento(e.target.value)}
                  placeholder="Novo depoimento..."
                  className="w-full border border-border p-3 rounded-lg bg-background h-24"
                />
                <button
                  onClick={async () => {
                    if (!novoDepoimento) return toast.error("Digite um texto!");
                    const { error } = await supabase.from("depoimentos").insert({ texto: novoDepoimento });
                    if (!error) {
                      toast.success("Postado!");
                      setNovoDepoimento("");
                      setActiveModal(null);
                    }
                  }}
                  className="btn-gold w-full py-3 rounded-lg"
                >
                  Postar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel; // ESSA LINHA É O QUE RESOLVE O ERRO TS1192
