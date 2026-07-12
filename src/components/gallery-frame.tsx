"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Scroll-driven "ring into the lab" section.
 *
 * The ring (public/ro22-cutout.webp — an alpha-matted spin, its original gray
 * studio floor removed) floats centered the whole way through. Behind it, a
 * gray studio gradient (echoing ro22's original backdrop) cross-fades away as
 * you scroll, revealing the lab photo (public/fifi.png) — so the ring appears
 * to lift out of the studio and settle into the lab.
 *
 * Transform-only (scale) for perf. Reduced motion shows the end state static
 * (ring in the lab, no studio) and swaps the animated ring for a still frame.
 */
const RING_SRC = "/ro22-cutout.webp"; // animated, transparent-background ring
const RING_POSTER = "/ro22-poster.png"; // single still frame (reduced motion)
const LAB_SRC = "/fifi.png";

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function GalleryFrame() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const labRef = useRef<HTMLDivElement | null>(null);
  const studioRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const pRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Eased scroll progress 0..1 for the pinned section (window scroll = Lenis).
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-section.getBoundingClientRect().top, 0, total || 1);
      pRef.current = total > 0 ? scrolled / total : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Apply transforms/opacity. Reduced motion pins the end state once.
  useEffect(() => {
    const apply = () => {
      const p = isReduced ? 1 : pRef.current;
      const pe = easeInOutCubic(p);

      // Studio gray fades out as you scroll → lab (always behind) shows.
      if (studioRef.current) {
        studioRef.current.style.opacity = String(isReduced ? 0 : 1 - smoothstep(0.05, 0.65, p));
      }
      // Lab settles from a slight zoom to 1 as it's revealed.
      if (labRef.current) {
        labRef.current.style.transform = `scale(${1.08 + (1 - 1.08) * pe})`;
      }
      // Ring starts LARGE (fills most of the viewport) and SHRINKS to a small
      // resting size in the lab as progress goes 0 → 1.
      if (ringRef.current) {
        ringRef.current.style.transform = `scale(${1.9 + (0.5 - 1.9) * pe})`;
      }
    };

    if (isReduced) {
      apply();
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = window.requestAnimationFrame(loop);
      if (!isVisible) return;
      apply();
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [isVisible, isReduced]);

  return (
    <section ref={sectionRef} id="gallery-frame" className="relative h-[250vh] bg-df-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* lab photo — always present behind, revealed as the studio fades */}
        <div ref={labRef} className="absolute inset-0 will-change-transform">
          <Image src={LAB_SRC} alt="" fill sizes="100vw" className="object-cover" unoptimized />
        </div>

        {/* studio backdrop echoing ro22's gray floor; fades out on scroll */}
        <div
          ref={studioRef}
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,#2b3137 0%,#565d65 46%,#c7cbd0 100%)" }}
        />

        {/* floating ring (alpha-matted) — visible throughout */}
        <div
          ref={ringRef}
          className="absolute inset-0 flex items-center justify-center will-change-transform [transform-origin:center_center]"
        >
          {isReduced ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={RING_POSTER} alt="Brink ring" className="h-full w-full object-contain" />
          ) : (
            // Animated webp plays on its own; not driven by scroll.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={RING_SRC} alt="Brink ring" className="h-full w-full object-contain" />
          )}
        </div>
      </div>
    </section>
  );
}
