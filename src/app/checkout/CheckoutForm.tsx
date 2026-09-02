"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from "@/lib/config";
import { NO_RETURNS_NOTE } from "@/lib/policies";
import type { Address } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutForm({
  razorpayEnabled,
  savedAddresses = [],
  loggedIn = false,
}: {
  razorpayEnabled: boolean;
  savedAddresses?: Address[];
  loggedIn?: boolean;
}) {
  const { lines, subtotal, clear, isHydrated } = useCart();
  const router = useRouter();
  const snapshotSent = useRef(false);

  // Best-effort "here's what they had in their cart" snapshot for the
  // abandoned-cart reminder email (see src/app/api/cron/abandoned-carts) --
  // fired once per checkout visit, not on every render/cart tweak. Nothing
  // here should ever interrupt checkout itself, so failures are ignored.
  useEffect(() => {
    if (!loggedIn || !isHydrated || lines.length === 0 || snapshotSent.current) return;
    snapshotSent.current = true;
    fetch("/api/account/cart-snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
        })),
        subtotal,
      }),
    }).catch(() => {
      // Silent -- see comment above.
    });
  }, [loggedIn, isHydrated, lines, subtotal]);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">(
    razorpayEnabled ? "razorpay" : "cod"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");
  const [form, setForm] = useState({
    customerName: defaultAddress?.customerName ?? "",
    email: "",
    phone: defaultAddress?.phone ?? "",
    address: defaultAddress?.address ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    pincode: defaultAddress?.pincode ?? "",
  });

  function applySavedAddress(id: string) {
    setSelectedAddressId(id);
    // Empty value is the "Enter a new address" option -- clear the
    // address-specific fields so the customer isn't left with a stale
    // saved address half-mixed with fresh input.
    if (!id) {
      setForm((prev) => ({
        ...prev,
        customerName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      }));
      return;
    }
    const addr = savedAddresses.find((a) => a.id === id);
    if (!addr) return;
    setForm((prev) => ({
      ...prev,
      customerName: addr.customerName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    }));
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;

  if (isHydrated && lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Nothing to check out</h1>
        <p className="mt-2 text-ink/80">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          paymentMethod,
          ...form,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // The page itself already redirects logged-out visitors to /login --
        // this only fires if a session expired between loading the page and
        // submitting the form.
        if (data.requiresLogin) {
          router.push("/login?redirect_to=/checkout");
          return;
        }
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (!data.razorpay) {
        clear();
        router.push(`/order/${data.orderId}`);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError("Could not load the payment gateway. Please try Cash on Delivery.");
        setSubmitting(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: "Gowdara Jayadevappa",
        description: `Order ${data.orderId}`,
        order_id: data.razorpay.razorpayOrderId,
        prefill: {
          name: form.customerName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#7a1f2b" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderId, ...response }),
          });
          if (verifyRes.ok) {
            clear();
            router.push(`/order/${data.orderId}`);
          } else {
            setError("Payment succeeded but verification failed. Please contact us with your order ID.");
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      razorpay.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 font-display text-3xl text-ink">Checkout</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">Use a saved address</span>
            {savedAddresses.length > 0 ? (
              <select
                value={selectedAddressId}
                onChange={(e) => applySavedAddress(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
              >
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label || "Address"} &mdash; {addr.address}, {addr.city}
                  </option>
                ))}
                <option value="">+ Enter a new address</option>
              </select>
            ) : (
              // No addresses saved yet -- an empty, disabled slot rather
              // than hiding the row, so the layout stays consistent and
              // it's clear where saved addresses will show up once the
              // customer has some (from My Account, after their first order).
              <select
                disabled
                className="w-full cursor-not-allowed rounded-md border border-line bg-cream-dark/40 px-3 py-2 text-ink/50 outline-none"
              >
                <option>No saved addresses yet — fill in the details below</option>
              </select>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={form.customerName} onChange={(v) => updateField("customerName", v)} required />
            <Field label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} required type="tel" />
          </div>
          <Field label="Email" value={form.email} onChange={(v) => updateField("email", v)} required type="email" />
          <Field label="Address" value={form.address} onChange={(v) => updateField("address", v)} required />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" value={form.city} onChange={(v) => updateField("city", v)} required />
            <Field label="State" value={form.state} onChange={(v) => updateField("state", v)} required />
            <Field label="Pincode" value={form.pincode} onChange={(v) => updateField("pincode", v)} required />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Payment Method</p>
            <div className="space-y-2">
              {razorpayEnabled && (
                <label className="flex items-center gap-2 rounded-md border border-line p-3 text-sm has-[:checked]:border-maroon">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                  />
                  Pay Online (Cards / UPI / Netbanking)
                </label>
              )}
              <label className="flex items-center gap-2 rounded-md border border-line p-3 text-sm has-[:checked]:border-maroon">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                Cash on Delivery
              </label>
              {!razorpayEnabled && (
                <p className="text-sm text-ink/70">
                  Online payment isn’t connected yet — this order will be reserved as Cash on
                  Delivery until Razorpay is set up.
                </p>
              )}
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-maroon">{error}</p>}

          <p className="text-sm text-ink/60">{NO_RETURNS_NOTE}</p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white transition hover:bg-maroon-dark disabled:opacity-60"
          >
            {submitting ? "Processing..." : `Place Order · ${formatINR(total)}`}
          </button>
        </form>

        <div className="h-fit space-y-3 rounded-md border border-line bg-white/50 p-5">
          <h2 className="font-display text-lg text-ink">Order Summary</h2>
          {lines.map((l) => (
            <div key={l.productId} className="flex justify-between text-sm text-ink/80">
              <span>
                {l.name} &times; {l.quantity}
              </span>
              <span>{formatINR(l.price * l.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-3 text-sm text-ink/80">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-semibold text-ink">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </div>
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
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
      />
    </label>
  );
}
