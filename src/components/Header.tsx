import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-card/95 backdrop-blur-md shadow-lg" : "bg-card/80 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="#inicio" className="text-2xl font-display font-bold text-primary tracking-tighter">
          LOURENÇO <span className="text-accent">JUNIOR-Consultor Imobiliário</span>
        </a>
        <a href="#inico" className="text-1x1 font-dispaly font-bold text-primary tracking-tighter"></a>

        <nav className="hidden md:flex items-center space-x-6 font-medium font-body text-sm">
          <a href="#inicio" className="text-foreground hover:text-accent transition">
            Início
          </a>
          <a href="#empreendimentos" className="text-foreground hover:text-accent transition">
            Empreendimentos
          </a>
          <a href="#sobre" className="text-foreground hover:text-accent transition">
            Sobre
          </a>
          <div className="flex items-center gap-3 border-l pl-6 border-border">
            <a
              href="https://simuladorcorretorelite.com.br/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold uppercase text-accent hover:text-gold-dark transition"
            >
              Simulador Elite 4.0
            </a>
            <span className="text-border">|</span>
            <a
              href="https://assecomassessoria.net.br/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition"
            >
              Acesso Simulador
            </a>
            <span className="text-border">|</span>
            <a
              href="https://assecom.net.br/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition"
            >
              Limpa Nome
            </a>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5511946770625"
            target="_blank"
            rel="noreferrer"
            className="btn-gold flex items-center gap-2 text-sm py-2 px-4 rounded-full"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Contato</span>
          </a>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-primary">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-4 space-y-3 font-body">
          <a href="#inicio" onClick={() => setMenuOpen(false)} className="block text-foreground hover:text-accent">
            Início
          </a>
          <a
            href="#empreendimentos"
            onClick={() => setMenuOpen(false)}
            className="block text-foreground hover:text-accent"
          >
            Empreendimentos
          </a>
          <a href="#sobre" onClick={() => setMenuOpen(false)} className="block text-foreground hover:text-accent">
            Sobre
          </a>
          <a
            href="#fale-conosco"
            onClick={() => setMenuOpen(false)}
            className="block text-foreground hover:text-accent"
          >
            Fale Conosco
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
