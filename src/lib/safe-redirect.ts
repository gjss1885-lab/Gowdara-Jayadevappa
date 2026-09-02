// Keeps a post-login redirect target restricted to this site. `redirect_to`
// travels through a URL query param (e.g. /login?redirect_to=/checkout), so
// it's attacker-influenceable -- without this check, a crafted login link
// could bounce a customer to an external site right after they authenticate.
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
