import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, checkAdminPassword, createAdminSessionToken } from "@/lib/admin-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // This is a single shared password, not a per-user account, so there's
  // no such thing as locking out "just the attacker's account" -- capping
  // attempts per IP is the only lever available. 8 tries per 10 minutes is
  // generous for a real person who fat-fingers their own password, but
  // makes brute-forcing anything but a very weak password impractical.
  const ip = getClientIp(request);
  if (!rateLimit(`admin-login:${ip}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const { password } = (await request.json()) as { password?: string };

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not set. Add it to .env.local to enable the admin panel." },
      { status: 500 }
    );
  }

  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
