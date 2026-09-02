"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client, used for customer OTP login on the client side.
// Only call this where isSupabaseConfigured is true (see lib/config.ts) --
// it will throw if the env vars are missing.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }

  return createBrowserClient(url, anonKey);
}
