"use client";

import "lenis/dist/lenis.css";
import { useEffect, useRef, type ReactNode } from "react";

import { setLenis, type LenisHandle } from "@/lib/lenis";

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisHandle | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let frame = 0;
    let cancelled = false;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled || typeof window === "undefined") return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.8,
        wheelMultiplier: 1,
      });

      lenisRef.current = lenis;
      // Published so deep-link anchoring can move the page through Lenis
      // rather than fighting it; see lib/lenis.ts.
      setLenis(lenis);

      const raf = (time: number) => {
        lenis.raf(time);
        frame = window.requestAnimationFrame(raf);
      };

      frame = window.requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
