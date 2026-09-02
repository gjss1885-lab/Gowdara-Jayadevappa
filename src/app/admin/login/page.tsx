"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Login failed (server error ${res.status}).`);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-md border border-line bg-white/70 p-6">
        <h1 className="font-display text-xl text-ink">Admin Login</h1>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/90">Password</span>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
          />
        </label>
        {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
