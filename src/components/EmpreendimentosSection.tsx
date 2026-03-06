import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import empreendimento1 from "@/assets/empreendimento-1.jpg";

type Empreendimento = {
  id: string;
  nome: string;
  descricao: string | null;
  detalhe: string | null;
  preco: string | null;
  imagem_url: string | null;
};

type Foto = {
  id: string;
  foto_url: string;
  ordem: number | null;
};

const ImageCarousel = ({ imagens, nome }: { imagens: string[]; nome: string }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative h-64 overflow-hidden">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {imagens.map((src, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
              <img
                src={src}
                alt={`${nome} - foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {imagens.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); emblaApi?.scrollPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary/60 hover:bg-primary/80 text-accent rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); emblaApi?.scrollNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/60 hover:bg-primary/80 text-accent rounded-full p-1.5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagens.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? "bg-accent" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const EmpreendimentosSection = () => {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [fotosMap, setFotosMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [empRes, fotosRes] = await Promise.all([
      supabase
        .from("empreendimentos")
        .select("id, nome, descricao, detalhe, preco, imagem_url")
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
      supabase
        .from("empreendimento_fotos")
        .select("id, empreendimento_id, foto_url, ordem")
        .order("ordem", { ascending: true }),
    ]);

    if (empRes.data && empRes.data.length > 0) {
      setEmpreendimentos(empRes.data);
    } else {
      setEmpreendimentos([{
        id: "fallback",
        nome: "Oasis Mirage",
        descricao: "Apartamentos Com 38m² | 45m² | 46m² | 60m².",
        detalhe: "Apartamentos de 2 e 3 dormitórios com suíte na Zona Leste. Lazer completo.",
        preco: "Sob Consulta",
        imagem_url: null,
      }]);
    }

    // Build fotos map
    const map: Record<string, string[]> = {};
    if (fotosRes.data) {
      for (const foto of fotosRes.data) {
        const empId = (foto as any).empreendimento_id;
        if (!map[empId]) map[empId] = [];
        map[empId].push(foto.foto_url);
      }
    }
    setFotosMap(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("emp-and-fotos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "empreendimentos" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "empreendimento_fotos" }, () => fetchData())
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
            {empreendimentos.map((emp, i) => {
              // Use fotos from the fotos table, fallback to imagem_url, then to default image
              const fotos = fotosMap[emp.id];
              const imagens = fotos && fotos.length > 0
                ? fotos
                : emp.imagem_url
                  ? [emp.imagem_url]
                  : [empreendimento1];

              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow duration-300 group"
                >
                  <ImageCarousel imagens={imagens} nome={emp.nome} />
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default EmpreendimentosSection;
