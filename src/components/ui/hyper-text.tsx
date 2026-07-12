"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

/**
 * Magic UI "Hyper Text" — letter scramble that decodes to the final text.
 *
 * Deliberately colorless and font-agnostic: it renders as whatever element you
 * pass (`as`) with only the `className` you give it, so it inherits the target's
 * font / size / weight / spacing / color and looks identical when resting. Only
 * the letters animate. Monospace targets get no layout jitter (fixed glyph
 * width). Runs once on mount and again on hover; static under reduced motion.
 */
const DEFAULT_CHARACTER_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface HyperTextProps {
  children: string;
  className?: string;
  as?: ElementType;
  /** Total scramble duration in ms. */
  duration?: number;
  delay?: number;
  startOnView?: boolean;
  animateOnHover?: boolean;
  characterSet?: string[];
  /** Controlled trigger: scramble each time this flips false → true (e.g. when
      a parent fades the element in). Overrides the mount / startOnView trigger. */
  active?: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function HyperText({
  children,
  className,
  as: Component = "span",
  duration = 600,
  delay = 0,
  startOnView = false,
  animateOnHover = true,
  characterSet = DEFAULT_CHARACTER_SET,
  active,
}: HyperTextProps) {
  const text = children;
  // Deterministic initial render (avoids SSR/hydration mismatch); the client
  // scrambles from mount.
  const [display, setDisplay] = useState<string>(text);
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);
  const elRef = useRef<HTMLElement | null>(null);

  const trigger = () => {
    if (prefersReducedMotion()) return;
    setAnimating(true);
  };

  // Controlled trigger: scramble each time `active` flips false → true (e.g. the
  // header fading the wordmark in on scroll).
  const prevActive = useRef(false);
  useEffect(() => {
    if (active === undefined) return;
    if (active && !prevActive.current && !prefersReducedMotion()) {
      setAnimating(true);
    }
    prevActive.current = !!active;
  }, [active]);

  // Otherwise, kick off once on mount (or when scrolled into view).
  useEffect(() => {
    if (active !== undefined) return; // driven by the controlled trigger above
    if (prefersReducedMotion()) return;
    if (!startOnView) {
      const t = setTimeout(() => setAnimating(true), delay);
      return () => clearTimeout(t);
    }
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimating(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, startOnView, active]);

  // Scramble unresolved letters, revealing left → right, then settle.
  useEffect(() => {
    if (!animating) return;
    const chars = text.split("");
    const len = chars.length;
    const start = performance.now();
    const step = () => {
      const p = Math.min((performance.now() - start) / duration, 1);
      const reveal = p * len;
      setDisplay(
        chars
          .map((ch, i) =>
            ch === " " || i < reveal
              ? ch
              : characterSet[Math.floor(Math.random() * characterSet.length)],
          )
          .join(""),
      );
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(text);
        setAnimating(false);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animating, duration, text, characterSet]);

  // Dynamic tag: `any` sidesteps the polymorphic-ref typing dance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = Component;

  return (
    <Tag ref={elRef} className={className} onMouseEnter={animateOnHover ? trigger : undefined}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}

export default HyperText;
