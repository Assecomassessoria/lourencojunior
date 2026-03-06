import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-navy-dark/80" />

      <div className="relative container mx-auto px-4 text-center pt-20">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="uppercase tracking-[0.3em] text-sm text-gold-light font-body font-semibold"
        >
          Sorocaba e Região
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold mt-6 mb-8 leading-tight text-secondary"
        >
          Encontre o seu próximo{" "}
          <br />
          <span className="text-accent">Lançamento Imobiliário</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-gold-light/80 max-w-2xl mx-auto mb-10 text-lg font-body leading-relaxed"
        >
          Segurança para quem você ama, rentabilidade para o que você planeja.
          Nossa consultoria guia investidores e famílias pelo caminho mais seguro
          e lucrativo do mercado imobiliário.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <a href="#empreendimentos" className="btn-gold rounded-full text-base">
            Ver Lançamentos
          </a>
          <a href="#fale-conosco" className="btn-navy rounded-full text-base border border-gold-light/30">
            Cadastre-se
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
