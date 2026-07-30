"use client";

import { RefObject } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useState } from "react";
import { HyperText } from "@/components/ui/hyper-text";

// ===========================================================================
// THE SIGNAL PATH — sticky-step scrollytelling alongside the nerve.
// ---------------------------------------------------------------------------
// As the nerve draws down the centre of the pinned brain viewport, these beats
// reveal one at a time, alternating left/right, each branching off the nerve at
// a pulsing node. The narrative rides the anatomy: cortex -> cord -> sensing ->
// return. Each beat is scroll-scrubbed (reveal, hold, exit) so nothing pops.
//
// Windows are in the section's scrollYProgress (0 at top, 1 at bottom). The
// brain assembles over roughly the first ~0.22 (one viewport of a ~4.6-viewport
// section), so beats live from ~0.28 to ~0.99.
// ===========================================================================

type Beat = {
  index: string; // "01"
  tag: string; // mono chrome, e.g. "PREFRONTAL CORTEX"
  side: "left" | "right";
  vy: number; // vertical anchor (% of viewport) the node + block centre on
  title: string;
  body: string;
  prefix?: string; // e.g. "+"
  value: number; // counted up as you scroll in
  decimals?: number;
  unit: string; // e.g. "%", "m/s", "Hz"
  caption: string; // small label under the stat
  start: number; // scrollYProgress window
  end: number;
};

const BEATS: Beat[] = [
  {
    index: "01",
    tag: "PREFRONTAL CORTEX · RECOGNIZE",
    side: "left",
    vy: 44,
    title: "It starts\nin the brain",
    body: "Cognitive and physical breakdown begin as a neural signature, long before anything shows on the outside.",
    value: 1000,
    unit: "Hz",
    caption: "NEURAL SAMPLING",
    start: 0.28,
    end: 0.48,
  },
  {
    index: "02",
    tag: "SPINAL RELAY · PREDICT",
    side: "right",
    vy: 52,
    title: "Decline runs\nahead of you",
    body: "The signal races brain to body between two heartbeats. Brink sees the slide before it becomes visible.",
    value: 120,
    unit: "m/s",
    caption: "CONDUCTION VELOCITY",
    start: 0.45,
    end: 0.65,
  },
  {
    index: "03",
    tag: "BRINK · INTERVENE",
    side: "left",
    vy: 47,
    title: "It steps in\nbefore the break",
    body: "A personalized cue at the exact moment it matters, unlocking capacity your brain was still holding back.",
    value: 3,
    unit: "×",
    caption: "RESERVE BEYOND EXHAUSTION · MARCORA 2010",
    start: 0.62,
    end: 0.82,
  },
  {
    index: "04",
    tag: "ADAPTIVE LOOP · LEARN",
    side: "right",
    vy: 55,
    title: "It learns\nwhat works",
    body: "Every session tunes the model to your brain and body. Your limits, mapped, protected, and extended over time.",
    prefix: "N=",
    value: 1,
    unit: "",
    caption: "CALIBRATED TO YOU, NOT AN AVERAGE",
    start: 0.79,
    end: 0.99,
  },
];

function Counter({
  value,
  prefix,
  unit,
  decimals = 0,
}: {
  value: MotionValue<number>;
  prefix?: string;
  unit: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState("0");
  useMotionValueEvent(value, "change", (v) => {
    setDisplay(
      (decimals ? v.toFixed(decimals) : Math.round(v).toString()).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      )
    );
  });
  return (
    <div className="flex items-end gap-2 leading-none">
      <span className="font-mono-df text-df-white text-6xl md:text-8xl tabular-nums tracking-tight">
        {prefix}
        {display}
      </span>
      <span className="font-mono-df text-df-orange text-xl md:text-3xl pb-1 md:pb-2">
        {unit}
      </span>
    </div>
  );
}

function BeatBlock({
  beat,
  progress,
  reduced,
}: {
  beat: Beat;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  // Local 0..1 across this beat's scroll window.
  const local = useTransform(progress, [beat.start, beat.end], [0, 1], {
    clamp: true,
  });

  // Reveal (fast in) -> hold -> exit (out), all scrubbed.
  const opacity = useTransform(local, [0, 0.16, 0.82, 1], [0, 1, 1, 0]);
  const y = useTransform(
    local,
    [0, 0.2, 0.86, 1],
    reduced ? [0, 0, 0, 0] : [40, 0, 0, -28]
  );
  const blurPx = useTransform(
    local,
    [0, 0.22, 0.84, 1],
    reduced ? [0, 0, 0, 0] : [14, 0, 0, 10]
  );
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  // On-scroll scramble (Codrops "ScrollTextMotion"): the beat's tag + title
  // scramble-decode as it enters its scroll window, and re-scramble when it's
  // scrolled back to (mirrors ScrambleTextPlugin's onEnter / onEnterBack).
  const [entered, setEntered] = useState(false);
  useMotionValueEvent(local, "change", (v) => {
    setEntered(v > 0.12 && v < 0.88);
  });

  // Stat counts up as the beat resolves.
  const counted = useTransform(local, [0.12, 0.56], [0, beat.value], {
    clamp: true,
  });

  // Connector draw + node pulse.
  const draw = useTransform(local, [0.14, 0.5], [0, 1], { clamp: true });
  const nodeScale = useTransform(local, [0.32, 0.52, 0.82, 1], [0, 1, 1, 0]);
  const nodeGlow = useTransform(local, [0.32, 0.52], [0, 1], { clamp: true });

  // Thin rule under the kicker draws in.
  const ruleScale = useTransform(local, [0.1, 0.4], [0, 1], { clamp: true });

  const isLeft = beat.side === "left";

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      {/* Connector line from block edge to the nerve at centre (desktop only). */}
      <svg
        className="absolute inset-0 hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.line
          x1={isLeft ? 39 : 61}
          y1={beat.vy}
          x2={50}
          y2={beat.vy}
          stroke="#ff5b3a"
          strokeWidth={0.12}
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: draw, opacity: draw }}
        />
      </svg>
      {/* Node on the nerve (real px so it stays a crisp circle). */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "50%", top: `${beat.vy}%`, scale: nodeScale }}
      >
        <motion.span
          className="block h-2.5 w-2.5 rounded-full bg-df-orange"
          style={{
            boxShadow: "0 0 18px 4px rgba(255,91,58,0.75)",
            opacity: nodeGlow,
          }}
        />
      </motion.div>

      {/* Mobile legibility scrim — content drops to a bottom readout panel. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-df-black via-df-black/80 to-transparent md:hidden" />

      {/* The beat content: bottom sheet on mobile, side column on desktop. */}
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-end px-5 pb-24 md:items-center md:px-10 md:pb-0">
        <motion.div
          className={`w-full max-w-[27rem] text-left ${isLeft ? "md:mr-auto md:text-left" : "md:ml-auto md:text-right"}`}
          style={{ y, filter }}
        >
          {/* kicker chrome */}
          <div
            className={`flex items-center gap-3 ${isLeft ? "" : "md:flex-row-reverse"}`}
          >
            <span className="font-mono-df text-df-orange text-xs tracking-[0.3em]">
              /{beat.index}
            </span>
            <HyperText
              as="span"
              active={entered}
              duration={550}
              animateOnHover={false}
              className="font-mono-df text-df-gray text-[11px] tracking-[0.28em] uppercase"
            >
              {beat.tag}
            </HyperText>
          </div>

          {/* animated rule */}
          <motion.div
            className={`mt-4 mb-6 h-px w-24 bg-df-dim origin-left ${isLeft ? "" : "md:origin-right md:ml-auto"}`}
            style={{ scaleX: ruleScale }}
          />

          {/* title — scrambles in line by line on scroll enter */}
          <div className="font-mono-df text-df-white uppercase leading-[1.02] tracking-[0.01em] text-4xl md:text-5xl">
            {beat.title.split("\n").map((line, i) => (
              <HyperText
                key={i}
                as="span"
                active={entered}
                duration={780}
                delay={140 + i * 150}
                animateOnHover={false}
                className="block whitespace-nowrap"
              >
                {line}
              </HyperText>
            ))}
          </div>

          {/* body */}
          <p
            className={`mt-6 font-mono-df text-df-gray text-sm md:text-[15px] leading-[1.55] max-w-[22rem] ${isLeft ? "" : "md:ml-auto"}`}
          >
            {beat.body}
          </p>

          {/* stat */}
          <div className={`mt-8 md:mt-10 ${isLeft ? "" : "md:flex md:flex-col md:items-end"}`}>
            <div className={isLeft ? "" : "md:flex md:flex-row-reverse"}>
              <Counter
                value={counted}
                prefix={beat.prefix}
                unit={beat.unit}
                decimals={beat.decimals}
              />
            </div>
            <div className="mt-3 font-mono-df text-df-dim text-[11px] tracking-[0.24em] uppercase">
              {beat.caption}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function NerveSignals({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const reduced = !!useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {BEATS.map((beat) => (
        <BeatBlock
          key={beat.index}
          beat={beat}
          progress={scrollYProgress}
          reduced={reduced}
        />
      ))}
    </div>
  );
}

export default NerveSignals;
