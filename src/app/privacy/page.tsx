import { siteConfig } from "@/lib/config";

export const metadata = { title: "Privacy Policy" };

// General-purpose privacy policy template, written to match what this
// store's own code actually does with customer data (see the third-party
// services list below -- Supabase/Razorpay/Resend are the only places
// customer data goes, mirroring the real integrations in src/lib/). Same
// caveat as the Terms page: a reasonable starting point, not a substitute
// for legal review, especially once real customer volume/marketing grows.
export default function PrivacyPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="mb-2 font-display text-3xl text-ink">Privacy Policy</h1>
      <p className="mb-8 text-sm text-ink/70">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 leading-relaxed text-ink/90">
        <Section title="1. What this covers">
          <p>
            This policy explains what information {siteConfig.name} collects when you use this
            website, why we collect it, and how it&rsquo;s handled.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-ink">Contact &amp; order details</span> — name,
              email, phone number, and delivery address, when you place an order or create an
              account.
            </li>
            <li>
              <span className="font-medium text-ink">Account details</span> — if you log in, we
              store your email/phone (used for the login code) and anything you choose to add to
              your profile.
            </li>
            <li>
              <span className="font-medium text-ink">Order history</span> — what you&rsquo;ve
              bought, order status, and any reviews or photos you choose to submit.
            </li>
            <li>
              <span className="font-medium text-ink">Device information</span> — your cart and
              favorites are stored in your browser&rsquo;s local storage, not on our servers,
              unless you&rsquo;re logged in.
            </li>
          </ul>
          <p className="mt-3">
            We do not collect or store your card, UPI, or bank details — those are handled
            directly by our payment processor, Razorpay.
          </p>
        </Section>

        <Section title="3. How we use it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To process and deliver your orders, and to contact you about them.</li>
            <li>To let you log in and see your order history, saved addresses, and profile.</li>
            <li>To send order confirmations, shipping updates, and back-in-stock alerts.</li>
            <li>To respond to enquiries and improve the site.</li>
          </ul>
        </Section>

        <Section title="4. Who we share it with">
          <p>We don&rsquo;t sell your personal information. We share it only with the services that help us run the store:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-ink">Supabase</span> — hosts our database and
              handles account login.
            </li>
            <li>
              <span className="font-medium text-ink">Razorpay</span> — processes online payments.
            </li>
            <li>
              <span className="font-medium text-ink">Resend</span> — sends order and account
              emails on our behalf.
            </li>
            <li>
              <span className="font-medium text-ink">Courier partners</span> — receive your name,
              address, and phone number to deliver your order.
            </li>
            <li>
              <span className="font-medium text-ink">Google Analytics</span> — receives anonymized
              browsing data (pages viewed, general location, device type) if enabled, to help us
              understand site traffic. It does not receive your name, email, or order details.
            </li>
          </ul>
        </Section>

        <Section title="5. Cookies &amp; local storage">
          <p>
            We use your browser&rsquo;s local storage to remember your cart and favorites, and a
            login session cookie once you&rsquo;re signed in. We may also use an analytics tool
            such as Google Analytics to understand how visitors use this site (pages viewed,
            general location, device type) — these set their own cookies to recognize repeat
            visits. We don&rsquo;t currently use advertising or cross-site retargeting cookies.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            We keep order and account records for as long as needed for accounting, warranty, and
            legal purposes, and delete or anonymize data we no longer need to keep.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>
            You can ask us to access, correct, or delete the personal information we hold about
            you, subject to what we&rsquo;re legally required to retain (for example, completed
            order records). You can update your name, email, and phone directly from your account
            page, or contact us for anything else.
          </p>
        </Section>

        <Section title="8. Data security">
          <p>
            We take reasonable technical and organizational measures to protect your information,
            but no method of storage or transmission over the internet is completely secure.
          </p>
        </Section>

        <Section title="9. Children's privacy">
          <p>This site is not directed at children, and we don&rsquo;t knowingly collect information from anyone under 18.</p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at
            the top reflects the most recent revision.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            For any privacy questions or requests, reach us at{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-maroon hover:underline">
              {siteConfig.email}
            </a>{" "}
            or {siteConfig.phone}.
          </p>
        </Section>
      </div>

      <p className="mt-10 rounded-md border border-line bg-white/50 p-4 text-sm text-ink/70">
        This page is a general template describing what this site&rsquo;s own code actually does
        with customer data today. It isn&rsquo;t legal advice — we&rsquo;d recommend having a
        lawyer review it, especially before running marketing campaigns or collecting more data
        than described here.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg text-ink">{title}</h2>
      {children}
    </section>
  );
}
