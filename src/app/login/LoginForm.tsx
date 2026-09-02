"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { isSupabaseConfigured } from "@/lib/config";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Phone OTP needs a paid SMS provider connected in Supabase (Authentication
// -> Providers -> Phone) before it'll actually deliver codes -- see
// SETUP.md's "Turning on phone (SMS) login" section. Flip this to true once
// that's connected; the phone tab and all its logic are already built.
const PHONE_LOGIN_ENABLED = false;

type Method = "email" | "phone";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to send the customer after they log in -- e.g. checkout sends
  // people here as /login?redirect_to=/checkout so they land right back
  // where they were trying to go instead of a generic account page.
  const redirectTo = safeRedirectPath(searchParams.get("redirect_to"), "/account");
  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Account Login</h1>
        <p className="mt-3 text-ink/80">
          Customer login (email or phone OTP) is wired up in the code and will switch on
          automatically once this store is connected to Supabase — see the setup guide for the
          two-minute steps.
        </p>
      </div>
    );
  }

  function switchMethod(next: Method) {
    setMethod(next);
    setStep("input");
    setError(null);
    setMessage(null);
    setOtp("");
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createSupabaseBrowserClient();

      const { error: sendError } =
        method === "email"
          ? await supabase.auth.signInWithOtp({
              email,
              options: {
                shouldCreateUser: true,
                emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
              },
            })
          : await supabase.auth.signInWithOtp({
              phone: normalizePhone(phone),
              options: { shouldCreateUser: true },
            });

      if (sendError) {
        setError(sendError.message);
      } else {
        setMessage(
          method === "email"
            ? `We've sent a 6-digit code to ${email}.`
            : `We've sent a 6-digit code by SMS to ${normalizePhone(phone)}.`
        );
        setStep("otp");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createSupabaseBrowserClient();

      const { error: verifyError } =
        method === "email"
          ? await supabase.auth.verifyOtp({ email, token: otp, type: "email" })
          : await supabase.auth.verifyOtp({
              phone: normalizePhone(phone),
              token: otp,
              type: "sms",
            });

      if (verifyError) {
        setError(verifyError.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-md py-20">
      <h1 className="mb-2 font-display text-2xl text-ink">Account Login</h1>
      <p className="mb-6 text-sm text-ink/80">
        {redirectTo === "/checkout"
          ? "Log in to complete your checkout — no password needed, just a one-time code."
          : "Log in with a one-time code — no password needed."}
      </p>

      {PHONE_LOGIN_ENABLED && step === "input" && (
        <div className="mb-6 flex rounded-md border border-line bg-white/50 p-1 text-sm">
          <button
            type="button"
            onClick={() => switchMethod("email")}
            className={clsx(
              "flex-1 rounded px-3 py-1.5 font-medium transition",
              method === "email" ? "bg-maroon text-white" : "text-ink/80"
            )}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => switchMethod("phone")}
            className={clsx(
              "flex-1 rounded px-3 py-1.5 font-medium transition",
              method === "phone" ? "bg-maroon text-white" : "text-ink/80"
            )}
          >
            Phone
          </button>
        </div>
      )}

      {step === "input" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {method === "email" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink/90">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
              />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink/90">Phone number</span>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
              />
              <span className="mt-1 block text-sm text-ink/70">
                Include the country code (e.g. +91 for India).
              </span>
            </label>
          )}
          {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {message && <p className="text-sm text-ink/80">{message}</p>}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">6-digit code</span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
            />
          </label>
          {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Log In"}
          </button>
          <button
            type="button"
            onClick={() => setStep("input")}
            className="w-full text-center text-sm text-ink/70 hover:text-maroon"
          >
            Use a different {method === "email" ? "email" : "phone number"}
          </button>
        </form>
      )}
    </div>
  );
}

function normalizePhone(raw: string): string {
  // Supabase expects E.164 (e.g. +919876543210). Strip spaces/dashes but
  // keep a leading + if the person typed one.
  const trimmed = raw.trim().replace(/[\s-()]/g, "");
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}
