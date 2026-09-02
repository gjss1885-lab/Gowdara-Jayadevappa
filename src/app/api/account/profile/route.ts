import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";

// A customer's "profile" here is just a display name + contact email +
// phone number kept on their own Supabase auth user (user_metadata) --
// there's no separate profiles table, since nothing else in the app needs
// to query this in bulk. It's a convenience for the account page only.
//
// The email here is deliberately a plain metadata field, not a call to
// change the user's actual Supabase Auth login email (`user.email`) --
// that requires a confirmation-link flow to both the old and new address,
// which is a lot of moving parts for what customers actually asked for
// here (somewhere to put a contact email, especially useful for the
// phone-login customers who otherwise have no email on the account at
// all). It just needs to look like a real email address.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = withApiErrorHandling(async (request: Request) => {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Account login isn't connected yet." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user || !supabase) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!fullName) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: fullName, email, phone },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    fullName: data.user.user_metadata?.full_name ?? "",
    email: data.user.user_metadata?.email ?? "",
    phone: data.user.user_metadata?.phone ?? "",
  });
});
