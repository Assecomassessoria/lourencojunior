import { Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-4 text-center space-y-4">
        <div className="flex justify-center gap-4">
          <a
            href="https://www.instagram.com/lancamentos_lancamentosimob"
            target="_blank"
            rel="noreferrer"
            className="text-primary-foreground/60 hover:text-accent transition"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://www.facebook.com/lancametosimobiliarios"
            target="_blank"
            rel="noreferrer"
            className="text-primary-foreground/60 hover:text-accent transition"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
        <p className="text-primary-foreground/60 text-sm font-body">
          © 2026 - Todos os direitos reservados | Lourenço Junior - Consultor Imobiliário / CRECI 237.626/F
        </p>
      </div>
    </footer>
  );
};

export default Footer;
