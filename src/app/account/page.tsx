import Link from "next/link";
import { adminEmails, isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listOrders, listAddresses } from "@/lib/db";
import { orderBelongsToUser } from "@/lib/order-match";
import { SignOutButton } from "./SignOutButton";
import { OrderHistoryItem } from "./OrderHistoryItem";
import { AddressBook } from "./AddressBook";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl text-ink">My Account</h1>
        <p className="mt-3 text-ink/80">
          Account login isn’t connected yet. Once Supabase is set up, customers can log in here and
          see their order history.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl text-ink">My Account</h1>
        <p className="mt-3 text-ink/80">Log in to view your orders.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          Log In
        </Link>
      </div>
    );
  }

  const [allOrders, addresses] = await Promise.all([listOrders(), listAddresses(user.id)]);
  const myOrders = allOrders.filter((o) => orderBelongsToUser(o, user));

  const isAdmin = Boolean(user.email) && adminEmails.includes(user.email!.toLowerCase());

  return (
    <div className="container-page max-w-2xl py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">My Account</h1>
          <p className="text-sm text-ink/80">{user.email || user.phone}</p>
        </div>
        <SignOutButton />
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="mb-8 flex items-center justify-between rounded-md border border-gold bg-gold/10 p-4 text-sm font-medium text-ink hover:bg-gold/20"
        >
          <span>You&rsquo;re recognized as an admin for this store.</span>
          <span className="font-semibold text-maroon">Open Admin Panel &rarr;</span>
        </Link>
      )}

      <h2 className="mb-3 font-display text-lg text-ink">Profile</h2>
      <div className="mb-8">
        <ProfileForm
          initialFullName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""}
          initialEmail={
            typeof user.user_metadata?.email === "string" && user.user_metadata.email
              ? user.user_metadata.email
              : user.email ?? ""
          }
          initialPhone={typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : ""}
        />
      </div>

      <h2 className="mb-3 font-display text-lg text-ink">Saved Addresses</h2>
      <div className="mb-8">
        <AddressBook addresses={addresses} />
      </div>

      <h2 className="mb-3 font-display text-lg text-ink">Order History</h2>
      {myOrders.length === 0 ? (
        <p className="text-ink/80">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {myOrders.map((order) => (
            <OrderHistoryItem key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
