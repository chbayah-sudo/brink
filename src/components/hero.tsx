"use client";

import { useEffect, useRef, useState } from "react";
import { Cross, GridDots } from "@/components/glyphs";

// --- ASCII brain tuning (unchanged look) -----------------------------------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
const THRESHOLD = 0.2;
const SCATTER = 0.4;

// --- Zoom-out / strip motion tuning ----------------------------------------
// Vertical strips the shrinking image shreds into. Lower this first if heavy.
const STRIP_COUNT = 60;
// Final centered-rectangle size (fraction of the viewport) the video zooms to.
const MIN_SCALE = 0.44;
// Grade buffer width cap (px). Lower this if heavy.
const GRADE_W = 640;

const CREAM: [number, number, number] = [232, 228, 216]; // #e8e4d8
const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// Deterministic per-index pseudo-random, stable across frames.
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function getAsciiChar(t: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(Math.pow(t, 0.8) * (ASCII_RAMP.length - 1)))
  );
  return ASCII_RAMP[index];
}

// Fit a source video into a destination rect as object-cover, returning the
// source sub-rectangle to sample.
function coverRect(vw: number, vh: number, dw: number, dh: number) {
  const arD = dw / dh;
  const arV = vw / vh;
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  if (arV > arD) {
    sw = vh * arD;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / arD;
    sy = (vh - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

function CornerLetter({
  letter,
  side,
}: {
  letter: string;
  side: "left" | "right";
}) {
  const mark = <Cross className="text-df-white/35 h-3 w-3" />;
  return (
    <div className="flex items-center gap-3 md:gap-4">
      {side === "left" && (
        <>
          <span className="font-serif-df text-2xl md:text-4xl leading-none text-df-white">
            {letter}
          </span>
          {mark}
        </>
      )}
      {side === "right" && (
        <>
          {mark}
          <span className="font-serif-df text-2xl md:text-4xl leading-none text-df-white">
            {letter}
          </span>
        </>
      )}
    </div>
  );
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireRef = useRef<HTMLVideoElement | null>(null); // /brain2.mp4 (firelight)
  const brainRef = useRef<HTMLVideoElement | null>(null); // /brain-hero.mp4
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  // Eased Lenis scroll progress 0..1 for this section, read in the loop.
  const pRef = useRef(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isReduced, setIsReduced] = useState(false);

  // Offscreen buffers (created once, resized on demand).
  const gradeRef = useRef<HTMLCanvasElement | null>(null);
  const caRef = useRef<HTMLCanvasElement | null>(null);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const stripLumRef = useRef<HTMLCanvasElement | null>(null);
  const brainBufRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = document.getElementById("home");
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Pause both videos while the hero is off-screen (perf).
  useEffect(() => {
    const fire = fireRef.current;
    const brain = brainRef.current;
    if (!fire || !brain) return;
    if (isVisible) {
      fire.play().catch(() => undefined);
      brain.play().catch(() => undefined);
    } else {
      fire.pause();
      brain.pause();
    }
  }, [isVisible]);

  // Scroll progress for the pinned section: 0 at top, 1 once fully scrolled.
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("home");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total || 1);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const fire = fireRef.current;
    const brain = brainRef.current;
    if (!canvas || !fire || !brain) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grade = (gradeRef.current ??= document.createElement("canvas"));
    const gctx = grade.getContext("2d")!;
    const ca = (caRef.current ??= document.createElement("canvas"));
    const cactx = ca.getContext("2d")!;
    const bloom = (bloomRef.current ??= document.createElement("canvas"));
    const bctx = bloom.getContext("2d")!;
    const slum = (stripLumRef.current ??= document.createElement("canvas"));
    const sctx = slum.getContext("2d", { willReadFrequently: true })!;
    const bbuf = (brainBufRef.current ??= document.createElement("canvas"));
    const bbctx = bbuf.getContext("2d", { willReadFrequently: true })!;

    const render = () => {
      frameRef.current = window.requestAnimationFrame(render);
      if (!isVisible) return;

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (!cssW || !cssH) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const p = pRef.current;

      // Fade the wordmark + chrome out as the cinematic motion takes over.
      if (chromeRef.current) {
        const o = 1 - smoothstep(0.04, 0.32, p);
        chromeRef.current.style.opacity = String(o);
        chromeRef.current.style.pointerEvents = o < 0.05 ? "none" : "";
      }

      // --- eased mappings (one continuous motion) ---
      const brainIn = smoothstep(isReduced ? 0.15 : 0.58, 1.0, p);
      let scale: number;
      let edgeShred: number;
      let centerFade: number;
      let darken: number;
      if (isReduced) {
        // Crossfade fallback: no zoom/strips, just graded video -> brain.
        scale = 1;
        edgeShred = 0;
        centerFade = brainIn;
        darken = brainIn;
      } else {
        scale = mix(1, MIN_SCALE, easeInOutCubic(smoothstep(0, 0.85, p)));
        edgeShred = easeInOutCubic(smoothstep(0, 0.8, p));
        centerFade = smoothstep(0.7, 0.93, p);
        darken = smoothstep(0.5, 0.82, p);
      }

      // --- background: cream paper -> ink as the brain resolves ---
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgb(${Math.round(mix(CREAM[0], INK[0], darken))},${Math.round(
        mix(CREAM[1], INK[1], darken)
      )},${Math.round(mix(CREAM[2], INK[2], darken))})`;
      ctx.fillRect(0, 0, cssW, cssH);

      const fireReady = fire.readyState >= 2 && fire.videoWidth > 0;

      if (fireReady && centerFade < 0.999) {
        // ---------------- Vintage film grade (on a small buffer) ----------
        const GW = Math.min(GRADE_W, Math.round(cssW * 0.5)) || 1;
        const GH = Math.max(1, Math.round((GW * cssH) / cssW));
        if (grade.width !== GW || grade.height !== GH) {
          grade.width = GW;
          grade.height = GH;
          ca.width = GW;
          ca.height = GH;
        }
        const { sx, sy, sw, sh } = coverRect(fire.videoWidth, fire.videoHeight, GW, GH);

        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.globalAlpha = 1;
        gctx.globalCompositeOperation = "source-over";
        // Desaturated, warm, gently aged base.
        gctx.filter = "saturate(0.72) contrast(1.04) brightness(1.05) sepia(0.14)";
        gctx.drawImage(fire, sx, sy, sw, sh, 0, 0, GW, GH);
        gctx.filter = "none";
        // Lift blacks with a faint cool cast (cool shadows).
        gctx.globalCompositeOperation = "lighten";
        gctx.fillStyle = "rgba(16,20,30,1)";
        gctx.fillRect(0, 0, GW, GH);
        // Warm amber into the highlights/mids.
        gctx.globalCompositeOperation = "soft-light";
        gctx.fillStyle = "rgba(255,168,86,0.34)";
        gctx.fillRect(0, 0, GW, GH);

        // Very slight chromatic aberration: shift red +, blue - at the edges.
        const caDx = 1.2;
        cactx.setTransform(1, 0, 0, 1, 0, 0);
        cactx.globalAlpha = 1;
        cactx.globalCompositeOperation = "source-over";
        cactx.clearRect(0, 0, GW, GH);
        cactx.drawImage(grade, 0, 0);
        cactx.globalCompositeOperation = "multiply";
        cactx.fillStyle = "#ff0000";
        cactx.fillRect(0, 0, GW, GH);
        gctx.globalCompositeOperation = "screen";
        gctx.globalAlpha = 0.3;
        gctx.drawImage(ca, caDx, 0);
        cactx.globalCompositeOperation = "source-over";
        cactx.clearRect(0, 0, GW, GH);
        cactx.drawImage(grade, 0, 0);
        cactx.globalCompositeOperation = "multiply";
        cactx.fillStyle = "#0000ff";
        cactx.fillRect(0, 0, GW, GH);
        gctx.drawImage(ca, -caDx, 0);
        gctx.globalAlpha = 1;
        gctx.globalCompositeOperation = "source-over";

        // ---------------- Halation / bloom (isolate highlights, blur) -----
        const BW = Math.max(1, Math.round(GW * 0.5));
        const BH = Math.max(1, Math.round(GH * 0.5));
        if (bloom.width !== BW || bloom.height !== BH) {
          bloom.width = BW;
          bloom.height = BH;
        }
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.globalAlpha = 1;
        bctx.globalCompositeOperation = "source-over";
        bctx.filter = "brightness(1.5) contrast(2.6) saturate(1.15)";
        bctx.clearRect(0, 0, BW, BH);
        bctx.drawImage(grade, 0, 0, BW, BH);
        bctx.filter = "none";

        const rectW = cssW * scale;
        const rectH = cssH * scale;
        const rectX = (cssW - rectW) / 2;
        const rectY = (cssH - rectH) / 2;

        if (isReduced) {
          // Reduced motion: no zoom/strips. Draw the graded frame full-bleed
          // once and let it crossfade out (centerFade) into the brain.
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = clamp(1 - centerFade, 0, 1);
          ctx.drawImage(grade, 0, 0, cssW, cssH);
          ctx.globalAlpha = 1;
        } else {
          // ---------------- Strips: shrinking rectangle, shredding edges --
          const N = STRIP_COUNT;
          const stripW = rectW / N;

          // Per-strip luminance from a tiny NxK downsample of the grade.
          if (slum.width !== N || slum.height !== 12) {
            slum.width = N;
            slum.height = 12;
          }
          sctx.setTransform(1, 0, 0, 1, 0, 0);
          sctx.globalCompositeOperation = "source-over";
          sctx.drawImage(grade, 0, 0, N, 12);
          const sd = sctx.getImageData(0, 0, N, 12).data;

          ctx.globalCompositeOperation = "source-over";
          for (let i = 0; i < N; i += 1) {
            // average luminance of this strip
            let lum = 0;
            for (let k = 0; k < 12; k += 1) {
              const idx = (k * N + i) * 4;
              lum += (0.2126 * sd[idx] + 0.7152 * sd[idx + 1] + 0.0722 * sd[idx + 2]) / 255;
            }
            lum /= 12;

            const edgeness = Math.abs((i + 0.5) / N - 0.5) * 2; // 0 center .. 1 edge
            const dir = (i + 0.5) / N - 0.5 >= 0 ? 1 : -1;
            // displaced by brightness + scroll, edges much more than center
            const mag =
              edgeShred * Math.pow(edgeness, 1.4) * (0.35 + 0.65 * lum) * cssW * 0.55;
            const jitter =
              (hash(i, 7.3) - 0.5) * edgeShred * cssH * 0.18 * (0.3 + 0.7 * lum);
            const dstX = rectX + i * stripW + dir * mag;
            const dstY = rectY + jitter;
            const alpha = clamp((1 - centerFade) * (1 - edgeness * edgeShred * 0.85), 0, 1);
            if (alpha <= 0.01) continue;

            const gsx = (i / N) * GW;
            const gsw = GW / N;
            ctx.globalAlpha = alpha;
            // +1px dest width so adjacent strips overlap (no seams at rest)
            ctx.drawImage(grade, gsx, 0, gsw, GH, dstX, dstY, stripW + 1, rectH);
          }
          ctx.globalAlpha = 1;
        }

        // Soft firelight glow over the coherent core.
        const glow = (1 - centerFade) * (0.35 + 0.45 * (1 - edgeShred));
        if (glow > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.filter = "blur(16px)";
          ctx.globalAlpha = clamp(glow, 0, 1);
          ctx.drawImage(bloom, rectX, rectY, rectW, rectH);
          ctx.restore();
          ctx.filter = "none";
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }
      }

      // --- soft vignette to focus the center (fades as brain resolves) ---
      const vgA = 0.42 * (1 - brainIn);
      if (vgA > 0.01) {
        const vg = ctx.createRadialGradient(
          cssW / 2,
          cssH / 2,
          Math.min(cssW, cssH) * 0.2,
          cssW / 2,
          cssH / 2,
          Math.max(cssW, cssH) * 0.72
        );
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, `rgba(0,0,0,${vgA})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, cssW, cssH);
      }

      // ---------------- ASCII brain (final resting state) ----------------
      const brainReady = brain.readyState >= 2 && brain.videoWidth > 0;
      if (brainIn > 0.001 && brainReady) {
        const cols = Math.floor(cssW / CELL_PX);
        const rows = Math.floor(cssH / CELL_PX);
        const BBW = cols * 2;
        const BBH = rows * 2;
        if (bbuf.width !== BBW || bbuf.height !== BBH) {
          bbuf.width = BBW;
          bbuf.height = BBH;
        }
        const { sx, sy, sw, sh } = coverRect(brain.videoWidth, brain.videoHeight, BBW, BBH);
        bbctx.setTransform(1, 0, 0, 1, 0, 0);
        bbctx.imageSmoothingEnabled = true;
        bbctx.clearRect(0, 0, BBW, BBH);
        bbctx.drawImage(brain, sx, sy, sw, sh, 0, 0, BBW, BBH);
        const bd = bbctx.getImageData(0, 0, BBW, BBH).data;

        const cellW = cssW / cols;
        const cellH = cssH / rows;
        const fontSize = Math.max(7, cellH * 1.05);
        ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.globalCompositeOperation = "source-over";

        const assembly = isReduced ? 1 : easeInOutCubic(brainIn);
        const scatterPx = SCATTER * Math.min(cssW, cssH) * (1 - assembly);

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            // brightest of the cell's 2x2 block so thin filaments survive
            let lum = 0;
            for (let dyy = 0; dyy < 2; dyy += 1) {
              for (let dxx = 0; dxx < 2; dxx += 1) {
                const bx = Math.min(BBW - 1, col * 2 + dxx);
                const by = Math.min(BBH - 1, row * 2 + dyy);
                const i = (by * BBW + bx) * 4;
                const l =
                  (0.2126 * bd[i] + 0.7152 * bd[i + 1] + 0.0722 * bd[i + 2]) / 255;
                if (l > lum) lum = l;
              }
            }
            const adjusted = Math.min(1, Math.max(0, (lum - 0.5) * CONTRAST + 0.5) * BRIGHTNESS);
            if (adjusted <= THRESHOLD) continue;
            const t = (adjusted - THRESHOLD) / (1 - THRESHOLD);

            const h1 = hash(col, row);
            const h2 = hash(col + 41.7, row + 17.3);
            const angle = h1 * Math.PI * 2;
            const dist = (0.35 + 0.65 * h2) * scatterPx;
            const cx = (col + 0.5) * cellW;
            const cy = (row + 0.5) * cellH;
            const drawX = cx + Math.cos(angle) * dist;
            const drawY = cy + Math.sin(angle) * dist;

            const reveal = Math.min(1, Math.max(0, (assembly - h2 * 0.55) / 0.45));
            if (reveal <= 0) continue;

            const color =
              adjusted > 0.6 ? "#e8e4d8" : adjusted > 0.38 ? "#a8a5a0" : "#7c7a76";
            ctx.fillStyle = color;
            ctx.globalAlpha = (0.4 + t * 0.6) * reveal * brainIn;
            ctx.fillText(getAsciiChar(t), drawX, drawY);
          }
        }
        ctx.globalAlpha = 1;
      }
    };

    frameRef.current = window.requestAnimationFrame(render);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isVisible, isReduced]);

  return (
    <section
      id="home"
      // Pinned scroll range in both modes; reduced motion just crossfades
      // (no zoom/strip motion) instead of the full continuous zoom-out.
      className="relative h-[230vh]"
    >
      {/* pinned viewport: the whole motion plays here while you scroll through */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <video
          ref={fireRef}
          src="/brain2.mp4"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
        <video
          ref={brainRef}
          src="/brain-hero.mp4"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* chrome: fades out as the cinematic motion takes over */}
        <div
          ref={chromeRef}
          className="absolute inset-0 z-10 flex flex-col justify-between px-3 md:px-6 pt-16 md:pt-20 pb-6"
        >
          <div className="flex items-start justify-between">
            <CornerLetter letter="D" side="left" />
            <CornerLetter letter="F" side="right" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <h1 className="hero-word font-grotesque text-df-white text-center leading-[0.8] tracking-[-0.03em] whitespace-nowrap text-[clamp(54px,15.5vw,280px)] [text-shadow:0_0_40px_rgba(10,12,16,0.55)]">
              BRINK
            </h1>
          </div>

          <div className="flex items-center justify-between">
            <CornerLetter letter="L" side="left" />

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-[3px] text-df-white/60">
                <span className="h-[3px] w-[3px] bg-current" />
                <span className="h-[3px] w-[3px] bg-current opacity-60" />
                <span className="h-[3px] w-[3px] bg-current" />
              </div>
              <div className="flex items-stretch border hairline bg-black/40 backdrop-blur-sm">
                <span className="px-3 flex items-center mono-label border-r hairline">
                  GUI
                </span>
                <span className="px-4 flex items-center border-r hairline text-df-white/70">
                  <GridDots />
                </span>
                <a
                  href="#about"
                  className="px-3 flex items-center mono-label !text-df-white hover:!text-df-orange transition-colors"
                >
                  Open
                </a>
              </div>
            </div>

            <CornerLetter letter="Y" side="right" />
          </div>
        </div>
      </div>
    </section>
  );
}
