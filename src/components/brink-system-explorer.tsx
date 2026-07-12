"use client";

/**
 * BRINK / HOW BRINK WORKS interactive system explorer
 * ------------------------------------------------------
 * Visual clone of the Skiper UI `skiper76` interaction model (the registry
 * is license-gated, so the design was rebuilt from reference screenshots):
 * one large dark canvas, full-bleed media, floating pill accordion on the
 * left, one item expanded at a time, up/down chevrons, and a top state pill.
 *
 * Every media state is a Higgsfield-generated photograph or animation of the
 * BRINK headband, no code-drawn visualizations. "Internal Architecture"
 * plays the Higgsfield exploded reveal at 2.5× speed (pre-rendered).
 *
 * Restyled to the Brink design system: IBM Plex Mono base (font-mono-df),
 * Newsreader display heading (font-grotesque), off-white #e8e4d8 (df-white)
 * on ink #0a0c10 (df-black), and amber-red #ff5b3a (df-orange) as the single
 * accent — reserved for the "Approaching Brink" live state.
 *
 * Self-contained: React + Tailwind + next/image. No animation library.
 *
 * Required assets (public/media/):
 *   state-sensing.jpg        headband-exploded-2s.mp4 (+poster/still)
 *   state-signal.jpg         state-baseline.jpg
 *   state-prediction.jpg     state-cue.jpg            state-safety.jpg
 *
 * Usage:  <BrinkSystemExplorer />
 */

import Image from "next/image";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const MEDIA = "/media";

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

/* Component terminology from the project's headband documentation. */
const INTERNAL_HOTSPOTS: { label: string; x: number; y: number }[] = [
  { label: "NEURAL SENSING ARRAY", x: 64, y: 32 },
  { label: "OPTICAL SENSING LAYER", x: 20, y: 41 },
  { label: "MOTION SENSING", x: 74, y: 48 },
  { label: "ONBOARD PROCESSING", x: 22, y: 58 },
  { label: "POWER SYSTEM", x: 64, y: 66 },
  { label: "HAPTIC FEEDBACK", x: 26, y: 72 },
];

type LiveState = "ready" | "approaching" | "recover";
// Monochrome + single accent: off-white at rest, amber-red only for the brink
// warning, muted gray for recovery.
const LIVE_STATES: { id: LiveState; label: string; dot: string }[] = [
  { id: "ready", label: "Ready", dot: "#e8e4d8" },
  { id: "approaching", label: "Approaching Brink", dot: "#ff5b3a" },
  { id: "recover", label: "Recover", dot: "#7c7a76" },
];

/* --------------------------------- hooks --------------------------------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useInView<T extends Element>(margin = "0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, inView };
}

/* ----------------------------- exploded video ---------------------------- */

function ExplodedMedia({
  media,
  active,
  inView,
  reduced,
}: {
  media: Extract<ItemMedia, { type: "video" }>;
  active: boolean;
  inView: boolean;
  reduced: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  // Play the 2.5×-speed reveal once per activation; hold the exploded end.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;
    if (active && inView) {
      if (video.duration && video.currentTime >= video.duration - 0.05) return;
      video.play().catch(() => {});
    } else if (!active) {
      video.pause();
      video.currentTime = 0;
    } else {
      video.pause();
    }
  }, [active, inView, reduced]);

  const showHotspots = reduced || (active && ended);

  return (
    <div className="absolute inset-0 lg:left-[38%] bg-transparent lg:[mask-image:linear-gradient(to_right,transparent,black_12%)]">
      {reduced ? (
        <Image src={media.still} alt={media.alt} fill sizes="100vw" className="object-contain" unoptimized />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          src={media.src}
          poster={media.poster}
          muted
          playsInline
          preload="metadata"
          onPlay={() => setEnded(false)}
          onEnded={() => setEnded(true)}
          aria-label={media.alt}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ opacity: showHotspots ? 1 : 0 }}
        aria-hidden={!showHotspots}
      >
        {INTERNAL_HOTSPOTS.map((h, i) => (
          <p
            key={h.label}
            className="absolute m-0 max-w-[30%] rounded border border-df-white/15 bg-df-black/60 px-2 py-0.5 font-mono-df text-[0.54rem] tracking-[0.16em] text-df-white/90 backdrop-blur-sm"
            style={{ left: `${h.x}%`, top: `${h.y}%`, transitionDelay: `${i * 90}ms` }}
          >
            {h.label}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- component ------------------------------- */

export default function BrinkSystemExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const reduced = useReducedMotion();
  const { ref: sectionRef, inView } = useInView<HTMLElement>("15%");
  const listRef = useRef<HTMLDivElement>(null);

  const live = LIVE_STATES[liveIndex];
  const count = ITEMS.length;
  const go = useMemo(
    () => (next: number) => setActiveIndex(((next % count) + count) % count),
    [count],
  );

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
    const idx = ((target % count) + count) % count;
    go(idx);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>("[data-bse-trigger]")
      [idx]?.focus();
  };

  return (
    <section
      ref={sectionRef}
      id="how-brink-works"
      aria-labelledby="bse-heading"
      className="mx-auto w-full max-w-[62rem] px-4 py-12 font-mono-df sm:px-6 lg:px-6 lg:py-16"
    >
      {/* header: remove if the surrounding page already tells this story */}
      <header className="mb-7 max-w-2xl lg:mb-9">
        <p className="mb-3 font-mono-df text-[0.58rem] tracking-[0.28em] text-df-white/40">HOW BRINK WORKS</p>
        <TextGenerateEffect
          as="h2"
          id="bse-heading"
          words="One system. Every moment between resistance and your real limit."
          filter={true}
          duration={0.8}
          className="font-grotesque text-3xl leading-[1.05] tracking-tight text-df-white sm:text-4xl lg:text-5xl"
        />
        <p className="mt-3.5 max-w-lg text-[0.95rem] leading-relaxed text-df-white/50">
          BRINK reads you, learns you, and steps in at the right moment. It gets
          sharper with every session.
        </p>
      </header>

      {/* ============================ the canvas ============================ */}
      <div className="relative mx-auto overflow-hidden rounded-[1.5rem] bg-df-black">
        {/* full-bleed media stack */}
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[16/10]">
          {ITEMS.map((item, i) => {
            const on = i === activeIndex;
            return (
              <div
                key={item.id}
                aria-hidden={!on}
                className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  opacity: on ? 1 : 0,
                  transform: reduced ? "none" : on ? "scale(1)" : "scale(1.02)",
                  pointerEvents: on ? "auto" : "none",
                }}
              >
                {item.media.type === "image" ? (
                  <div className="absolute inset-0 lg:left-[38%] lg:[mask-image:linear-gradient(to_right,transparent,black_16%)]">
                    <Image
                      src={item.media.src}
                      alt={item.media.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 62vw"
                      className="object-cover lg:[object-position:68%_50%]"
                      unoptimized
                      priority={i === 0}
                    />
                  </div>
                ) : (
                  <ExplodedMedia media={item.media} active={on} inView={inView} reduced={reduced} />
                )}
              </div>
            );
          })}
          {/* left readability scrim under the pills */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[46%] bg-gradient-to-r from-df-black/70 via-df-black/25 to-transparent lg:block"
          />
        </div>

        {/* ---------------- floating pill column (skiper76 layout) ---------------- */}
        <div className="pointer-events-none inset-0 flex lg:absolute">
          <div className="pointer-events-auto flex w-full items-center gap-3 bg-df-black px-4 py-6 sm:px-6 lg:w-auto lg:bg-transparent lg:pl-5 lg:pr-0">
            {/* chevrons */}
            <div className="hidden flex-col gap-2.5 lg:flex" aria-hidden="false">
              <button
                onClick={() => go(activeIndex - 1)}
                aria-label="Previous state"
                className="grid h-10 w-10 place-items-center rounded-full bg-df-white/[0.06] text-df-white backdrop-blur-2xl ring-1 ring-df-white/10 transition-colors hover:bg-df-white/[0.14]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 9 L7 4 L12 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => go(activeIndex + 1)}
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
              {/* live-state pill (the "Colors" slot): click to cycle */}
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

              {ITEMS.map((item, i) => {
                const open = i === activeIndex;
                return open ? (
                  /* expanded card: bold title runs inline into the description */
                  <div
                    key={item.id}
                    id={`bse-panel-${item.id}`}
                    role="region"
                    aria-label={item.title}
                    className="w-full rounded-[1.3rem] bg-df-white/[0.07] px-5 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-df-white/10 backdrop-blur-2xl"
                  >
                    <button
                      data-bse-trigger
                      aria-expanded="true"
                      aria-controls={`bse-panel-${item.id}`}
                      onClick={() => go(i)}
                      className="text-left"
                    >
                      <p className="text-[0.9rem] leading-relaxed text-df-white/60">
                        <strong className="font-semibold text-df-white">{item.title}</strong>{" "}
                        {item.description}
                      </p>
                    </button>
                  </div>
                ) : (
                  <button
                    key={item.id}
                    data-bse-trigger
                    aria-expanded="false"
                    aria-controls={`bse-panel-${item.id}`}
                    onClick={() => go(i)}
                    className="flex min-h-11 items-center gap-3 rounded-full bg-df-white/[0.06] py-2 pl-2.5 pr-5 backdrop-blur-2xl ring-1 ring-df-white/10 transition-colors hover:bg-df-white/[0.14]"
                  >
                    <span aria-hidden="true" className="grid h-[22px] w-[22px] place-items-center rounded-full bg-df-white/[0.12]">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="text-[0.95rem] font-medium text-df-white">{item.label}</span>
                  </button>
                );
              })}

              {/* mobile prev/next */}
              <div className="mt-1 flex gap-3 lg:hidden">
                <button
                  onClick={() => go(activeIndex - 1)}
                  aria-label="Previous state"
                  className="grid h-11 w-11 place-items-center rounded-full bg-df-white/[0.1] text-df-white"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 9 L7 4 L12 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => go(activeIndex + 1)}
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
      </div>
    </section>
  );
}
