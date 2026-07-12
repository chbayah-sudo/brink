"use client";

import { useEffect, useRef, type ElementType } from "react";
import { stagger, useAnimate } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Aceternity "Text Generate Effect" — staggered per-word fade-in (optional
 * blur). Restyled to impose NO font/size/weight of its own: the words inherit
 * every text style from the element it renders as (via `as` + `className`), so
 * the finished headline looks identical to a plain text node — only the reveal
 * animates.
 *
 * - Animates once, on scroll-into-view (never loops, never on initial load
 *   while below the fold).
 * - Respects prefers-reduced-motion: renders fully visible and static.
 */
export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  as: Component = "div",
  ...rest
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  as?: ElementType;
  // Pass-through for attributes like `id` so semantics/aria stay intact.
  [key: string]: unknown;
}) {
  const [scope, animate] = useAnimate();
  const started = useRef(false);
  const wordsArray = words.split(" ");

  useEffect(() => {
    const el = scope.current as Element | null;
    if (!el) return;

    const reveal = () => {
      animate(
        "span",
        { opacity: 1, filter: filter ? "blur(0px)" : "none" },
        { duration: 0.01 },
      );
    };

    // Reduced motion: reveal immediately, static, no stagger.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      return;
    }

    // Otherwise animate once when the headline scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (started.current) return;
        if (entries.some((e) => e.isIntersecting)) {
          started.current = true;
          animate(
            "span",
            { opacity: 1, filter: filter ? "blur(0px)" : "none" },
            { duration, delay: stagger(0.12) },
          );
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate, scope, filter, duration]);

  // Dynamic tag: `any` sidesteps the polymorphic-ref typing dance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = Component;

  return (
    <Tag ref={scope} className={className} {...rest}>
      {wordsArray.map((word, idx) => (
        <span
          // Inherit color/font/size from the parent element — no overrides.
          key={`${word}-${idx}`}
          className={cn("opacity-0")}
          style={{ filter: filter ? "blur(10px)" : "none" }}
        >
          {word}
          {idx < wordsArray.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
