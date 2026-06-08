import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validEmail(s: string) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

async function adminCount(): Promise<number> {
  const { count } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  return count ?? 0;
}

async function isCallerAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return false;
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", u.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = url.searchParams.get("action") ?? body.action ?? (req.method === "GET" ? "status" : "create");

    if (action === "status") {
      const count = await adminCount();
      return json({ admin_exists: count > 0, count });
    }

    if (action === "create") {
      const email = (body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";



      if (!validEmail(email)) return json({ error: "E-mail inválido" }, 400);
      if (typeof password !== "string" || password.length < 8) {
        return json({ error: "A senha precisa ter ao menos 8 caracteres" }, 400);
      }

      const existing = await adminCount();
      // If an admin already exists, only an authenticated admin can create more
      if (existing > 0) {
        const ok = await isCallerAdmin(req);
        if (!ok) return json({ error: "Apenas administradores podem criar novos admins" }, 403);
      }

      // Try to find existing user by email
      let userId: string | null = null;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) {
        userId = found.id;
        // Update password to provided one
        await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (cErr || !created.user) return json({ error: cErr?.message ?? "Falha ao criar usuário" }, 400);
        userId = created.user.id;
      }

      // Assign admin role (idempotent due to unique constraint)
      const { error: rErr } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      if (rErr) return json({ error: rErr.message }, 400);

      return json({ ok: true, user_id: userId, email });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
