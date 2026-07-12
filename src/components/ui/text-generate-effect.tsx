"use client";

import { Fragment, useEffect, useRef, type ElementType } from "react";
import { stagger, useAnimate } from "motion/react";

/**
 * Aceternity "Text Generate Effect" — staggered per-word fade-in (optional
 * blur). Restyled to impose NO font/size/weight of its own: the words inherit
 * every text style from the element it renders as (via `as` + `className`), so
 * the finished headline looks identical to a plain text node — only the reveal
 * animates.
 *
 * - `words` may contain "\n" to force line breaks (rendered as <br/>), so a
 *   multi-line headline keeps its exact layout.
 * - Trigger: pass `start` to gate the animation on external state (fires once
 *   when it turns true) — needed when the element sits in a pinned/faded
 *   overlay that is already in the viewport. Omit `start` to animate on
 *   scroll-into-view instead.
 * - Respects prefers-reduced-motion: renders fully visible and static.
 */
export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  as: Component = "div",
  start,
  ...rest
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  as?: ElementType;
  /** External gate. When provided, the reveal fires once as it turns true. */
  start?: boolean;
  // Pass-through for attributes like `id` so semantics/aria stay intact.
  [key: string]: unknown;
}) {
  const [scope, animate] = useAnimate();
  const started = useRef(false);
  // Preserve line breaks: each "\n" becomes a <br/>, words split on spaces.
  const lines = words.split("\n").map((line) => line.split(" "));

  useEffect(() => {
    const el = scope.current as Element | null;
    if (!el) return;

    const reveal = (staggered: boolean) => {
      if (started.current) return;
      started.current = true;
      animate(
        "span",
        { opacity: 1, filter: filter ? "blur(0px)" : "none" },
        staggered ? { duration, delay: stagger(0.12) } : { duration: 0.01 },
      );
    };

    // Reduced motion: reveal immediately, static, no stagger.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal(false);
      return;
    }

    // Externally gated (pinned/faded overlays): fire when `start` turns true.
    if (start !== undefined) {
      if (start) reveal(true);
      return;
    }

    // Default: animate once when the element scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate, scope, filter, duration, start]);

  // Dynamic tag: `any` sidesteps the polymorphic-ref typing dance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = Component;

  return (
    <Tag ref={scope} className={className} {...rest}>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {line.map((word, wi) => (
            <span
              // Inherit color/font/size from the parent element — no overrides.
              key={`${li}-${wi}`}
              className="opacity-0"
              style={{ filter: filter ? "blur(10px)" : "none" }}
            >
              {word}
              {wi < line.length - 1 ? " " : ""}
            </span>
          ))}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </Tag>
  );
}
