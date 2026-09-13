import "server-only";

// Best-effort, single-instance in-memory rate limiter. Vercel can run more
// than one warm instance of a function at once, so this doesn't guarantee a
// hard global cap the way a shared store (Upstash/Redis) would -- but it's
// free, needs no new service, and meaningfully slows down the common case
// this site actually needs to worry about: one abusive client hammering an
// endpoint (guessing the admin password, spamming fake reviews, triggering
// error-report emails) from one IP. If this ever needs a real distributed
// guarantee -- e.g. once there's enough traffic that multiple instances are
// routinely warm at once -- swap this for Upstash's Redis-backed rate
// limiter, which is a drop-in for the same call shape.
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACKED_KEYS = 5000;

/**
 * Returns true if this call is allowed, false if `key` has already hit
 * `limit` calls within the current `windowMs` window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Cheap cap so long-lived warm instances under sustained abuse from
    // many different IPs don't grow this map forever.
    if (buckets.size > MAX_TRACKED_KEYS) {
      const oldest = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
      for (const [staleKey] of oldest.slice(0, 1000)) buckets.delete(staleKey);
    }
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// Vercel (and most reverse proxies) put the real client IP first in
// x-forwarded-for. Not spoof-proof against someone crafting their own
// header if this were self-hosted behind no proxy, but on Vercel this
// header is set by Vercel's own edge network, not passed through from the
// visitor untouched.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}
