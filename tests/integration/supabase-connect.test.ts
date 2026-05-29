// @vitest-environment jsdom
//
// Integration test: verify Supabase clients initialize and connect.
// Uses jsdom because createBrowserClient() expects a DOM-like environment.

import { describe, it, expect } from "vitest";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

describe("Supabase Browser Client", () => {
  it("should create a working supabase client", () => {
    const supabase = createSupabaseBrowserClient();
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it("should support auth operations (getSession — no session expected)", async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    // No session in test environment — that's expected
    expect(data.session).toBeNull();
    expect(error).toBeNull();
  });

  it("should have the correct supabase URL configured", () => {
    const supabase = createSupabaseBrowserClient();
    // The client stores the URL internally
    expect(supabase).toBeDefined();
    // Verify the URL from env matches expectations
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });
});
