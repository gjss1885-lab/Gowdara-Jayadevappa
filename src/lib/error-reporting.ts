import "server-only";
import { sendEmail, emailShell } from "@/lib/email";
import { errorAlertEmail, siteConfig } from "@/lib/config";

// A lightweight stand-in for a full error-monitoring service (Sentry and
// similar): it doesn't give you a dashboard, stack-trace source maps, or
// deduplication of a repeat error firing a thousand times a minute -- but
// it reuses the Resend integration the store already has, needs no new
// account/DSN to set up, and means a real bug reaches Om's inbox within
// seconds instead of waiting for a customer to complain. Worth upgrading
// to something like Sentry once the site is deployed and traffic is real;
// this is the "hear about it before a customer tells you" baseline.
//
// Safe to call unconditionally, same pattern as sendEmail itself: with no
// RESEND_API_KEY configured this just logs and no-ops.
//
// Deliberately fire-this-and-move-on rather than letting a broken alert
// path take anything else down -- reportError swallows its own errors.
export async function reportError(context: string, error: unknown): Promise<void> {
  console.error(`[error-report] ${context}:`, error);

  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    await sendEmail({
      to: errorAlertEmail,
      subject: `⚠ ${siteConfig.name} error: ${context}`,
      html: emailShell(`
        <p><strong>Where:</strong> ${escapeHtml(context)}</p>
        <p><strong>Message:</strong> ${escapeHtml(message)}</p>
        ${
          stack
            ? `<pre style="white-space: pre-wrap; font-size: 12px; background: #f1e9d8; padding: 12px; border-radius: 6px;">${escapeHtml(stack)}</pre>`
            : ""
        }
        <p style="color: #9c8a7c; font-size: 12px;">Sent automatically by the site's error monitoring.</p>
      `),
    });
  } catch (reportingError) {
    console.error("[error-report] failed to send alert email:", reportingError);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
