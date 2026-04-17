// Edge function: Extract text from PDF using unpdf (pure-JS, no native deps)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    if (!documentId) throw new Error("documentId required");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: doc, error: docErr } = await sb
      .from("luiza_documents")
      .select("id, arquivo_path")
      .eq("id", documentId)
      .single();
    if (docErr || !doc) throw new Error("Documento não encontrado");

    const { data: file, error: dlErr } = await sb.storage
      .from("luiza-docs")
      .download(doc.arquivo_path);
    if (dlErr || !file) throw new Error("Erro baixando PDF");

    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const conteudo = (Array.isArray(text) ? text.join("\n") : text).trim();

    await sb
      .from("luiza_documents")
      .update({ conteudo, paginas: totalPages })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({ ok: true, paginas: totalPages, chars: conteudo.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
