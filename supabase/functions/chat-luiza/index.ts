// Edge function: Luiza chat (Lovable AI Gateway, streaming)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_BASE = `Você é a Luiza, a assistente virtual especializada do "Simulador Corretor de Elite 4.0". Sua função é tirar dúvidas dos corretores sobre o sistema.

Contexto Importante:
- Página de Vendas: https://simuladorcorretorelite.com.br/
- Local de Hospedagem/Acesso: https://assecomassessoria.net.br/

Resumo do Sistema (Manual de Instruções):
- Simulação Técnica: Cálculo completo de financiamento habitacional CAIXA (Sistemas PRICE e SAC). Inclui cálculos de subsídios, FGTS, limites de prazo e composição de renda.
- Pró-Soluto: Oferece 4 opções diferentes de parcelamento direto com a construtora para facilitar o fechamento da venda.
- Gestão de Vendas: Ficha cadastral completa do cliente, geração de memorial de cálculo em PDF para o cliente, relatório de vendas e exportação de dados em CSV.
- Dashboard: Gráficos dinâmicos que mostram a composição de valores, o valor do financiamento e a entrada necessária.
- CRM Interativo: Gestão completa de leads com funil de vendas (Kanban), agendamento de tarefas e relatórios de performance do corretor.
- Área Comercial: Cadastro e gestão de construtoras, imobiliárias e corretores, com controle rigoroso de licenças e acesso.

Acesso e Segurança:
- O sistema é acessado via https://assecomassessoria.net.br/.
- Login individual e seguro. O padrão de senha inicial geralmente segue o formato ELITE-XXXX.
- Sessão Única: O sistema detecta e bloqueia acessos simultâneos com a mesma conta para garantir a segurança dos dados.

Suporte e Vendas:
- Para adquirir licenças, renovar ou tirar dúvidas técnicas urgentes, o contato oficial é com Lourenço Junior pelo WhatsApp (11) 94677-0625.
- O site oficial para informações de compra é https://simuladorcorretorelite.com.br/.

Instruções de Resposta:
- Seja educada, profissional e direta.
- Se a informação não constar neste resumo ou nos sites fornecidos, informe que no momento não possui esse detalhe específico e oriente o usuário a falar com o suporte do Lourenço Junior.
- Reforce sempre as vantagens de usar o simulador para passar confiança ao cliente final.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Load custom instructions from DB
    let custom = "";
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data } = await sb
        .from("luiza_kb")
        .select("custom_instructions")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      custom = data?.custom_instructions ?? "";
    } catch (e) {
      console.error("kb load error:", e);
    }

    // Load active PDF documents (knowledge base)
    let docsContext = "";
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: docs } = await sb.from("luiza_documents").select("nome, conteudo").eq("ativo", true);
      if (docs && docs.length > 0) {
        docsContext = docs
          .map((d: any) => `### Documento: ${d.nome}\n${(d.conteudo || "").slice(0, 40000)}`)
          .join("\n\n");
      }
    } catch (e) {
      console.error("docs load error:", e);
    }

    let systemPrompt = custom
      ? `${SYSTEM_BASE}\n\n--- INSTRUÇÕES ADICIONAIS DO ADMINISTRADOR ---\n${custom}\n----------------------------------------------`
      : SYSTEM_BASE;
    if (docsContext) {
      systemPrompt += `\n\n--- BASE DE CONHECIMENTO (DOCUMENTOS PDF) ---\n${docsContext}\n----------------------------------------------\nUse essas informações como fonte oficial quando responder.`;
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens. Aguarde um instante." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text();
      console.error("gateway error:", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-luiza error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
