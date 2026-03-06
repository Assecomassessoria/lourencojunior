import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import empreendimento1 from "@/assets/empreendimento-1.jpg";

type Empreendimento = {
  id: string;
  nome: string;
  descricao: string | null;
  detalhe: string | null;
  preco: string | null;
  imagem_url: string | null;
};

const EmpreendimentosSection = () => {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmpreendimentos = async () => {
      const { data, error } = await supabase
        .from("empreendimentos")
        .select("id, nome, descricao, detalhe, preco, imagem_url")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (data && data.length > 0) {
        setEmpreendimentos(data);
      } else {
        // Fallback to hardcoded if DB is empty
        setEmpreendimentos([{
          id: "fallback",
          nome: "Oasis Mirage",
          descricao: "Apartamentos Com 38m² | 45m² | 46m² | 60m².",
          detalhe: "Apartamentos de 2 e 3 dormitórios com suíte na Zona Leste. Lazer completo.",
          preco: "Sob Consulta",
          imagem_url: null,
        }]);
      }
      setLoading(false);
    };

    fetchEmpreendimentos();

    // Real-time subscription
    const channel = supabase
      .channel("empreendimentos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "empreendimentos" }, () => {
        fetchEmpreendimentos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section id="empreendimentos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title text-center mb-12"
        >
          Empreendimentos em <span className="text-accent">Destaque</span>
        </motion.h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {empreendimentos.map((emp, i) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={emp.imagem_url || empreendimento1}
                    alt={emp.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-display font-bold text-primary mb-2">{emp.nome}</h4>
                  <p className="text-muted-foreground text-sm mb-2">{emp.descricao}</p>
                  <p className="text-muted-foreground text-sm mb-4">{emp.detalhe}</p>
                  <div className="flex justify-between items-center border-t border-border pt-4">
                    <span className="text-accent font-bold font-display">{emp.preco}</span>
                    <a href="#fale-conosco" className="text-accent font-semibold hover:underline text-sm">
                      Saiba Mais
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EmpreendimentosSection;
