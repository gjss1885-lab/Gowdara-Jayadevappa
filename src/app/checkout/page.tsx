import { redirect } from "next/navigation";
import { isRazorpayConfigured, isSupabaseConfigured, razorpayPublicKey } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAddresses } from "@/lib/db";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Checkout" };

// Checking who's logged in reads cookies on every request, so this can't be
// prerendered once at build time -- see the note on force-dynamic in
// account/page.tsx.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Require login before checkout -- but only once customer login is
  // actually wired up. Without Supabase configured there's no way to log
  // in at all, so guest checkout stays open rather than becoming a dead end.
  let addresses: Awaited<ReturnType<typeof listAddresses>> = [];
  let loggedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    if (!user) {
      redirect("/login?redirect_to=/checkout");
    }
    loggedIn = true;
    addresses = await listAddresses(user.id);
  }

  const razorpayEnabled = isRazorpayConfigured && Boolean(razorpayPublicKey);
  return <CheckoutForm razorpayEnabled={razorpayEnabled} savedAddresses={addresses} loggedIn={loggedIn} />;
}
