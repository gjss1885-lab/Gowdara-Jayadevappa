import "server-only";
import { isEmailConfigured, siteConfig } from "@/lib/config";

// Thin wrapper around the Resend REST API (like razorpay.ts, plain fetch
// instead of pulling in an SDK). Every call is a no-op (logged, not thrown)
// when RESEND_API_KEY / RESEND_FROM_EMAIL aren't set, so the rest of the
// app can call sendEmail() unconditionally without checking
// isEmailConfigured everywhere -- an unconfigured store just runs with no
// emails going out, same as Razorpay falling back to Cash on Delivery.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  if (!isEmailConfigured) {
    console.warn(`[email] Resend not configured -- skipped "${subject}" to ${to}`);
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${siteConfig.name} <${process.env.RESEND_FROM_EMAIL}>`,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend send failed: ${res.status} ${await res.text()}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    // A broken email provider should never take checkout or the admin
    // panel down with it -- log and move on.
    console.error("[email] send threw:", error);
    return { sent: false };
  }
}

// Shared HTML shell so every email looks like it's from the same store
// instead of a bare paragraph of text.
export function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #2a1c17;">
      <div style="background: #7a1f2b; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <span style="color: #faf6ee; font-size: 20px; font-weight: bold;">${siteConfig.name}</span>
      </div>
      <div style="background: #faf6ee; padding: 24px; border-radius: 0 0 8px 8px; line-height: 1.6;">
        ${bodyHtml}
      </div>
      <p style="text-align: center; color: #9c8a7c; font-size: 12px; margin-top: 16px;">
        ${siteConfig.name} &middot; ${siteConfig.address}
      </p>
    </div>
  `;
}
