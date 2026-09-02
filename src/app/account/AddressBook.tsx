"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Plus } from "lucide-react";
import type { Address } from "@/lib/types";

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn't remove that address. Please try again.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        setError("Couldn't update that address. Please try again.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 ? (
        <p className="text-sm text-ink/80">No saved addresses yet.</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-line bg-white/60 p-4"
            >
              <div className="text-sm text-ink/90">
                <div className="flex items-center gap-2 font-medium text-ink">
                  {addr.label || "Address"}
                  {addr.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-sm font-medium text-maroon">
                      <Star className="h-3 w-3 fill-maroon" /> Default
                    </span>
                  )}
                </div>
                <p className="mt-1">{addr.customerName} &middot; {addr.phone}</p>
                <p className="text-ink/70">
                  {addr.address}, {addr.city}, {addr.state} {addr.pincode}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={busyId === addr.id}
                    className="text-sm font-medium text-maroon hover:underline disabled:opacity-60"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  disabled={busyId === addr.id}
                  aria-label="Remove address"
                  className="text-ink/50 hover:text-maroon disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}

      {adding ? (
        <AddressForm
          onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-maroon hover:underline"
        >
          <Plus className="h-4 w-4" /> Add New Address
        </button>
      )}
    </div>
  );
}

function AddressForm({ onCancel, onSaved }: { onCancel?: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    label: "",
    customerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      onSaved();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-line bg-white/50 p-4"
    >
      <Field label="Label (optional, e.g. Home, Work)" value={form.label} onChange={(v) => update("label", v)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full Name" value={form.customerName} onChange={(v) => update("customerName", v)} required />
        <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} required type="tel" />
      </div>
      <Field label="Address" value={form.address} onChange={(v) => update("address", v)} required />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
        <Field label="State" value={form.state} onChange={(v) => update("state", v)} required />
        <Field label="Pincode" value={form.pincode} onChange={(v) => update("pincode", v)} required />
      </div>
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-maroon px-5 py-2 text-sm font-semibold text-white transition hover:bg-maroon-dark disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Address"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-sm text-ink/70 hover:underline disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink/90">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
      />
    </label>
  );
}
