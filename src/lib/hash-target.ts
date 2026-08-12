/**
 * Resolve a URL hash to the section it actually means.
 *
 * Element ids are case-sensitive, so `#Demo` matches nothing on its own — and a
 * link pasted into an email, a deck or a DM is exactly where a stray capital
 * shows up. Anything that already resolves exactly is returned untouched, so
 * this can only ever add matches; misses fall through to the lowercase form and
 * then to the alias table.
 *
 * getElementById rather than querySelector on purpose: querySelector throws on
 * junk like `#fbclid=123` that ad platforms append, and a deep link should
 * never be able to break the page it points at.
 */
const ALIASES: Record<string, string> = {
  // The demo section answered to `#app` before it answered to `#demo`, and
  // those links are already out in the world.
  app: "demo",
  walkthrough: "demo",
  // Nav copy people are likely to guess at.
  science: "writing",
  thesis: "brain",
  contact: "footer",
};

export function resolveHashTarget(hash: string): HTMLElement | null {
  const raw = hash.replace(/^#/, "");
  if (!raw) return null;

  let key: string;
  try {
    key = decodeURIComponent(raw);
  } catch {
    key = raw;
  }

  const exact = document.getElementById(key);
  if (exact) return exact;

  const lower = key.toLowerCase();
  return document.getElementById(ALIASES[lower] ?? lower);
}
