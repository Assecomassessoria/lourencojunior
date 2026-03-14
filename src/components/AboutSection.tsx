import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import profileImg from "@/assets/profile-lourenco.jpg";
import logoImg from "@/assets/logo-lourenco.png";

const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 bg-muted">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-48 h-48 rounded-full bg-primary overflow-hidden border-4 border-accent shadow-xl flex-shrink-0"
        >
          <img src={profileImg} alt="Lourenço Junior - Consultor Imobiliário" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1 text-center md:text-left"
        >
          <h3 className="text-3xl font-display font-bold text-primary uppercase">Lourenço Junior</h3>
          <p className="text-accent font-semibold mb-4 text-lg font-body">Consultor Imobiliário - CRECI 237.626/F</p>
          <p className="text-muted-foreground max-w-xl mb-6 font-body leading-relaxed">
            Encontrar a sua perfeita moradia exige mais do que um corretor, exige um parceiro. Com ética e foco total na
            sua necessidade, transformo lançamentos imobiliários na realização do seu novo capítulo de vida, ajudo você
            a fazer o melhor negócio.
          </p>
          <div className="flex flex-col md:flex-row gap-4 text-sm font-bold text-foreground font-body">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" /> (11) 94677-0625
            </span>
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" /> lourenco.consultorimob@mail.com
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
