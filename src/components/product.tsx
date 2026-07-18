"use client";

import { useEffect, useRef } from "react";

/**
 * PRODUCT — "THE DEVICE". Dark, technical, scroll-driven split screen (ARMORY-
 * style layout only — no ARMORY text/product/imagery). Bold statement + bullets
 * on the left with a thin scroll-progress bar; a NEW code-built "neural signal
 * readout" HUD on the right (canvas). All Brink content.
 *
 * Scroll wiring matches the site's tall-section + sticky-pin pattern (see the
 * HOW BRINK WORKS / gallery sections) and the same exponential damping the 3D
 * uses (THREE.MathUtils.damp, replicated below to avoid bundling three here):
 * as you scroll the section, the waveform advances, the PRE-QUIT SIGNATURE
 * spike triggers around mid-scroll, and the state flips DETECTED → INTERVENING
 * near the end. Idles (rAF paused) when off-screen.
 */

const INK = "#0A0E14";
const CYAN = "#3DE1FF";
const ALERT = "#FF3B3B";

const BULLETS = [
  "Reads the pre-quit signal in real time — EEG + fNIRS on the prefrontal cortex.",
  "Catches the neural signature seconds before you consciously decide to stop.",
  "Nudges you past it — self-talk priming, sensory entrainment, taVNS. No lab, no wires.",
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// identical to THREE.MathUtils.damp used by the 3D sections
const damp = (a: number, b: number, lambda: number, dt: number) =>
  b + (a - b) * Math.exp(-lambda * dt);
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

function Bracket({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 border-[#3DE1FF]/45 ${className}`}
    />
  );
}

export function Product() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0); // raw scroll progress 0..1

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null); // scroll-progress fill
  const stateRef = useRef<HTMLSpanElement | null>(null); // MONITORING/DETECTED/INTERVENING
  const calloutRef = useRef<HTMLDivElement | null>(null); // PRE-QUIT SIGNATURE
  const oxyRef = useRef<HTMLSpanElement | null>(null);
  const uvRef = useRef<HTMLSpanElement | null>(null);
  const rpeRef = useRef<HTMLSpanElement | null>(null);
  const dlpfcRef = useRef<HTMLSpanElement | null>(null);

  // scroll → progressRef (same math as the HOW BRINK WORKS / 3D sections)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      progressRef.current = total > 0 ? scrolled / total : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // HUD render loop (damped progress → canvas + DOM readouts)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let disposed = false;
    let inView = true;
    let last = 0;
    let lastNum = 0;
    let d = 0; // damped progress
    let phase = 0; // waveform scroll phase

    const draw = (nowMs: number) => {
      const dt = last ? Math.min(0.05, (nowMs - last) / 1000) : 0.016;
      last = nowMs;
      d = reduce ? progressRef.current : damp(d, progressRef.current, 6, dt);
      phase += reduce ? 0 : dt;

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW < 2 || cssH < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // faint technical grid
      ctx.strokeStyle = "rgba(232,228,216,0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gs = 46;
      for (let x = gs; x < cssW; x += gs) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssH);
      }
      for (let y = gs; y < cssH; y += gs) {
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
      }
      ctx.stroke();

      const midY = cssH * 0.5;
      const baseAmp = Math.min(cssH * 0.15, 84);
      const detX = cssW * 0.62;

      const spikeProg = smoothstep(0.42, 0.56, d); // anomaly builds around mid
      const interv = smoothstep(0.72, 0.9, d); // intervention near the end

      // baseline: faint center line
      ctx.strokeStyle = "rgba(61,225,255,0.16)";
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(cssW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // scrolling EEG-like signal
      const sig = (nx: number) =>
        Math.sin(nx * 26 + phase * 2.2) * 0.45 +
        Math.sin(nx * 61 - phase * 3.1) * 0.22 +
        Math.sin(nx * 13 + phase * 1.3) * 0.3 +
        (hash(Math.floor(nx * 240), Math.floor(phase * 26)) - 0.5) * 0.22;
      // sharp anomaly burst under a narrow envelope centred on detX
      const spike = (nx: number) => {
        const env = Math.exp(-Math.pow((nx - 0.62) / 0.03, 2));
        return env * (Math.sin(nx * 300 + phase * 12) + Math.sin(nx * 150 - phase * 8) * 0.6);
      };

      const step = 2;

      // cyan base trace (right side calms after intervention)
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = CYAN;
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      for (let px = 0; px <= cssW; px += step) {
        const nx = px / cssW;
        let amp = baseAmp;
        if (nx > 0.64) amp *= 1 - interv * 0.72;
        const y = midY - sig(nx) * amp;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // amber-red anomaly overlay near detX (fades as the intervention suppresses it)
      const amberA = spikeProg * (1 - interv * 0.55);
      if (amberA > 0.02) {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = ALERT;
        ctx.shadowColor = ALERT;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = amberA;
        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= cssW; px += step) {
          const nx = px / cssW;
          const env = Math.exp(-Math.pow((nx - 0.62) / 0.05, 2));
          if (env < 0.05) {
            started = false;
            continue;
          }
          const y = midY - (sig(nx) * baseAmp + spike(nx) * spikeProg * baseAmp * 3.4);
          if (!started) {
            ctx.moveTo(px, y);
            started = true;
          } else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // detection marker (dashed vertical hairline, glows amber when firing)
      ctx.strokeStyle =
        spikeProg > 0.3
          ? `rgba(255,59,59,${(0.35 + 0.55 * amberA).toFixed(3)})`
          : "rgba(232,228,216,0.14)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(detX, cssH * 0.12);
      ctx.lineTo(detX, cssH * 0.88);
      ctx.stroke();
      ctx.setLineDash([]);

      // ---- DOM readouts (imperative, no React re-render) ----
      let st = "MONITORING";
      let stColor = CYAN;
      if (d >= 0.8) {
        st = "INTERVENING";
        stColor = CYAN;
      } else if (d >= 0.46) {
        st = "DETECTED";
        stColor = ALERT;
      }
      if (stateRef.current && stateRef.current.textContent !== st) {
        stateRef.current.textContent = st;
        stateRef.current.style.color = stColor;
      }
      if (calloutRef.current) {
        calloutRef.current.style.opacity = smoothstep(0.44, 0.56, d).toFixed(3);
      }

      // lightly ticking values (throttled so they read calm, not blurred)
      if (nowMs - lastNum > 110) {
        lastNum = nowMs;
        const t = nowMs / 1000;
        if (oxyRef.current)
          oxyRef.current.textContent =
            (63 + Math.sin(t * 1.7) * 1.5 - spikeProg * 3.2 + interv * 1.8).toFixed(1) + "%";
        if (uvRef.current)
          uvRef.current.textContent = (16 + Math.sin(t * 3.1) * 2.6 + spikeProg * 21).toFixed(1);
        if (rpeRef.current) rpeRef.current.textContent = (14 + d * 5.5).toFixed(1);
        if (dlpfcRef.current)
          dlpfcRef.current.textContent =
            "+" + (0.7 + spikeProg * 2.3 + Math.sin(t * 2) * 0.12).toFixed(2) + "σ";
      }

      // left scroll-progress fill
      if (barRef.current) barRef.current.style.transform = `scaleX(${d.toFixed(4)})`;
    };

    const loop = (nowMs: number) => {
      if (disposed || !inView) {
        raf = 0;
        return;
      }
      draw(nowMs);
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      (ents) => {
        inView = ents.some((e) => e.isIntersecting);
        if (inView && !raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        }
      },
      { rootMargin: "10%" },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(() => draw(performance.now()));
    ro.observe(canvas);

    draw(performance.now());
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <section
      id="product"
      ref={sectionRef}
      aria-labelledby="product-heading"
      className="relative font-mono-df"
      style={{ height: "220vh", background: INK }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="mx-auto flex h-full max-w-[92rem] flex-col gap-8 px-6 py-14 sm:px-8 lg:flex-row lg:items-stretch lg:gap-14 lg:px-12 lg:py-20">
          {/* ------------------------------ LEFT ------------------------------ */}
          <div className="flex flex-1 flex-col">
            <p className="mb-5 font-mono-df text-[0.6rem] tracking-[0.32em] text-df-white/45">
              THE DEVICE
            </p>
            <h2
              id="product-heading"
              className="font-grotesque text-[2.4rem] leading-[1.04] tracking-tight text-df-white sm:text-5xl lg:text-6xl"
            >
              Detect. Predict. Intervene.
              <br />
              <span className="text-df-white/70">Before you quit.</span>
            </h2>

            <ul className="mt-8 space-y-4 lg:mt-12">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-[0.45em] h-[7px] w-[7px] shrink-0 bg-[#3DE1FF] shadow-[0_0_8px_#3DE1FF]" />
                  <span className="max-w-[34rem] text-[0.82rem] leading-relaxed text-df-white/70">
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            {/* scroll-progress line with corner brackets */}
            <div className="mt-10 lg:mt-auto lg:pt-14">
              <div className="mb-2 flex items-center justify-between font-mono-df text-[0.55rem] tracking-[0.28em] text-df-white/35">
                <span>SEC-03 · PRODUCT</span>
                <span>SCROLL</span>
              </div>
              <div className="relative h-px w-full bg-df-white/12">
                <div
                  ref={barRef}
                  className="absolute inset-y-0 left-0 w-full origin-left bg-[#3DE1FF] shadow-[0_0_10px_#3DE1FF]"
                  style={{ transform: "scaleX(0)" }}
                />
                <span className="absolute -left-px -top-[3px] h-[7px] w-[3px] border-l border-df-white/30" />
                <span className="absolute -right-px -top-[3px] h-[7px] w-[3px] border-r border-df-white/30" />
              </div>
            </div>
          </div>

          {/* ------------------------------ RIGHT (HUD) ------------------------------ */}
          <div className="relative flex-1 min-h-[44vh] lg:min-h-0">
            <Bracket className="left-0 top-0 border-l border-t" />
            <Bracket className="right-0 top-0 border-r border-t" />
            <Bracket className="left-0 bottom-0 border-l border-b" />
            <Bracket className="right-0 bottom-0 border-r border-b" />

            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

            {/* top-left: signal lock */}
            <div className="absolute left-4 top-4 flex items-center gap-2 font-mono-df text-[0.55rem] tracking-[0.22em] text-df-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3DE1FF] shadow-[0_0_8px_#3DE1FF]" />
              SIGNAL: <span className="text-[#3DE1FF]">LOCKED</span>
            </div>

            {/* top-right: state */}
            <div className="absolute right-4 top-4 text-right font-mono-df text-[0.55rem] tracking-[0.22em] text-df-white/40">
              STATE{" "}
              <span ref={stateRef} className="ml-1 font-medium text-[#3DE1FF]">
                MONITORING
              </span>
            </div>

            {/* anomaly callout, over the detection marker */}
            <div
              ref={calloutRef}
              className="pointer-events-none absolute top-[16%] -translate-x-1/2"
              style={{ left: "62%", opacity: 0 }}
            >
              <div className="border border-[#FF3B3B]/60 bg-[#FF3B3B]/10 px-2 py-1 font-mono-df text-[0.5rem] tracking-[0.2em] text-[#FF3B3B]">
                PRE-QUIT SIGNATURE
              </div>
              <span className="mx-auto block h-4 w-px bg-[#FF3B3B]/60" />
            </div>

            {/* bottom: readout row */}
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono-df text-[0.55rem] tracking-[0.14em] text-df-white/40">
              <span>
                DLPFC <span ref={dlpfcRef} className="text-[#3DE1FF]">+0.90σ</span>
              </span>
              <span className="h-3 w-px bg-df-white/12" />
              <span>
                fNIRS · OXY <span ref={oxyRef} className="text-[#3DE1FF]">63.0%</span>
              </span>
              <span className="h-3 w-px bg-df-white/12" />
              <span>
                EEG · µV <span ref={uvRef} className="text-[#3DE1FF]">16.0</span>
              </span>
              <span className="h-3 w-px bg-df-white/12" />
              <span>
                RPE <span ref={rpeRef} className="text-[#3DE1FF]">14.0</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
