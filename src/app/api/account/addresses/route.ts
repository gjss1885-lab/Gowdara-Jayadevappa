import { NextResponse } from "next/server";
import { listAddresses, createAddress } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";

// Saved addresses only make sense once a customer can actually log in --
// there's no account to attach them to otherwise.
async function requireUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return user;
}

export const GET = withApiErrorHandling(async () => {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  const addresses = await listAddresses(user.id);
  return NextResponse.json({ addresses });
});

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json();
  const { label, customerName, phone, address, city, state, pincode, isDefault } = body ?? {};

  if (!customerName || !phone || !address || !city || !state || !pincode) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const created = await createAddress(user.id, {
    label: label || undefined,
    customerName,
    phone,
    address,
    city,
    state,
    pincode,
    isDefault: Boolean(isDefault),
  });
  return NextResponse.json({ address: created }, { status: 201 });
});
