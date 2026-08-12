"use client";

import { useEffect } from "react";

import { getLenis } from "@/lib/lenis";
import { resolveHashTarget } from "@/lib/hash-target";

/** How long to keep correcting the landing position after a deep link. */
const SETTLE_MS = 5000;
/** Gap between height checks while the page is still growing. */
const POLL_MS = 100;

/**
 * Owns hash -> section scrolling for the one-page site.
 *
 * Two things the browser cannot do for us here:
 *
 * 1. Element ids are case-sensitive and this page has only ever had one id per
 *    section, so `#Demo` and the older `#app` match nothing on their own. A
 *    link pasted into an email or a deck is exactly where those show up.
 *
 * 2. The page is roughly 2,000px tall at first paint and about 13,700px once
 *    the hero video, the 3D headband and the two pinned scroll sections have
 *    loaded. An anchor jump resolved at load lands thousands of pixels short of
 *    where the section ends up, so the position has to be held rather than set
 *    once. This was already true of every deep link on the site.
 *
 * Corrections stop the moment the visitor scrolls, so this can never fight
 * someone who has taken over.
 */
export function HashAnchors() {
  useEffect(() => {
    const target = resolveHashTarget(window.location.hash);
    if (!target) return;

    let timer = 0;
    let cancelled = false;
    let lastHeight = document.documentElement.scrollHeight;
    const until = performance.now() + SETTLE_MS;

    const release = () => {
      cancelled = true;
      window.clearTimeout(timer);
      for (const ev of ["wheel", "touchstart", "keydown"] as const) {
        window.removeEventListener(ev, release);
      }
    };
    for (const ev of ["wheel", "touchstart", "keydown"] as const) {
      window.addEventListener(ev, release, { passive: true, once: true });
    }

    // Through Lenis when it is running, or it reapplies its own position on the
    // next frame and undoes this. It also caches the document height, so it
    // needs re-measuring before each corrective jump.
    const anchor = () => {
      const lenis = getLenis();
      if (!lenis) {
        target.scrollIntoView();
        return;
      }
      lenis.resize();
      lenis.scrollTo(target, { immediate: true, force: true });
    };

    anchor();
    let anchoredVia = getLenis() ? "lenis" : "native";

    const tick = () => {
      if (cancelled) return;
      const height = document.documentElement.scrollHeight;
      const via = getLenis() ? "lenis" : "native";
      // Re-anchor when the page grew, and once more the first time Lenis turns
      // up, since it loads dynamically and will have missed the earlier jumps.
      if (height !== lastHeight || via !== anchoredVia) {
        lastHeight = height;
        anchoredVia = via;
        anchor();
      }
      if (performance.now() < until) timer = window.setTimeout(tick, POLL_MS);
    };
    timer = window.setTimeout(tick, POLL_MS);

    return release;
  }, []);

  // Alias and wrong-case hashes on an already-open page: the browser only
  // scrolls for an exact id match, so `#Demo` would otherwise do nothing. Exact
  // matches are left alone so this never fights Lenis' smooth scroll.
  useEffect(() => {
    const onHashChange = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw || document.getElementById(raw)) return;
      const el = resolveHashTarget(window.location.hash);
      if (!el) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { force: true });
      else el.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
