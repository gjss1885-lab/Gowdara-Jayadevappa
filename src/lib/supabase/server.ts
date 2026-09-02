import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/config";

// Server-side Supabase client (reads the logged-in customer's session from
// cookies). Used in Server Components / Route Handlers to know who's logged
// in for the "My Account" page. Returns null if Supabase isn't configured
// yet, so callers should check before using it.
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component sometimes, where
            // cookies can't be written. Safe to ignore if you have proxy
            // refreshing sessions elsewhere.
          }
        },
      },
    }
  );
}
