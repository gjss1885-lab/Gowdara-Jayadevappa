"use client";

import { useState, useSyncExternalStore } from "react";
import { Share2, Check } from "lucide-react";

// "Share this saree" -- a single, prominent Share button rather than a row
// of per-platform icons (Om asked to drop WhatsApp/Facebook/X/copy-link
// and keep only this one, styled to stand out). On a device that supports
// the Web Share API (most phones, and increasingly desktop browsers) it
// opens the OS's own share sheet -- whatever apps the person actually has
// installed (WhatsApp, Instagram DM, Messages, etc.), rather than us
// guessing which platforms to list. Where that API isn't available (older
// desktop browsers, Firefox), the same button falls back to copying the
// link instead of just disappearing -- Om wants this on ALL devices, and a
// button that vanishes on unsupported browsers wouldn't be that.
//
// Feature support never changes over a page's lifetime, so there's nothing
// to subscribe to -- this no-op subscribe just satisfies useSyncExternalStore's
// signature.
function subscribeToNothing() {
  return () => {};
}
function getNativeShareSupport() {
  return typeof navigator.share === "function";
}
// The server has no `navigator` at all, so it always reports "unsupported".
function getServerNativeShareSupport() {
  return false;
}

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  // useSyncExternalStore (rather than an effect + setState) is the React-
  // recommended way to read a value that can differ between server and
  // client: the server snapshot always assumes "no native share", so
  // there's no hydration mismatch, and React itself swaps in the real
  // client snapshot right after mount -- no manual setState-in-effect
  // needed.
  const canNativeShare = useSyncExternalStore(subscribeToNothing, getNativeShareSupport, getServerNativeShareSupport);

  async function handleShare() {
    if (canNativeShare) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet, or the browser rejected it -- not
        // an error worth surfacing.
      }
      return;
    }

    // Fallback for browsers without the Web Share API: copy the link
    // instead, so the button always does something useful.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by browser permissions -- fail
      // quietly rather than showing an alert for a non-critical action.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Link copied" : "Share"}
      className="inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-maroon-dark"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" strokeWidth={2} />}
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
