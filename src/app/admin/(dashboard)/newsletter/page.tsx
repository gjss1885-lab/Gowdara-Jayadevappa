import Link from "next/link";
import { Download } from "lucide-react";
import { listNewsletterSubscribers } from "@/lib/db";

// Without this, this list is prerendered once at build time -- new
// signups wouldn't show up here until the next deploy.
export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  let subscribers: Awaited<ReturnType<typeof listNewsletterSubscribers>> = [];
  let loadError: string | null = null;
  try {
    subscribers = await listNewsletterSubscribers();
  } catch (err) {
    console.error("Failed to load newsletter subscribers:", err);
    loadError =
      "Couldn't load the subscriber list from the database. If you've just set up Supabase " +
      "or added this feature, make sure you've run the latest supabase/schema.sql in the " +
      "Supabase SQL Editor — it creates the newsletter_subscribers table this page needs.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Newsletter</h1>
          <p className="text-sm text-ink/70">
            {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"} from the footer
            signup form.
          </p>
        </div>
        <Link
          href="/api/admin/newsletter/export"
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:border-maroon hover:text-maroon"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Link>
      </div>

      <p className="rounded-md border border-line bg-white/50 p-4 text-sm text-ink/70">
        This is just an address list, not an email-sending tool. Export it as CSV and import it
        into whatever you use to actually send a newsletter (Mailchimp, Brevo, etc.) — this app
        doesn&rsquo;t compose or send marketing emails itself.
      </p>

      {loadError ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {loadError}
        </p>
      ) : subscribers.length === 0 ? (
        <p className="text-ink/80">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-white/60">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="border-b border-line text-ink/80">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{s.email}</td>
                  <td className="px-4 py-3 text-ink/80">
                    {new Date(s.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
