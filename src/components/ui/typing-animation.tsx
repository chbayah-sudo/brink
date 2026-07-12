"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

import { cn } from "@/lib/utils";

type CursorStyle = "block" | "line" | "underscore";

interface TypingAnimationProps {
  /** Phrases typed and deleted in sequence. */
  phrases: string[];
  /** Element to render as (e.g. "h1", "h2", "p"). Defaults to span. */
  as?: ElementType;
  className?: string;
  cursorClassName?: string;
  /** ms per character while typing. */
  typeSpeed?: number;
  /** ms per character while deleting. */
  deleteSpeed?: number;
  /** ms to hold a fully-typed phrase before deleting. */
  pauseDelay?: number;
  /** Restart from the first phrase after the last. */
  loop?: boolean;
  /** Wait until the element scrolls into view before starting. */
  startOnView?: boolean;
  cursorStyle?: CursorStyle;
}

export function TypingAnimation({
  phrases,
  as: Component = "span",
  className,
  cursorClassName,
  typeSpeed = 70,
  deleteSpeed = 40,
  pauseDelay = 1800,
  loop = true,
  startOnView = true,
  cursorStyle = "block",
}: TypingAnimationProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [reduced, setReduced] = useState(false);
  const [started, setStarted] = useState(!startOnView);
  const [display, setDisplay] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");
  const [cursorOn, setCursorOn] = useState(true);

  // Honor prefers-reduced-motion: fall back to the first phrase, static.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // startOnView: begin once the element is on screen.
  useEffect(() => {
    if (started) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Type -> pause -> delete -> next phrase. Reacts to each display/phase change,
  // scheduling exactly one timeout per step so speeds stay independent.
  useEffect(() => {
    if (reduced || !started || phrases.length === 0) return;
    const current = phrases[phraseIndex % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (display.length < current.length) {
        timeout = setTimeout(
          () => setDisplay(current.slice(0, display.length + 1)),
          typeSpeed
        );
      } else {
        timeout = setTimeout(() => setPhase("deleting"), pauseDelay);
      }
    } else {
      if (display.length > 0) {
        timeout = setTimeout(
          () => setDisplay(current.slice(0, display.length - 1)),
          deleteSpeed
        );
      } else {
        const next = phraseIndex + 1;
        if (!loop && next >= phrases.length) return; // stop at the end
        setPhraseIndex(next % phrases.length);
        setPhase("typing");
        return;
      }
    }
    return () => clearTimeout(timeout);
  }, [
    display,
    phase,
    phraseIndex,
    started,
    reduced,
    phrases,
    typeSpeed,
    deleteSpeed,
    pauseDelay,
    loop,
  ]);

  // Blink the cursor — but stay solid under reduced motion (no animation).
  useEffect(() => {
    if (reduced) {
      setCursorOn(true);
      return;
    }
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, [reduced]);

  const text = reduced ? (phrases[0] ?? "") : display;

  const cursorShape =
    cursorStyle === "block"
      ? "w-[0.6em] h-[1.05em]"
      : cursorStyle === "underscore"
        ? "w-[0.6em] h-[0.12em] self-end mb-[0.12em]"
        : "w-[0.09em] h-[1.05em]";

  // Dynamic tag: `any` sidesteps the polymorphic-ref typing dance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = Component;

  return (
    <Tag ref={ref} className={cn("inline-flex items-center", className)}>
      <span className="sr-only">{phrases.join(". ")}</span>
      <span aria-hidden="true" className="whitespace-pre">
        {text}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "ml-[0.08em] inline-block bg-df-orange",
          cursorShape,
          cursorOn ? "opacity-100" : "opacity-0",
          cursorClassName
        )}
      />
    </Tag>
  );
}
