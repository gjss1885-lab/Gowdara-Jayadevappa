import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isValidAdminSessionToken,
} from "@/lib/admin-auth";
import { adminEmails, isSupabaseConfigured } from "@/lib/config";

// Protects the admin panel and its API routes. Two ways in:
// 1. The shared-password session cookie (see lib/admin-auth.ts), set at
//    /admin/login.
// 2. Being logged in -- via the normal customer email/phone OTP login at
//    /login -- with an email listed in ADMIN_EMAILS. When that's found we
//    mint the same admin cookie so the rest of this request, and future
//    ones, use the fast path above without checking Supabase again.
// /admin/login and its API route are left open so there's a way in.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (isValidAdminSessionToken(token)) {
    return NextResponse.next();
  }

  if (await isAllowlistedAdminEmail(request)) {
    const response = NextResponse.next();
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

// Checks whether the visitor already has a logged-in Supabase customer
// session whose email is on the ADMIN_EMAILS allowlist. Uses its own
// Supabase client (rather than lib/supabase/server.ts) because proxy reads
// and writes cookies through NextRequest/NextResponse, not next/headers.
async function isAllowlistedAdminEmail(request: NextRequest): Promise<boolean> {
  if (!isSupabaseConfigured || adminEmails.length === 0) return false;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Proxy only needs to read the customer's session here -- the admin
        // cookie set above is what actually persists this check.
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();
  return Boolean(email && adminEmails.includes(email));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
