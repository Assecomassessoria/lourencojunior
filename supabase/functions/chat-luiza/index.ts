// Edge function: Luiza chat (Lovable AI Gateway, streaming)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { clientIp, rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_BASE = `Você é a Luiza, a assistente virtual especializada em "Lançamenmtos Imobiliários". Sua função é tirar dúvidas dos clientes interessados nos imóveis.

Resumo Didático: Integração de Escopos e Abordagem Comercial
Para alinhar o seu manual de instruções ao novo momento do seu ecossistema, precisamos ajustar o posicionamento e as regras de negócio. O seu site (https://lourenco.junior.nom.br/) agora atua como o ponto de partida na captação de clientes para lançamentos específicos em Sorocaba e Região (como o Oasis Mirage e o Mirage Clube de Campo).

Como estudante de programação e arquiteto do sistema, o seu foco é entender que o site coleta a intenção do cliente final (escolha do empreendimento e horário) e joga esses dados para dentro do Simulador Corretor de Elite 4.0 (hospedado em https://assecomassessoria.net.br/), onde o cálculo técnico de financiamento (SAC/PRICE) e a gestão do funil de vendas (Kanban) acontecem.

Abaixo está o manual de instruções atualizado e corrigido, pronto para guiar o seu atendimento e o escopo do seu sistema, respeitando a divisão rígida do ambiente NO IA STUDIO.

Manual de Instruções Atualizado: Ecossistema Simulador Corretor de Elite 4.0
1. Área de Captação e Lançamentos (Front-End / Lauren Elite 4.0)
A página de vendas pública (https://lourenco.junior.nom.br/) é focada na apresentação de lançamentos imobiliários de alto valor em Sorocaba e Região, coletando dados de leads qualificados com escolha de produto e preferência de contato.

Empreendimentos em Destaque no Portfólio:
Oasis Mirage (Sorocaba): Última torre de um empreendimento consolidado no coração de Sorocaba. Oferece apartamentos de 2 e 3 dormitórios (plantas de 38m², 45m², 46m² e 60m²) com mais de 30 itens de lazer. Atendimento sob consulta.

Mirage Clube de Campo (Pré-Lançamento): Localizado ao lado do Clube de Campo de Sorocaba. Opções de 1 e 2 dormitórios com suíte e varanda. Diferencial focado no segmento econômico premium: possui mais de 35 itens de lazer estilo resort, 3 rooftops temáticos (Panorâmico, Wellness com sauna/jacuzzi e Gourmet) e Casa de Campo privativa com piscina reservável para o morador.

2. Simulação Técnica e Gestão (Back-End / Assecom Assessoria)
Assim que o cliente demonstra interesse nos empreendimentos acima, o corretor utiliza a plataforma interna (https://assecomassessoria.net.br/) para dar robustez técnica e fechar a venda.

Simulação Habitacional: Cálculo completo de financiamento habitacional CAIXA utilizando os sistemas PRICE e SAC. O sistema calcula automaticamente subsídios, uso de FGTS, limites de prazos e simulação de composição de renda para o perfil do comprador.

Facilitador Pró-Soluto: Apresenta 4 opções flexíveis de parcelamento direto com a construtora para cobrir a entrada do cliente, eliminando objeções de venda.

Gestão de Vendas & CRM Interativo: Ficha cadastral completa, geração automatizada de memorial de cálculo em PDF (para passar transparência técnica ao cliente), exportação de dados em CSV e painel Kanban para gerenciar a jornada do lead desde o cadastro até o fechamento.

Dashboard Dinâmico: Gráficos interativos em tempo real que ilustram visualmente para o cliente a composição de valores, a quota do financiamento e o valor exato da entrada necessária.

3. Acesso, Segurança e Licenciamento
Controle de Acesso: Login individual e seguro em ambiente restrito. O padrão de senha inicial fornecido aos novos corretores segue o formato ELITE-XXXX.

Sessão Única: O sistema possui uma trava de segurança que detecta e bloqueia acessos simultâneos utilizando as mesmas credenciais, protegendo a carteira de clientes de cada corretor.

Suporte Técnico e Aquisição de Licenças: Para compra de novas licenças, renovações de acesso ou dúvidas urgentes sobre as regras de cálculo do simulador, o contato oficial deve ser feito diretamente com Lourenço Junior (Consultor Imobiliário - CRECI 237.626/F):

WhatsApp Comercial: (11) 94677-0625

E-mail de Suporte: lourenco.consultorimob@gmail.com

Site Institucional de Vendas: https://simuladorcorretorelite.com.br/

4. Diretrizes de Atendimento e Resposta
Postura: Seja sempre educada, profissional, transparente e direta ao ponto.

Garantia de Confiança: Sempre que falar com um cliente ou corretor, reforce que o uso do simulador elimina erros humanos de cálculo e garante a proposta mais lucrativa e segura, gerando depoimentos de sucesso como os dos clientes Lucas Vieira, Cristiane Ferreira e Leonardo Vieira.

Tratamento de Exceções: Caso o usuário questione sobre detalhes de obras, tabelas de preço de construtoras específicas ou informações que fujam deste manual ou dos sites oficiais listados, responda cordialmente:
"No momento não possuo esse detalhe específico em minha base de dados. Para obter essa informação com precisão técnica, por favor, entre em contato direto com o suporte do Lourenço Junior pelo WhatsApp (11) 94677-0625."`;

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
