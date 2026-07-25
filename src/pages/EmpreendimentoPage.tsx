import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Copy, MessageCircle } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import empreendimentoFallback from "@/assets/empreendimento-1.jpg";

type Empreendimento = {
  id: string;
  nome: string;
  descricao: string | null;
  detalhe: string | null;
  preco: string | null;
  imagem_url: string | null;
};

const EmpreendimentoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [emp, setEmp] = useState<Empreendimento | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const { data } = await supabase
        .from("empreendimentos")
        .select("id, nome, descricao, detalhe, preco, imagem_url")
        .eq("ativo", true);

      const match = (data || []).find((e) => slugify(e.nome) === slug.toLowerCase());
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setEmp(match);

      const { data: fotosData } = await supabase
        .from("empreendimento_fotos")
        .select("foto_url, ordem")
        .eq("empreendimento_id", match.id)
        .order("ordem", { ascending: true });

      const urls = (fotosData || []).map((f) => f.foto_url);
      setFotos(urls.length > 0 ? urls : match.imagem_url ? [match.imagem_url] : [empreendimentoFallback]);
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (emp) {
      document.title = `${emp.nome} | Lourenço Junior`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && emp.descricao) {
        metaDesc.setAttribute("content", emp.descricao.slice(0, 160));
      }
    }
  }, [emp]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copiado!", description: "Cole onde quiser compartilhar." });
  };

  const handleWhatsApp = () => {
    const text = `Confira este empreendimento: ${emp?.nome}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: emp?.nome, text: emp?.descricao || "", url: shareUrl });
      } catch {}
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !emp) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-20 text-center">
          <h1 className="text-3xl font-display font-bold text-primary mb-4">Empreendimento não encontrado</h1>
          <p className="text-muted-foreground mb-8">O empreendimento que você procura não está mais disponível.</p>
          <Link to="/">
            <Button variant="default">Voltar ao início</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="relative rounded-xl overflow-hidden shadow-lg border border-border bg-card">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {fotos.map((src, i) => (
                    <div key={i} className="flex-[0_0_100%] min-w-0">
                      <img src={src} alt={`${emp.nome} - foto ${i + 1}`} className="w-full h-[420px] object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              {fotos.length > 1 && (
                <>
                  <button
                    onClick={() => emblaApi?.scrollPrev()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/60 hover:bg-primary/80 text-accent rounded-full p-2"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/60 hover:bg-primary/80 text-accent rounded-full p-2"
                    aria-label="Próxima"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-3">{emp.nome}</h1>
              {emp.descricao && <p className="text-lg text-foreground mb-3">{emp.descricao}</p>}
              {emp.detalhe && <p className="text-muted-foreground mb-6 whitespace-pre-line">{emp.detalhe}</p>}

              <div className="flex items-center gap-4 border-y border-border py-4 mb-6">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="text-2xl font-display font-bold text-accent">{emp.preco}</span>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <Button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button onClick={handleCopy} variant="outline">
                  <Copy className="w-4 h-4 mr-2" /> Copiar link
                </Button>
                <Button onClick={handleNativeShare} variant="outline">
                  <Share2 className="w-4 h-4 mr-2" /> Compartilhar
                </Button>
              </div>

              <a
                href="/#fale-conosco"
                className="inline-block bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-3 rounded-md transition"
              >
                Tenho interesse
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmpreendimentoPage;
