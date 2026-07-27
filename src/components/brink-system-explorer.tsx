"use client";

/**
 * BRINK / HOW BRINK WORKS — merged 3D system explorer
 * ------------------------------------------------------
 * One tall (340vh) sticky/pinned section. The BrynkHeadband3D explode is the
 * full-bleed visual (pinned in the viewport); the heading sits at the top and
 * the 01–07 stepper floats alongside. A single scroll drives BOTH the explode
 * (progressRef, read every frame inside the canvas) AND the stepper — 01 at the
 * top of the section, 07 at full explode — so the narrative and the animation
 * are one thing. Clicking a pill/chevron scrolls to that step, which the scroll
 * handler then reflects back into the active state, keeping clicks + scroll in
 * sync.
 *
 * Restyled to the Brink design system: IBM Plex Mono base (font-mono-df),
 * Newsreader display heading (font-grotesque), off-white #e8e4d8 (df-white)
 * on ink #0a0c10 (df-black), amber-red #ff5b3a (df-orange) as the single accent.
 *
 * The 3D scene (BrynkExplodeScene) is loaded client-only via next/dynamic
 * (react-three-fiber can't be server-rendered). Rendering the scene directly
 * adds no extra scroll container and no transform/overflow that would break the
 * section's position: sticky.
 *
 * Usage:  <BrinkSystemExplorer />
 */

import { KeyboardEvent, memo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import LineSidebar from "@/components/ui/line-sidebar";
import GradualBlur from "@/components/ui/gradual-blur";

const MEDIA = "/media";
const INK = "#0A0E14"; // matches the canvas background so there is no seam

// react-three-fiber's <Canvas> can't be server-rendered; load the scene on the
// client only. dynamic() renders it directly (no wrapper element), so the
// section's sticky pin is unaffected.
const BrynkExplodeScene = dynamic(
  () => import("@/components/BrynkHeadband3D").then((m) => m.BrynkExplodeScene),
  { ssr: false },
);

/* ----------------------------- typed content ----------------------------- */

type ItemMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster: string; still: string; alt: string };

interface ExplorerItem {
  id: string;
  label: string;
  title: string;
  description: string;
  media: ItemMedia;
}

const ITEMS: ExplorerItem[] = [
  {
    id: "frontal-sensing",
    label: "Frontal Sensing",
    title: "Frontal Sensing.",
    description:
      "Sensors sit where effort begins. They read neural, body, and motion signals in real time.",
    media: {
      type: "image",
      src: `${MEDIA}/state-sensing.jpg`,
      alt: "An athlete wearing the BRINK headband across the forehead, sensor array facing forward",
    },
  },
  {
    id: "internal-architecture",
    label: "Internal Architecture",
    title: "Internal Architecture.",
    description:
      "Sensing, processing, power, and feedback in one stack. Everything happens on the band, in real time.",
    media: {
      type: "video",
      src: `${MEDIA}/headband-exploded-2s.mp4`,
      poster: `${MEDIA}/headband-exploded-poster.jpg`,
      still: `${MEDIA}/headband-exploded-still.jpg`,
      alt: "The BRINK headband opening into an exploded view of its internal component stack",
    },
  },
  {
    id: "signal-intelligence",
    label: "Signal Intelligence",
    title: "Signal Intelligence.",
    description:
      "Sweat, movement, and noise get filtered out. What's left is one clean read on your state.",
    media: {
      type: "image",
      src: `${MEDIA}/state-signal.jpg`,
      alt: "Chaotic tangled threads of light pass through the BRINK band and emerge as one clean signal",
    },
  },
  {
    id: "personal-baseline",
    label: "Personal Baseline",
    title: "Personal Baseline.",
    description:
      "BRINK learns what focus, strain, and recovery look like for you. Not for an average athlete.",
    media: {
      type: "image",
      src: `${MEDIA}/state-baseline.jpg`,
      alt: "A profile of an athlete wearing BRINK, traced by a personal contour of light",
    },
  },
  {
    id: "brink-prediction",
    label: "Brink Prediction",
    title: "Brink Prediction.",
    description:
      "The pattern shows up before you break. BRINK catches it while there's still time to act.",
    media: {
      type: "image",
      src: `${MEDIA}/state-prediction.jpg`,
      alt: "A line of dominoes beginning to fall, one domino far ahead already marked by a beam of light",
    },
  },
  {
    id: "adaptive-cue",
    label: "Adaptive Cue",
    title: "Adaptive Cue.",
    description:
      "A subtle cue at the right moment. You reset, settle, and keep going.",
    media: {
      type: "image",
      src: `${MEDIA}/state-cue.jpg`,
      alt: "A gentle pulse of light radiating from the BRINK headband at the temple",
    },
  },
  {
    id: "safety-intelligence",
    label: "Safety Intelligence",
    title: "Safety Intelligence.",
    description:
      "Some limits are mental. Some are real. BRINK is built to know the difference, and when to back off.",
    media: {
      type: "image",
      src: `${MEDIA}/state-safety.jpg`,
      alt: "A night mountain with two lit paths from one junction: continue up, or descend to camp",
    },
  },
];

type LiveState = "ready" | "approaching" | "recover";
// Monochrome + single accent: off-white at rest, amber-red only for the brink
// warning, muted gray for recovery.
const LIVE_STATES: { id: LiveState; label: string; dot: string }[] = [
  { id: "ready", label: "Ready", dot: "#e8e4d8" },
  { id: "approaching", label: "Approaching Brink", dot: "#ff5b3a" },
  { id: "recover", label: "Recover", dot: "#7c7a76" },
];

/* ------------------------------- component ------------------------------- */

// The heading is memoized (no props) so scroll-driven activeIndex re-renders of
// the parent never re-render it. That matters because TextGenerateEffect reveals
// its words once (guarded by an internal `started` ref) and re-rendering would
// re-apply each span's JSX blur(10px) inline style without re-clearing it,
// leaving the tail of the headline permanently blurred.
const ExplorerHeading = memo(function ExplorerHeading() {
  return (
    <header className="max-w-2xl">
      <p className="mb-3 font-mono-df text-[0.58rem] tracking-[0.28em] text-df-white/40">
        HOW BRINK WORKS
      </p>
      <TextGenerateEffect
        as="h2"
        id="bse-heading"
        words="One system. Every moment between resistance and your real limit."
        filter={true}
        duration={0.8}
        className="font-grotesque text-2xl leading-[1.05] tracking-tight text-df-white sm:text-4xl lg:text-5xl"
      />
      <p className="mt-3.5 max-w-lg text-[0.9rem] leading-relaxed text-df-white/50">
        BRINK reads you, learns you, and steps in at the right moment. It gets
        sharper with every session.
      </p>
    </header>
  );
});

export default function BrinkSystemExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  // Mount the WebGL scene (and its ~14MB of GLBs) only once the visitor is
  // within ~1.5 viewports of the section — page load stays light, especially
  // on mobile data. Once mounted it stays mounted.
  const [sceneNear, setSceneNear] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Scroll progress (0 → 1) across the section. A plain ref, not state, so the
  // explode never triggers a React re-render — the canvas reads it each frame.
  const progressRef = useRef(0);

  const live = LIVE_STATES[liveIndex];
  const count = ITEMS.length;

  // One scroll listener drives the whole section: it writes explode progress to
  // progressRef every event, and advances the 01–07 stepper only when the
  // discrete step actually changes (so at most `count` state updates over the
  // full scroll — the explode itself stays render-free).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      progressRef.current = p;
      const idx = Math.min(count - 1, Math.max(0, Math.floor(p * count)));
      setActiveIndex((cur) => (cur === idx ? cur : idx));
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [count]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSceneNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Click a pill / chevron → scroll to the middle of that step's band. The
  // scroll handler above then advances activeIndex, keeping clicks + scroll and
  // the explode all in sync (one source of truth: scroll position).
  const goToStep = (next: number) => {
    const idx = ((next % count) + count) % count;
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const sectionTop = window.scrollY + rect.top;
    const frac = count > 1 ? (idx + 0.5) / count : 0;
    window.scrollTo({ top: Math.round(sectionTop + total * frac), behavior: "smooth" });
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number | undefined> = {
      ArrowDown: activeIndex + 1,
      ArrowUp: activeIndex - 1,
      Home: 0,
      End: count - 1,
    };
    const target = keys[e.key];
    if (target === undefined) return;
    e.preventDefault();
    goToStep(target);
  };

  return (
    <section
      ref={sectionRef}
      id="how-brink-works"
      aria-labelledby="bse-heading"
      className="relative font-mono-df"
      style={{ height: "340vh", background: INK }}
    >
      {/* pinned viewport: the canvas + narrative overlay stay put while the
          340vh section scrolls past, driving the explode 0 → 1. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* 3D explode — full-bleed visual (replaces the old static photo stack).
            BrynkExplodeScene fills this positioned parent and carries its own
            vignette; MODEL_X (in the component) offsets the model right so the
            left column below stays clear. */}
        {sceneNear && <BrynkExplodeScene progressRef={progressRef} />}

        {/* readability scrim so heading + pills stay legible over the model */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-df-black/75 via-df-black/10 to-df-black/55 lg:bg-gradient-to-r lg:from-df-black/85 lg:via-df-black/15 lg:to-transparent"
        />

        {/* narrative overlay: heading + stepper as one vertically-centered
            column on the left, so the stepper never collides with the top bar
            or the bottom blur regardless of viewport height. */}
        <div className="relative z-10 mx-auto flex h-full max-w-[76rem] flex-col justify-center gap-7 px-5 py-10 sm:px-8">
          {/* header (memoized so scroll re-renders don't restart its reveal) */}
          <ExplorerHeading />

          {/* ---------------- floating pill column (scroll-synced) ---------------- */}
          <div className="flex items-start gap-3">
            {/* chevrons: scroll to prev/next step */}
            <div className="hidden flex-col gap-2.5 lg:flex">
              <button
                onClick={() => goToStep(activeIndex - 1)}
                aria-label="Previous state"
                className="grid h-10 w-10 place-items-center rounded-full bg-df-white/[0.06] text-df-white backdrop-blur-2xl ring-1 ring-df-white/10 transition-colors hover:bg-df-white/[0.14]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 9 L7 4 L12 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => goToStep(activeIndex + 1)}
                aria-label="Next state"
                className="grid h-10 w-10 place-items-center rounded-full bg-df-white/[0.06] text-df-white backdrop-blur-2xl ring-1 ring-df-white/10 transition-colors hover:bg-df-white/[0.14]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 5 L7 10 L12 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* pills */}
            <div ref={listRef} onKeyDown={onListKeyDown} className="flex w-full max-w-[20.5rem] flex-col items-start gap-2.5">
              {/* live-state pill: click to cycle */}
              <button
                onClick={() => setLiveIndex((liveIndex + 1) % LIVE_STATES.length)}
                aria-label={`Live state: ${live.label}. Activate to cycle.`}
                className="flex min-h-11 items-center gap-3 rounded-full bg-df-white/[0.06] py-2 pl-2.5 pr-5 backdrop-blur-2xl ring-1 ring-df-white/10 transition-colors hover:bg-df-white/[0.14]"
              >
                <span
                  aria-hidden="true"
                  className="h-[22px] w-[22px] rounded-full transition-colors duration-300"
                  style={{ background: live.dot, boxShadow: `0 0 14px ${live.dot}55` }}
                />
                <span className="text-[0.95rem] font-medium text-df-white">{live.label}</span>
              </button>

              {/* description box: active item's title + copy (advances on scroll) */}
              <div
                id={`bse-panel-${ITEMS[activeIndex].id}`}
                role="region"
                aria-label={ITEMS[activeIndex].title}
                className="w-full max-w-[20.5rem] rounded-[1.3rem] bg-df-white/[0.07] px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-df-white/10 backdrop-blur-2xl"
              >
                <p className="text-[0.84rem] leading-relaxed text-df-white/60">
                  <strong className="font-semibold text-df-white">{ITEMS[activeIndex].title}</strong>{" "}
                  {ITEMS[activeIndex].description}
                </p>
              </div>

              {/* animated numbered line list (React Bits LineSidebar), controlled
                  by scroll-derived activeIndex; clicking scrolls to that step. */}
              <LineSidebar
                items={ITEMS.map((it) => it.label)}
                activeIndex={activeIndex}
                onItemClick={(i) => goToStep(i)}
                accentColor="#ff5b3a"
                textColor="#6b6b6b"
                markerColor="#6b6b6b"
                showIndex
                showMarker
                proximityRadius={90}
                maxShift={22}
                falloff="smooth"
                markerLength={46}
                markerGap={0}
                tickScale={0.5}
                scaleTick
                itemGap={12}
                fontSize={0.9}
                smoothing={120}
                className="mt-1"
              />

              {/* mobile prev/next */}
              <div className="mt-1 flex gap-3 lg:hidden">
                <button
                  onClick={() => goToStep(activeIndex - 1)}
                  aria-label="Previous state"
                  className="grid h-11 w-11 place-items-center rounded-full bg-df-white/[0.1] text-df-white"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 9 L7 4 L12 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => goToStep(activeIndex + 1)}
                  aria-label="Next state"
                  className="grid h-11 w-11 place-items-center rounded-full bg-df-white/[0.1] text-df-white"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 5 L7 10 L12 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* soft blur fade at the bottom edge of the pinned viewport */}
        <GradualBlur
          target="parent"
          position="bottom"
          height="3rem"
          strength={2}
          divCount={6}
          curve="bezier"
          opacity={1}
        />
      </div>
    </section>
  );
}
