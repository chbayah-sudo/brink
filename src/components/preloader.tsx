"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// ===========================================================================
// BRINK preloader.
// Loading phase = a Bayer-dithered flow field (cipher.tv vibe) on cream, with a
// small spinning aperture mark + a live counter. Then the BRINK wordmark
// converges ("BR · [%] · INK") and flies up to land on the permanent masthead
// while the cream field fades to reveal the (dark) site.
// ---------------------------------------------------------------------------
const DURATION = 800; // ms of the count-up (snappy — ~1.2s total)
const HOLD = 60;
const GLYPHS = "ABCDEFGHKMNPRSTVWXZ0123456789#%*+=/·";
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

const LABEL_TL = "BRINK";
const LABEL_TR = "© 2026";
const LABEL_BL = "NEUROTECH";
const LABEL_BR = "PRE-FATIGUE DETECTION";

// --- dithered field tuning ---
const DOT = 9; // grid spacing (px) between dots
const DOT_SIZE = 2.6; // drawn dot size (px)
const FIELD_SCALE = 3.1;
const FLOW = 0.5;
const THRESH = 0.6; // higher = fewer dots
const CREAM = "#e8e4d8";
const INK_DOT = "rgba(18,20,26,0.85)";

function smoothstep(t: number) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}
function frac(x: number) {
  return x - Math.floor(x);
}
function bayer2(x: number, y: number) {
  x = Math.floor(x);
  y = Math.floor(y);
  return frac(x / 2 + (y * y) * 0.75);
}
function bayer4(x: number, y: number) {
  return bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);
}
function bayer8(x: number, y: number) {
  return bayer4(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);
}
function ihash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = ihash(xi, yi);
  const b = ihash(xi + 1, yi);
  const c = ihash(xi, yi + 1);
  const d = ihash(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
function fbm(x: number, y: number) {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < 2; i += 1) {
    s += amp * vnoise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return s;
}

function scramble(target: string, progress: number) {
  const n = target.length;
  let out = "";
  for (let i = 0; i < n; i += 1) {
    const ch = target[i];
    if (ch === " " || ch === "©" || ch === ",") {
      out += ch;
      continue;
    }
    const threshold = 0.12 + (i / Math.max(1, n - 1)) * 0.72;
    out += progress >= threshold ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  return out;
}

export function Preloader() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"run" | "exit" | "gone">("run");
  const rafRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // count-up
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);
    if (reduce) {
      setPct(100);
      const id = window.setTimeout(() => setPhase("exit"), 480);
      return () => window.clearTimeout(id);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const lin = Math.min(1, (now - start) / DURATION);
      setPct(Math.round(smoothstep(lin) * 100));
      if (lin < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setPct(100);
        window.setTimeout(() => setPhase("exit"), HOLD);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Bayer-dithered field render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // static single frame
      const cw = (canvas.width = window.innerWidth);
      const ch = (canvas.height = window.innerHeight);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, cw, ch);
      return;
    }
    let raf = 0;
    let last = 0;
    const render = (time: number) => {
      raf = requestAnimationFrame(render);
      if (time - last < 1000 / 40) return;
      last = time;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      const t = time * 0.00006 * FLOW;
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = INK_DOT;
      const gw = Math.ceil(cw / DOT);
      const gh = Math.ceil(ch / DOT);
      for (let gy = 0; gy < gh; gy += 1) {
        const ny = gy / gh;
        for (let gx = 0; gx < gw; gx += 1) {
          const nx = gx / gw;
          const wx = vnoise(nx * 2 + t, ny * 2) * 0.5;
          const val = fbm((nx + wx) * FIELD_SCALE + t, ny * FIELD_SCALE - t * 0.7);
          if (val + (bayer8(gx, gy) - 0.5) * 0.5 > THRESH) {
            ctx.fillRect(gx * DOT, gy * DOT, DOT_SIZE, DOT_SIZE);
          }
        }
      }
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase === "gone") document.documentElement.style.overflow = "";
  }, [phase]);

  if (phase === "gone") return null;

  const exiting = phase === "exit";
  const progress = pct / 100;

  const corner =
    "pointer-events-none absolute font-mono-df text-[0.62rem] tracking-[0.22em] text-df-black/45 uppercase";

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {/* dithered loading field + chrome — fades away on exit to reveal the hero */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        onAnimationComplete={() => {
          if (phase === "exit") setPhase("gone");
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* scramble corners */}
        <span className={`${corner} left-6 top-5`}>{scramble(LABEL_TL, progress)}</span>
        <span className={`${corner} right-6 top-5`}>{scramble(LABEL_TR, progress)}</span>
        <span className={`${corner} bottom-5 left-6`}>{scramble(LABEL_BL, progress)}</span>
        <span className={`${corner} bottom-5 right-6`}>{scramble(LABEL_BR, progress)}</span>

        {/* centred counter */}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono-df text-sm font-normal tracking-normal text-df-black/70 tabular-nums md:text-base">
          {pct}%
        </span>

        {/* progress rule */}
        <div className="absolute bottom-0 left-0 h-px w-full bg-df-black/10">
          <div
            className="h-full bg-df-orange"
            style={{ width: `${pct}%`, transition: "width 80ms linear" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default Preloader;
