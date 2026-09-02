"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { formatINR } from "@/lib/format";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  image: string | null;
};

// Suggestions only kick in once there's enough to search on -- one or two
// letters would match half the catalog and just be noise.
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 250;

// Starts as a plain icon button so it doesn't crowd the header. Clicking it
// expands an inline input in place; typing 3+ letters shows a dropdown of
// matching sarees below it, and submitting sends the visitor to the shop
// page filtered by their query, then collapses back to just the icon.
// Open/closed state is controlled by the parent Header so it can also hide
// the logo and other icons on very narrow screens while this is expanded --
// otherwise the expanded bar has nowhere to go on a small phone.
export function HeaderSearch({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const query = value.trim();
  const showDropdown = open && !dismissed && query.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced fetch of live suggestions as the visitor types. A ref-counted
  // request id guards against an older, slower response overwriting a
  // newer one if they resolve out of order.
  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (query.length < MIN_QUERY_LENGTH) {
      const timer = window.setTimeout(() => {
        if (requestId === requestIdRef.current) {
          setSuggestions([]);
          setLoading(false);
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const loadingTimer = window.setTimeout(() => {
      if (requestId === requestIdRef.current) setLoading(true);
    }, 0);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (requestId === requestIdRef.current) {
          setSuggestions(data.results ?? []);
        }
      } catch {
        if (requestId === requestIdRef.current) setSuggestions([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(timer);
    };
  }, [query]);

  function close() {
    onClose();
    setValue("");
    setSuggestions([]);
    setDismissed(false);
  }

  function goToFullResults(q: string) {
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    close();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToFullResults(value.trim());
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setDismissed(false);
  }

  // Collapse the whole widget automatically if the visitor clicks/tabs away
  // without typing anything -- but on a short delay, so a click on the
  // close button or a suggestion (which fire blur first) still registers.
  // If they *have* typed something, keep the input open but dismiss the
  // dropdown, so a stray click elsewhere on the page doesn't wipe out a
  // half-finished search.
  function handleBlur() {
    if (!value.trim()) {
      window.setTimeout(onClose, 150);
    } else {
      window.setTimeout(() => setDismissed(true), 150);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Search"
        className="rounded-md p-1.5 text-ink hover:text-maroon"
      >
        <Search className="h-5 w-5" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <div className="relative flex flex-1 items-center gap-1 sm:flex-initial">
      <form onSubmit={handleSubmit} role="search" className="flex w-full items-center gap-1">
        <label htmlFor="site-search" className="sr-only">
          Search sarees
        </label>
        <div className="flex w-full items-center rounded-md border border-line bg-white/70 px-2.5 py-1.5 focus-within:border-maroon sm:w-48 md:w-64">
          <Search className="h-4 w-4 shrink-0 text-ink/60" strokeWidth={1.75} />
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Escape" && close()}
            placeholder="Search sarees..."
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="site-search-suggestions"
            className="w-full min-w-0 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink/60"
          />
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close search"
          className="shrink-0 rounded-md p-1.5 text-ink/70 hover:text-maroon"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </form>

      {showDropdown && (
        <div
          id="site-search-suggestions"
          role="listbox"
          className="absolute left-0 right-9 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-line bg-white shadow-lg sm:right-auto sm:w-72 md:w-80"
        >
          {loading && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink/60">Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink/60">No sarees found for “{query}”.</p>
          ) : (
            <ul>
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/product/${s.slug}`}
                    onClick={close}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-cream-dark/50"
                  >
                    <span className="w-11 shrink-0">
                      <ProductImage category={s.category} name={s.name} imageUrl={s.image} hideLabel />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{s.name}</span>
                      <span className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-sm font-medium text-maroon">{formatINR(s.price)}</span>
                        {s.compareAtPrice && s.compareAtPrice > s.price && (
                          <span className="text-xs text-ink/70 line-through">
                            {formatINR(s.compareAtPrice)}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-line">
                <button
                  type="button"
                  onClick={() => goToFullResults(query)}
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-maroon hover:bg-cream-dark/50"
                >
                  See all results for “{query}”
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
