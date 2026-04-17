import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Cancelar inscrição | Lourenço Junior";
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
          return;
        }
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("done");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch (e: any) {
      setError(e?.message ?? "Erro ao processar.");
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <article className="max-w-md w-full bg-card border border-border rounded-lg shadow-sm p-8 text-center">
        <h1 className="font-display text-2xl text-primary mb-4">
          Cancelar inscrição de e-mails
        </h1>
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p>Validando link...</p>
          </div>
        )}
        {state === "valid" && (
          <>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja parar de receber notificações por e-mail?
            </p>
            <Button onClick={handleConfirm} className="w-full">
              Confirmar cancelamento
            </Button>
          </>
        )}
        {state === "submitting" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p>Processando...</p>
          </div>
        )}
        {state === "done" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-accent" />
            <p className="text-foreground">Inscrição cancelada com sucesso.</p>
          </div>
        )}
        {state === "already" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-accent" />
            <p className="text-foreground">Você já havia cancelado a inscrição.</p>
          </div>
        )}
        {state === "invalid" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-foreground">Link inválido ou expirado.</p>
          </div>
        )}
        {state === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-foreground">Não foi possível processar.</p>
            {error && <p className="text-xs text-muted-foreground">{error}</p>}
          </div>
        )}
      </article>
    </main>
  );
};

export default Unsubscribe;
