import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Catches the link from Supabase's magic-link email (or any other
// PKCE-style auth redirect) and exchanges its one-time `code` for a real
// logged-in session, stored in cookies. Without this route, clicking the
// email link just lands on the site with no session -- the code is valid
// but nothing ever exchanges it.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = safeRedirectPath(url.searchParams.get("redirect_to"), "/account");

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
