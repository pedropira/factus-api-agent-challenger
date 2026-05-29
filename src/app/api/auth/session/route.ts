// GET /api/auth/session — returns current user or null

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return Response.json({ user });
  } catch (e) {
    console.error("[Auth Session]", e);
    return Response.json({ user: null });
  }
}
