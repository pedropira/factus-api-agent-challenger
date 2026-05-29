// POST /api/auth/logout — clear the session

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error("[Auth Logout]", e);
    return Response.json({ error: "Logout failed" }, { status: 500 });
  }
}
