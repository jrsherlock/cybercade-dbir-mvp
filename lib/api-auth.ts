import { createClient } from "@supabase/supabase-js";

/**
 * Resolves the authenticated player id from a request's `Authorization:
 * Bearer <token>` header. The token is a Supabase Auth access token (the
 * client signs in anonymously and attaches it to API calls).
 */
export async function getRequestUserId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
