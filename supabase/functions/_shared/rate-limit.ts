// Simple per-key per-minute rate limiter backed by public.rate_limits.
// Service role only (table has RLS enabled with no policies).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
}

export async function rateLimit(
  key: string,
  limitPerMinute: number,
): Promise<{ ok: boolean; remaining: number }> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, srv, { auth: { persistSession: false } });
  const windowStart = new Date();
  windowStart.setSeconds(0, 0);
  const ws = windowStart.toISOString();

  // Try insert (count=1). If conflict, increment.
  const { error: insErr } = await sb
    .from("rate_limits")
    .insert({ key, window_start: ws, count: 1 });

  if (insErr) {
    // Likely duplicate key: read + update
    const { data: row } = await sb
      .from("rate_limits")
      .select("count")
      .eq("key", key)
      .eq("window_start", ws)
      .maybeSingle();
    const current = (row?.count ?? 0) + 1;
    await sb
      .from("rate_limits")
      .update({ count: current })
      .eq("key", key)
      .eq("window_start", ws);
    return { ok: current <= limitPerMinute, remaining: Math.max(0, limitPerMinute - current) };
  }
  return { ok: 1 <= limitPerMinute, remaining: limitPerMinute - 1 };
}
