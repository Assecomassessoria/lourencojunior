import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Depoimento = {
  id: string;
  texto: string;
  autor: string | null;
};

const DepoimentosSection = () => {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("depoimentos")
        .select("id, texto, autor")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      if (data) setDepoimentos(data);
    };
    fetch();

    const channel = supabase
      .channel("depoimentos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "depoimentos" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (depoimentos.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title text-center mb-12"
        >
          O que dizem nossos clientes
        </motion.h2>

        <div className="relative max-w-4xl mx-auto">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {depoimentos.map((dep) => (
                <div key={dep.id} className="min-w-0 shrink-0 grow-0 basis-full px-4">
                  <div className="bg-card border border-border rounded-xl p-8 md:p-10 text-center shadow-sm">
                    <Quote className="w-8 h-8 text-accent mx-auto mb-4 opacity-60" />
                    <p className="text-foreground font-body text-lg leading-relaxed italic mb-6">
                      "{dep.texto}"
                    </p>
                    {dep.autor && (
                      <p className="text-accent font-semibold font-display text-base">
                        — {dep.autor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {depoimentos.length > 1 && (
            <>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:opacity-80 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:opacity-80 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="flex justify-center gap-2 mt-6">
                {depoimentos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === selectedIndex ? "bg-accent w-6" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default DepoimentosSection;
