"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check } from "lucide-react";

// Editable name + email + phone for the logged-in customer. Starts
// read-only (just showing what's saved, or a prompt to add it) and
// switches to an edit form on click -- avoids an always-open form taking
// up space on every visit once someone's already filled it in.
//
// This email is a separate contact field kept in user_metadata, same as
// phone -- it is NOT the address the customer logged in with. Customers
// who sign in by phone (once phone login is turned on) have no email on
// their account at all otherwise, and there's no simple/safe way to let
// someone self-serve *change* their actual Supabase Auth login email from
// here (that requires a confirmation-link flow to both the old and new
// address). So instead this just gives them somewhere to put an email for
// order updates/contact purposes, independent of how they log in.
export function ProfileForm({
  initialFullName,
  initialEmail,
  initialPhone,
}: {
  initialFullName: string;
  initialEmail: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-md border border-line bg-white/60 p-4">
        <div className="text-sm">
          <p className="text-ink">
            <span className="text-ink/60">Name:</span> {initialFullName || "Not set"}
          </p>
          <p className="mt-1 text-ink">
            <span className="text-ink/60">Email:</span> {initialEmail || "Not set"}
          </p>
          <p className="mt-1 text-ink">
            <span className="text-ink/60">Phone:</span> {initialPhone || "Not set"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-maroon hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-line bg-white/50 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/90">Full Name</span>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/90">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/90">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
          />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white transition hover:bg-maroon-dark disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFullName(initialFullName);
            setEmail(initialEmail);
            setPhone(initialPhone);
            setError(null);
            setEditing(false);
          }}
          disabled={submitting}
          className="text-sm text-ink/70 hover:underline disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
