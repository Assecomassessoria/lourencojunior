import { useState } from "react";
import { Settings, X, Plus, Image, FileText, Link, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "472370";

const AdminPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

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

  const menuItems = [
    { id: "add", label: "Novo Empreendimento", icon: Plus },
    { id: "fotos", label: "Gerenciar Fotos", icon: Image },
    { id: "textos", label: "Alterar Textos", icon: FileText },
    { id: "links", label: "Atualizar Links", icon: Link },
    { id: "depo", label: "Depoimentos", icon: MessageSquare },
  ];

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleToggle}
          className="bg-primary w-12 h-12 rounded-full text-accent shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Password Input */}
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
                  onClick={() => { setShowPasswordInput(false); setPassword(""); }}
                  className="text-xs py-2 px-3 rounded-lg border border-border text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin Menu */}
        {isOpen && isAuthenticated && (
          <div className="absolute bottom-14 left-0 bg-card p-6 rounded-xl shadow-2xl border border-border w-72">
            <h5 className="font-display font-bold border-b border-border mb-4 pb-2 text-primary">
              Painel do Site
            </h5>
            <ul className="space-y-3">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    setActiveModal(item.id);
                    setIsOpen(false);
                  }}
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

      {/* Modals */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-navy-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-card p-8 rounded-xl max-w-md w-full m-4 shadow-2xl border border-border"
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
              <div className="space-y-3">
                <input placeholder="Nome do Empreendimento" className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body" />
                <textarea placeholder="Descrição" className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body h-24" />
                <button onClick={() => { toast.success("Funcionalidade em desenvolvimento"); setActiveModal(null); }} className="btn-gold w-full py-3 rounded-lg">Salvar</button>
              </div>
            )}
            {activeModal === "fotos" && (
              <div className="space-y-3">
                <input type="file" multiple className="w-full font-body text-sm" accept="image/*" />
                <button onClick={() => { toast.success("Funcionalidade em desenvolvimento"); setActiveModal(null); }} className="btn-gold w-full py-3 rounded-lg">Fazer Upload</button>
              </div>
            )}
            {activeModal === "textos" && (
              <div className="space-y-3">
                <textarea placeholder="Novo texto..." className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body h-32" />
                <button onClick={() => { toast.success("Funcionalidade em desenvolvimento"); setActiveModal(null); }} className="btn-gold w-full py-3 rounded-lg">Atualizar</button>
              </div>
            )}
            {activeModal === "links" && (
              <div className="space-y-3">
                <input placeholder="URL" className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body" />
                <button onClick={() => { toast.success("Funcionalidade em desenvolvimento"); setActiveModal(null); }} className="btn-gold w-full py-3 rounded-lg">Salvar Links</button>
              </div>
            )}
            {activeModal === "depo" && (
              <div className="space-y-3">
                <textarea placeholder="Novo depoimento..." className="w-full border border-border p-3 rounded-lg bg-background text-foreground font-body h-24" />
                <button onClick={() => { toast.success("Funcionalidade em desenvolvimento"); setActiveModal(null); }} className="btn-gold w-full py-3 rounded-lg">Postar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;
