import { siteConfig } from "@/lib/config";
import { NO_RETURNS_NOTE } from "@/lib/policies";

export const metadata = { title: "Terms & Conditions" };

// General-purpose e-commerce Terms & Conditions template, written to match
// how this store actually operates (COD + Razorpay, OTP login, no returns/
// exchanges, cancellation window before shipping). This is a reasonable
// starting point, not a substitute for a lawyer -- see the note at the
// bottom before relying on it for anything contested.
export default function TermsPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="mb-2 font-display text-3xl text-ink">Terms &amp; Conditions</h1>
      <p className="mb-8 text-sm text-ink/70">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 leading-relaxed text-ink/90">
        <Section title="1. About these terms">
          <p>
            These terms govern your use of the {siteConfig.name} website and any order you place
            through it. By browsing this site or placing an order, you agree to these terms. If
            you don&rsquo;t agree with them, please don&rsquo;t use the site.
          </p>
        </Section>

        <Section title="2. Products &amp; pricing">
          <p>
            All prices are listed in Indian Rupees (₹) and include applicable taxes unless stated
            otherwise. Product photos are as accurate as we can make them, but colour can vary
            slightly on different screens, and handwoven sarees can have small natural
            variations in weave, zari, and finish from piece to piece — that&rsquo;s part of what
            makes each one genuine. We reserve the right to correct pricing or listing errors and
            to update stock, prices, or descriptions at any time without prior notice.
          </p>
        </Section>

        <Section title="3. Orders &amp; payment">
          <p>
            When you place an order, you&rsquo;re making an offer to buy at the listed price. We
            confirm orders by email/SMS and reserve the right to cancel any order — for example if
            an item turns out to be out of stock, if we suspect fraud, or if there&rsquo;s a
            pricing error — in which case any payment already made will be refunded.
          </p>
          <p className="mt-3">
            We accept payment via Cash on Delivery (where available) and online payment through
            Razorpay (cards, UPI, netbanking, and wallets). We don&rsquo;t see or store your card
            or bank details — those are handled directly by Razorpay.
          </p>
        </Section>

        <Section title="4. Cancellations, returns &amp; exchanges">
          <p>
            You can request to cancel an order from your account before it ships. Once an order
            has shipped, it can no longer be cancelled.
          </p>
          <p className="mt-3 font-medium text-ink">{NO_RETURNS_NOTE}</p>
          <p className="mt-3">
            If an item arrives damaged, defective, or different from what you ordered, please
            contact us — we want to make it right even though we don&rsquo;t offer general
            returns or exchanges for change of mind.
          </p>
        </Section>

        <Section title="5. Shipping &amp; delivery">
          <p>
            We ship across India. Delivery times are estimates, not guarantees, and can be
            affected by courier delays, weather, or circumstances outside our control. Risk in
            the goods passes to you once the order is handed to the courier.
          </p>
        </Section>

        <Section title="6. Your account">
          <p>
            Logging in uses a one-time code sent to your email or phone — there&rsquo;s no
            password to manage, but you&rsquo;re responsible for keeping access to that email or
            phone number secure, since that&rsquo;s what secures your account.
          </p>
        </Section>

        <Section title="7. Reviews &amp; content you submit">
          <p>
            If you leave a review or upload a photo with it, you&rsquo;re confirming it&rsquo;s
            genuinely yours to share and it doesn&rsquo;t infringe anyone else&rsquo;s rights. We
            may edit, decline to publish, or remove reviews or photos at our discretion —
            for example if they&rsquo;re abusive, spam, or clearly unrelated to the product.
          </p>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            All content on this site — photos, descriptions, logos, and design — belongs to{" "}
            {siteConfig.name} or its licensors and may not be copied or reused without
            permission.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            We work hard to get every order right, but to the extent permitted by law, we
            aren&rsquo;t liable for indirect or consequential losses arising from your use of this
            site or a delayed/lost delivery beyond the value of the order itself.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These terms are governed by the laws of India, and any dispute will be subject to the
            jurisdiction of the courts at Davangere, Karnataka.
          </p>
        </Section>

        <Section title="11. Changes to these terms">
          <p>
            We may update these terms from time to time. The &ldquo;Last updated&rdquo; date at
            the top of this page reflects the most recent revision. Continued use of the site
            after a change means you accept the updated terms.
          </p>
        </Section>

        <Section title="12. Contact us">
          <p>
            Questions about these terms? Reach us at{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-maroon hover:underline">
              {siteConfig.email}
            </a>{" "}
            or {siteConfig.phone}.
          </p>
        </Section>
      </div>

      <p className="mt-10 rounded-md border border-line bg-white/50 p-4 text-sm text-ink/70">
        This page is a general template covering how {siteConfig.name} operates today. It
        isn&rsquo;t legal advice, and we&rsquo;d recommend having a lawyer review it before relying
        on it for anything contested.
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
