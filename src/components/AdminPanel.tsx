import { useState, useCallback, useEffect } from "react";
import { Settings, X, Plus, Image, FileText, Link, MessageSquare, Trash2, Upload, ChevronDown, Edit, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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

type Depoimento = {
  id: string;
  texto: string;
  autor: string;
  ativo: boolean;
};

type SiteConfig = {
  id: string;
  chave: string;
  valor: string;
  tipo: string;
};

const AdminPanel = () => {
  const { isAdmin, signIn, signOut, session, loading } = useAdminAuth();
  const isAuthenticated = !!session && isAdmin;
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [setupPassword2, setSetupPassword2] = useState("");

  // Adicionar Admin (autenticado)
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);


  // Form states - Novo Empreendimento
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [preco, setPreco] = useState("Sob Consulta");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // Empreendimentos & Fotos
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [empFotos, setEmpFotos] = useState<Foto[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Editar Empreendimento
  const [editEmpId, setEditEmpId] = useState<string>("");
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editDetalhe, setEditDetalhe] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);

  // Depoimentos
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [novoDepoimento, setNovoDepoimento] = useState("");
  const [autorDepoimento, setAutorDepoimento] = useState("");

  // Site Config (textos e links)
  const [siteConfigs, setSiteConfigs] = useState<SiteConfig[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const checkAdminExists = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("bootstrap-admin", { body: { action: "status" } });
      if (data && typeof data.admin_exists === "boolean") {
        setAdminExists(data.admin_exists);
        if (!data.admin_exists) setSetupMode(true);
      }
    } catch {
      setAdminExists(true); // fall back to login UI
    }
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (isAuthenticated) {
      setIsOpen(true);
    } else {
      setShowPasswordInput(true);
      if (adminExists === null) checkAdminExists();
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== setupPassword2) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 8) {
      toast.error("Use ao menos 8 caracteres");
      return;
    }
    setSigningIn(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin", {
        body: { action: "create", email, password },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Admin criado! Faça login.");
      setSetupMode(false);
      setAdminExists(true);
      setSetupPassword2("");
      setPassword("");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleCreateAdditionalAdmin = async () => {
    if (!newAdminEmail || newAdminPass.length < 8) {
      toast.error("Informe e-mail e senha (mín. 8 caracteres)");
      return;
    }
    setCreatingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin", {
        body: { action: "create", email: newAdminEmail, password: newAdminPass },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Admin adicionado!");
      setNewAdminEmail("");
      setNewAdminPass("");
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setCreatingAdmin(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    const err = await signIn(email, password);
    setSigningIn(false);
    if (err) {
      toast.error("Credenciais inválidas!");
      setPassword("");
      return;
    }
    setPassword("");
    setShowPasswordInput(false);
    setIsOpen(true);
    toast.success("Acesso administrativo liberado!");
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    toast.success("Você saiu.");
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

  const loadDepoimentos = useCallback(async () => {
    const { data } = await supabase.from("depoimentos").select("*").order("created_at", { ascending: false });
    if (data) setDepoimentos(data as Depoimento[]);
  }, []);

  const loadSiteConfigs = useCallback(async (tipo: string) => {
    const { data } = await supabase.from("site_config").select("*").eq("tipo", tipo);
    if (data) {
      setSiteConfigs(data as SiteConfig[]);
      const vals: Record<string, string> = {};
      (data as SiteConfig[]).forEach((c) => {
        vals[c.chave] = c.valor;
      });
      setConfigValues(vals);
    }
  }, []);

  const loadEditEmp = useCallback((empId: string) => {
    const emp = empreendimentos.find((e) => e.id === empId);
    if (emp) {
      setEditNome(emp.nome);
      setEditDescricao(emp.descricao || "");
      setEditDetalhe(emp.detalhe || "");
      setEditPreco(emp.preco || "Sob Consulta");
      setEditAtivo(emp.ativo ?? true);
    }
  }, [empreendimentos]);

  const handleUpdateEmpreendimento = async () => {
    if (!editEmpId) {
      toast.error("Selecione um empreendimento");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("empreendimentos")
        .update({
          nome: editNome,
          descricao: editDescricao || null,
          detalhe: editDetalhe || null,
          preco: editPreco || "Sob Consulta",
          ativo: editAtivo,
        })
        .eq("id", editEmpId);
      if (error) throw error;
      toast.success("Empreendimento atualizado!");
      await loadEmpreendimentos();
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmpreendimento = async () => {
    if (!editEmpId) return;
    if (!confirm("Tem certeza que deseja excluir este empreendimento?")) return;
    try {
      await supabase.from("empreendimento_fotos").delete().eq("empreendimento_id", editEmpId);
      const { error } = await supabase.from("empreendimentos").delete().eq("id", editEmpId);
      if (error) throw error;
      toast.success("Empreendimento excluído!");
      setEditEmpId("");
      await loadEmpreendimentos();
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const openModal = async (id: string) => {
    if (id === "fotos" || id === "add" || id === "editar") {
      await loadEmpreendimentos();
    }
    if (id === "depo") {
      await loadDepoimentos();
    }
    if (id === "textos") {
      await loadSiteConfigs("texto");
    }
    if (id === "links") {
      await loadSiteConfigs("link");
    }
    if (id === "editar") {
      setEditEmpId("");
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

  // ========== NOVO EMPREENDIMENTO ==========
  const handleAddEmpreendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (imageFiles.length < 1) {
      toast.error("Adicione pelo menos 1 foto");
      return;
    }
    if (imageFiles.length > 12) {
      toast.error("Máximo de 12 fotos permitido");
      return;
    }

    setSaving(true);
    try {
      const slug = nome.toLowerCase().replace(/\s+/g, "-");
      const { data: empData, error } = await supabase
        .from("empreendimentos")
        .insert({
          nome,
          descricao: descricao || null,
          detalhe: detalhe || null,
          preco: preco || "Sob Consulta",
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

      toast.success("Empreendimento criado com sucesso!");
      setActiveModal(null);
      resetAddForm();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetAddForm = () => {
    setNome("");
    setDescricao("");
    setDetalhe("");
    setPreco("Sob Consulta");
    setImageFiles([]);
  };

  // ========== GERENCIAR FOTOS ==========
  const handleDeleteFoto = async (foto: Foto) => {
    try {
      // Extract file name from URL to delete from storage
      const urlParts = foto.foto_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from("empreendimentos").remove([fileName]);

      const { error } = await supabase.from("empreendimento_fotos").delete().eq("id", foto.id);
      if (error) throw error;
      toast.success("Foto removida!");
      if (selectedEmpId) loadFotosForEmp(selectedEmpId);
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  const handleAddPhotosToEmp = async () => {
    if (!selectedEmpId) {
      toast.error("Selecione um empreendimento");
      return;
    }
    if (photoFiles.length === 0) {
      toast.error("Selecione fotos para adicionar");
      return;
    }
    const totalFotos = empFotos.length + photoFiles.length;
    if (totalFotos > 12) {
      toast.error(
        `Máximo 12 fotos. Atualmente há ${empFotos.length}, você pode adicionar até ${12 - empFotos.length}.`,
      );
      return;
    }

    setSaving(true);
    try {
      const emp = empreendimentos.find((e) => e.id === selectedEmpId);
      const slug = emp?.nome.toLowerCase().replace(/\s+/g, "-") || "foto";

      for (let i = 0; i < photoFiles.length; i++) {
        const url = await uploadImage(photoFiles[i], slug);
        await supabase.from("empreendimento_fotos").insert({
          empreendimento_id: selectedEmpId,
          foto_url: url,
          ordem: empFotos.length + i,
        });
      }

      toast.success("Fotos adicionadas!");
      setPhotoFiles([]);
      loadFotosForEmp(selectedEmpId);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ========== DEPOIMENTOS ==========
  const handleAddDepoimento = async () => {
    if (!novoDepoimento.trim()) {
      toast.error("Digite o texto do depoimento!");
      return;
    }
    try {
      const { error } = await supabase.from("depoimentos").insert({
        texto: novoDepoimento,
        autor: autorDepoimento || "",
      } as any);
      if (error) throw error;
      toast.success("Depoimento adicionado!");
      setNovoDepoimento("");
      setAutorDepoimento("");
      loadDepoimentos();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleDeleteDepoimento = async (id: string) => {
    try {
      const { error } = (await supabase.from("depoimentos").delete().eq("id", id)) as any;
      if (error) throw error;
      toast.success("Depoimento removido!");
      loadDepoimentos();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // ========== TEXTOS & LINKS ==========
  const handleSaveConfigs = async () => {
    setSaving(true);
    try {
      for (const config of siteConfigs) {
        const newVal = configValues[config.chave];
        if (newVal !== config.valor) {
          const { error } = (await supabase
            .from("site_config")
            .update({ valor: newVal, updated_at: new Date().toISOString() } as any)
            .eq("id", config.id)) as any;
          if (error) throw error;
        }
      }
      toast.success("Configurações salvas!");
      setActiveModal(null);
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

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePhotoFile = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const configLabels: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "E-mail",
    sobre_titulo: "Título Sobre",
    sobre_texto: "Texto Sobre",
  };

  const menuItems = [
    { id: "add", label: "Novo Empreendimento", icon: Plus },
    { id: "editar", label: "Editar Empreendimento", icon: Edit },
    { id: "fotos", label: "Gerenciar Fotos", icon: Image },
    { id: "textos", label: "Alterar Textos", icon: FileText },
    { id: "links", label: "Atualizar Links", icon: Link },
    { id: "depo", label: "Depoimentos", icon: MessageSquare },
    { id: "novo-admin", label: "Adicionar Admin", icon: UserPlus },
  ];


  return (
    <>
      {/* Botão Flutuante e Login */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleToggle}
          className="bg-primary w-12 h-12 rounded-full text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Settings className="w-5 h-5" />
        </button>

        {showPasswordInput && !isAuthenticated && (
          <div className="absolute bottom-14 left-0 bg-card p-4 rounded-xl shadow-2xl border border-border w-72">
            {setupMode && adminExists === false ? (
              <form onSubmit={handleSetup} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Nenhum admin configurado. Crie agora o primeiro acesso administrativo.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail do admin"
                  required
                  className="w-full p-2 border border-border rounded-lg bg-background text-sm outline-none"
                  autoFocus
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha (mín. 8 caracteres)"
                  required
                  minLength={8}
                  className="w-full p-2 border border-border rounded-lg bg-background text-sm outline-none"
                />
                <input
                  type="password"
                  value={setupPassword2}
                  onChange={(e) => setSetupPassword2(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={8}
                  className="w-full p-2 border border-border rounded-lg bg-background text-sm outline-none"
                />
                <button type="submit" disabled={signingIn} className="btn-gold w-full py-2 rounded-lg text-xs disabled:opacity-50">
                  {signingIn ? "Criando..." : "Criar Admin"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  required
                  className="w-full p-2 border border-border rounded-lg bg-background text-sm outline-none"
                  autoFocus
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  required
                  className="w-full p-2 border border-border rounded-lg bg-background text-sm outline-none"
                />
                {session && !isAdmin && (
                  <p className="text-xs text-destructive">Conta sem permissão de admin.</p>
                )}
                <button type="submit" disabled={signingIn} className="btn-gold w-full py-2 rounded-lg text-xs disabled:opacity-50">
                  {signingIn ? "Entrando..." : "Entrar"}
                </button>
                {adminExists === false && (
                  <button
                    type="button"
                    onClick={() => setSetupMode(true)}
                    className="w-full text-xs text-accent hover:underline"
                  >
                    Configurar primeiro admin
                  </button>
                )}
              </form>
            )}
          </div>
        )}


        {isOpen && isAuthenticated && (
          <div className="absolute bottom-14 left-0 bg-card p-6 rounded-xl shadow-2xl border border-border w-72">
            <div className="flex items-center justify-between border-b border-border mb-4 pb-2">
              <h5 className="font-bold text-primary">Painel do Site</h5>
              <button onClick={handleSignOut} title="Sair" className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
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

            {/* ===== NOVO EMPREENDIMENTO ===== */}
            {activeModal === "add" && (
              <form onSubmit={handleAddEmpreendimento} className="space-y-3">
                <input
                  placeholder="Nome *"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                />
                <textarea
                  placeholder="Descrição (ex: Apartamentos Com 38m² | 45m²)"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background h-20 text-sm"
                />
                <textarea
                  placeholder="Detalhes (ex: 2 e 3 dormitórios com suíte)"
                  value={detalhe}
                  onChange={(e) => setDetalhe(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background h-16 text-sm"
                />
                <input
                  placeholder="Preço (ex: Sob Consulta)"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                />

                {/* Upload de fotos */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver ? "border-accent bg-accent/10" : "border-border"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileSelect(e.dataTransfer.files, "add");
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Arraste fotos aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Máximo 12 fotos ({imageFiles.length}/12)</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files, "add")}
                    className="hidden"
                    id="add-photos"
                  />
                  <label
                    htmlFor="add-photos"
                    className="btn-gold px-4 py-2 rounded-lg text-xs cursor-pointer inline-block mt-2"
                  >
                    Selecionar Fotos
                  </label>
                </div>

                {/* Preview das fotos */}
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {imageFiles.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-16 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageFile(i)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" disabled={saving} className="btn-gold w-full py-3 rounded-lg">
                  {saving ? "Salvando..." : "Salvar Empreendimento"}
                </button>
              </form>
            )}

            {/* ===== EDITAR EMPREENDIMENTO ===== */}
            {activeModal === "editar" && (
              <div className="space-y-4">
                <select
                  value={editEmpId}
                  onChange={(e) => {
                    setEditEmpId(e.target.value);
                    if (e.target.value) loadEditEmp(e.target.value);
                  }}
                  className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                >
                  <option value="">Selecione um empreendimento</option>
                  {empreendimentos.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>

                {editEmpId && (
                  <>
                    <input
                      placeholder="Nome *"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                    />
                    <textarea
                      placeholder="Descrição (ex: Apartamentos Com 38m² | 45m²)"
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      className="w-full border border-border p-3 rounded-lg bg-background h-20 text-sm"
                    />
                    <textarea
                      placeholder="Detalhes (ex: 2 e 3 dormitórios com suíte)"
                      value={editDetalhe}
                      onChange={(e) => setEditDetalhe(e.target.value)}
                      className="w-full border border-border p-3 rounded-lg bg-background h-16 text-sm"
                    />
                    <input
                      placeholder="Preço (ex: Sob Consulta)"
                      value={editPreco}
                      onChange={(e) => setEditPreco(e.target.value)}
                      className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={editAtivo}
                        onChange={(e) => setEditAtivo(e.target.checked)}
                        className="rounded"
                      />
                      Ativo (visível no site)
                    </label>
                    <button
                      onClick={handleUpdateEmpreendimento}
                      disabled={saving}
                      className="btn-gold w-full py-3 rounded-lg"
                    >
                      {saving ? "Salvando..." : "Salvar Alterações"}
                    </button>
                    <button
                      onClick={handleDeleteEmpreendimento}
                      className="w-full py-3 rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm"
                    >
                      Excluir Empreendimento
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ===== GERENCIAR FOTOS ===== */}
            {activeModal === "fotos" && (
              <div className="space-y-4">
                <select
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    if (e.target.value) loadFotosForEmp(e.target.value);
                    setPhotoFiles([]);
                  }}
                  className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                >
                  <option value="">Selecione um empreendimento</option>
                  {empreendimentos.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>

                {selectedEmpId && (
                  <>
                    <p className="text-xs text-muted-foreground">Fotos atuais: {empFotos.length}/12</p>

                    {/* Fotos existentes */}
                    <div className="grid grid-cols-3 gap-2">
                      {empFotos.map((foto) => (
                        <div key={foto.id} className="relative group">
                          <img src={foto.foto_url} alt="Foto" className="w-full h-20 object-cover rounded-lg" />
                          {empFotos.length > 1 && (
                            <button
                              onClick={() => handleDeleteFoto(foto)}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Adicionar mais fotos */}
                    {empFotos.length < 12 && (
                      <>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                            dragOver ? "border-accent bg-accent/10" : "border-border"
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                          }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            handleFileSelect(e.dataTransfer.files, "manage");
                          }}
                        >
                          <p className="text-sm text-muted-foreground mb-2">Adicionar mais fotos</p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files, "manage")}
                            className="hidden"
                            id="manage-photos"
                          />
                          <label
                            htmlFor="manage-photos"
                            className="btn-gold px-4 py-2 rounded-lg text-xs cursor-pointer inline-block"
                          >
                            Selecionar
                          </label>
                        </div>

                        {photoFiles.length > 0 && (
                          <>
                            <div className="grid grid-cols-5 gap-2">
                              {photoFiles.map((file, i) => (
                                <div key={i} className="relative group">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Nova ${i + 1}`}
                                    className="w-full h-14 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhotoFile(i)}
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={handleAddPhotosToEmp}
                              disabled={saving}
                              className="btn-gold w-full py-2 rounded-lg text-sm"
                            >
                              {saving ? "Enviando..." : `Adicionar ${photoFiles.length} foto(s)`}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== ALTERAR TEXTOS ===== */}
            {activeModal === "textos" && (
              <div className="space-y-4">
                {siteConfigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum texto configurado.</p>
                ) : (
                  siteConfigs.map((config) => (
                    <div key={config.id}>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {configLabels[config.chave] || config.chave}
                      </label>
                      {config.chave.includes("texto") ? (
                        <textarea
                          value={configValues[config.chave] || ""}
                          onChange={(e) => setConfigValues((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                          className="w-full border border-border p-3 rounded-lg bg-background h-24 text-sm"
                        />
                      ) : (
                        <input
                          value={configValues[config.chave] || ""}
                          onChange={(e) => setConfigValues((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                          className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                        />
                      )}
                    </div>
                  ))
                )}
                <button onClick={handleSaveConfigs} disabled={saving} className="btn-gold w-full py-3 rounded-lg">
                  {saving ? "Salvando..." : "Salvar Textos"}
                </button>
              </div>
            )}

            {/* ===== ATUALIZAR LINKS ===== */}
            {activeModal === "links" && (
              <div className="space-y-4">
                {siteConfigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum link configurado.</p>
                ) : (
                  siteConfigs.map((config) => (
                    <div key={config.id}>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {configLabels[config.chave] || config.chave}
                      </label>
                      <input
                        value={configValues[config.chave] || ""}
                        onChange={(e) => setConfigValues((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                        className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                        placeholder={config.chave === "whatsapp" ? "5511999999999" : "https://..."}
                      />
                    </div>
                  ))
                )}
                <button onClick={handleSaveConfigs} disabled={saving} className="btn-gold w-full py-3 rounded-lg">
                  {saving ? "Salvando..." : "Salvar Links"}
                </button>
              </div>
            )}

            {/* ===== DEPOIMENTOS ===== */}
            {activeModal === "depo" && (
              <div className="space-y-4">
                <textarea
                  value={novoDepoimento}
                  onChange={(e) => setNovoDepoimento(e.target.value)}
                  placeholder="Texto do depoimento..."
                  className="w-full border border-border p-3 rounded-lg bg-background h-24 text-sm"
                />
                <input
                  value={autorDepoimento}
                  onChange={(e) => setAutorDepoimento(e.target.value)}
                  placeholder="Nome do autor (opcional)"
                  className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                />
                <button onClick={handleAddDepoimento} className="btn-gold w-full py-3 rounded-lg">
                  Postar Depoimento
                </button>

                {/* Lista de depoimentos existentes */}
                {depoimentos.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Depoimentos existentes:</h4>
                    {depoimentos.map((dep) => (
                      <div key={dep.id} className="bg-background p-3 rounded-lg flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{dep.texto}</p>
                          {dep.autor && <p className="text-xs text-muted-foreground mt-1">— {dep.autor}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteDepoimento(dep.id)}
                          className="text-destructive hover:text-destructive/80 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== ADICIONAR ADMIN ===== */}
            {activeModal === "novo-admin" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Crie um novo usuário com permissão de administrador. Se o e-mail já existir, a senha será redefinida e o papel admin será atribuído.
                </p>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="E-mail do novo admin"
                  className="w-full border border-border p-3 rounded-lg bg-background text-sm"
                />
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Senha (mín. 8 caracteres)"
                  minLength={8}
                  className="w-full border border-border rounded-lg p-3 bg-background text-sm"
                />
                <button
                  onClick={handleCreateAdditionalAdmin}
                  disabled={creatingAdmin}
                  className="btn-gold w-full py-3 rounded-lg"
                >
                  {creatingAdmin ? "Criando..." : "Criar Admin"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;
