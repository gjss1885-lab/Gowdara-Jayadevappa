import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "@/lib/config";

// Service-role Supabase client for server-side admin writes (product CRUD,
// order status updates). This key must NEVER be exposed to the browser --
// only import this file from Route Handlers / Server Components.
export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured) {
    throw new Error(
      "Supabase admin client requested but SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
