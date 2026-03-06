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

  // Form states
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [preco, setPreco] = useState("Sob Consulta");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // ESTADO ADICIONADO PARA OS DEPOIMENTOS
  const [novoDepoimento, setNovoDepoimento] = useState("");

  // Manage photos state
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
      toast.error("Adicione pelo menos 6 fotos (mínimo 6, máximo 10)");
      return;
    }
    if (imageFiles.length > 10) {
      toast.error("Máximo de 10 fotos permitidas");
      return;
    }

    setSaving(true);
    try {
      const slug = nome.toLowerCase().replace(/\s+/g, "-");
      const { data: empData, error } = await supabase
        .from("empreendimentos")
        .insert({
          nome,
          descricao,
          detalhe,
          preco,
          imagem_url: null,
          ordem: empreendimentos.length + 1,
        })
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

      toast.success("Empreendimento adicionado com " + imageFiles.length + " fotos!");
      setNome("");
      setDescricao("");
      setDetalhe("");
      setPreco("Sob Consulta");
      setImageFiles([]);
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectEmp = async (empId: string) => {
    setSelectedEmpId(empId);
    setPhotoFiles([]);
    await loadFotosForEmp(empId);
  };

  const handlePhotoUpload = async () => {
    if (!selectedEmpId || photoFiles.length === 0) {
      toast.error("Selecione fotos para upload");
      return;
    }
    const totalFotos = empFotos.length + photoFiles.length;
    if (totalFotos > 10) {
      toast.error(`Máximo 10 fotos. Já tem ${empFotos.length}, pode adicionar mais ${10 - empFotos.length}.`);
      return;
    }
    setSaving(true);
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const url = await uploadImage(photoFiles[i], selectedEmpId);
        await supabase.from("empreendimento_fotos").insert({
          empreendimento_id: selectedEmpId,
          foto_url: url,
          ordem: empFotos.length + i,
        });
      }
      toast.success(photoFiles.length + " foto(s) adicionada(s)!");
      setPhotoFiles([]);
      await loadFotosForEmp(selectedEmpId);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFoto = async (fotoId: string) => {
    if (empFotos.length <= 6) {
      toast.error("Mínimo de 6 fotos. Adicione outra antes de remover.");
      return;
    }
    const { error } = await supabase.from("empreendimento_fotos").delete().eq("id", fotoId);
    if (error) {
      toast.error("Erro ao excluir foto");
      return;
    }
    toast.success("Foto removida!");
    await loadFotosForEmp(selectedEmpId);
  };

  const handleDeleteEmpreendimento = async (id: string) => {
    if (!confirm("Excluir este empreendimento e todas as fotos?")) return;
    const { error } = await supabase.from("empreendimentos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Excluído!");
    await loadEmpreendimentos();
    if (selectedEmpId === id) {
      setSelectedEmpId("");
      setEmpFotos([]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, target: "add" | "manage") => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (target === "add") {
      setImageFiles((prev) => [...prev, ...files].slice(0, 10));
    } else {
      setPhotoFiles((prev) => [...prev, ...files].slice(0, 10));
    }
  }, []);

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
              <p className="text-sm font-bold text-primary font-body">Senha de administrador</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-gold text-xs py-2 px-4 rounded-lg flex-1">
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword("");
                  }}
                  className="text-xs py-2 px-3 rounded-lg border border-border text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {isOpen && isAuthenticated && (
          <div className="absolute bottom-14 left-0 bg-card p-6 rounded-xl shadow-2xl border border-border w-72">
            <h5 className="font-display font-bold border-b border-border mb-4 pb-2 text-primary">Painel do Site</h5>
            <ul className="space-y-3">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => openModal(item.id)}
                  className="cursor-pointer text-foreground hover:text-accent flex items-center gap-3 text-sm font-medium font-body transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
              <h3 className="font-display font-bold text-primary text-lg">
                {menuItems.find((m) => m.id === activeModal)?.label}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === "add" && (
              <form onSubmit={handleAddEmpreendimento} className="space-y-3">
                <input
                  placeholder="Nome do Empreendimento *"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body"
                />
                <textarea
                  placeholder="Descrição (ex: Apartamentos Com 38m²...)"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body h-20"
                />
                <textarea
                  placeholder="Detalhes (ex: 2 e 3 dormitórios...)"
                  value={detalhe}
                  onChange={(e) => setDetalhe(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body h-20"
                />
                <input
                  placeholder="Preço (ex: Sob Consulta)"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body"
                />

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-accent bg-accent/10" : "border-border"}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => handleDrop(e, "add")}
                  onClick={() => document.getElementById("add-img-input")?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-body">
                    {imageFiles.length > 0
                      ? `${imageFiles.length} foto(s) selecionada(s)`
                      : "Arraste fotos ou clique (6 a 10 fotos)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Mínimo 6, máximo 10 fotos</p>
                  <input
                    id="add-img-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, "add")}
                  />
                </div>

                <button type="submit" disabled={saving} className="btn-gold w-full py-3 rounded-lg">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </form>
            )}

            {activeModal === "fotos" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {empreendimentos.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                      <span className="flex-1 text-sm font-body text-foreground">{emp.nome}</span>
                      <button
                        onClick={() => handleSelectEmp(emp.id)}
                        className={`text-xs px-3 py-1 rounded ${selectedEmpId === emp.id ? "bg-accent text-primary" : "border border-border text-muted-foreground"}`}
                      >
                        Gerenciar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === "depo" && (
              <div className="space-y-3">
                <textarea
                  value={novoDepoimento}
                  onChange={(e) => setNovoDepoimento(e.target.value)}
                  placeholder="Novo depoimento..."
                  className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body h-24"
                />
                <button
                  onClick={async () => {
                    if (!novoDepoimento) return toast.error("Digite um texto!");
                    const { error } = await supabase.from("depoimentos").insert({ texto: novoDepoimento });

                    if (error) {
                      toast.error("Erro ao salvar");
                    } else {
                      toast.success("Depoimento postado!");
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
      )}{" "}
      {/* O PARENTESE FALTANTE ESTAVA AQUI */}
    </>
  );
};

export default AdminPanel;
