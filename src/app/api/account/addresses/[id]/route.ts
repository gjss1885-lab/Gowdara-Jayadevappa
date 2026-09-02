import { NextResponse } from "next/server";
import { deleteAddress, setDefaultAddress } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";

async function requireUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return user;
}

export const DELETE = withApiErrorHandling(async (
  _request: Request,
  { params }: RouteContext<"/api/account/addresses/[id]">
) => {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  const { id } = await params;
  await deleteAddress(user.id, id);
  return NextResponse.json({ ok: true });
});

// Only used to mark an address as the default -- there's nothing else about
// a saved address that gets edited in place; changing details just means
// deleting and re-adding it.
export const PATCH = withApiErrorHandling(async (
  request: Request,
  { params }: RouteContext<"/api/account/addresses/[id]">
) => {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body?.isDefault) {
    await setDefaultAddress(user.id, id);
  }
  return NextResponse.json({ ok: true });
});
