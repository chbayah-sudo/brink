"use client";

import { useEffect, useRef } from "react";

// ===========================================================================
// Bayer-dithered flow-field background (Codrops "Bayer Dithering" technique,
// ported to a 2D canvas so it matches the site's ASCII engine and stays cheap).
// A slow fbm current is quantised through a recursive Bayer-8 ordered-dither
// matrix into a handful of dark slate tones, with a faint orange light that
// trails the cursor and a vignette that keeps the centre readable.
// ---------------------------------------------------------------------------
// Tuning knobs:
const PIXEL = 4; // dither pixel size in CSS px (bigger = chunkier / cheaper)
const FPS = 30; // render cap (a background never needs 60)
const LEVELS = 6; // quantisation tones (incl. ink)
const FIELD_SCALE = 2.8; // fbm zoom (smaller = bigger, slower clouds)
const FLOW = 0.62; // how fast the current drifts
const DITHER_STRENGTH = 0.62; // how much the Bayer matrix perturbs the field
const MOUSE_RADIUS = 0.32; // cursor light falloff (fraction of viewport)
const MOUSE_LIFT = 0.8; // how much the cursor brightens the field
const VIGNETTE = 1.25; // edge darkening strength

// Dark slate ramp (ink -> cool light). Brighter top end so the current reads.
const TONES: [number, number, number][] = [
  [10, 12, 16], // #0a0c10 ink
  [17, 22, 31],
  [28, 36, 51],
  [42, 54, 76],
  [60, 76, 104],
  [82, 102, 136],
];
const ORANGE: [number, number, number] = [255, 91, 58];

function frac(x: number) {
  return x - Math.floor(x);
}
// Recursive Bayer matrix (from the article), returns [0,1).
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

// Cheap integer hash value-noise (no Math.sin — this runs per pixel).
function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (Math.imul(h ^ (h >>> 13), 1274126177)) | 0;
  return ((h & 0x7fffffff) / 0x7fffffff);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
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
function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function DitherBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Smoothed cursor light (normalised 0..1), starts off-centre-top.
    const mouse = { x: 0.5, y: 0.32, tx: 0.5, ty: 0.32 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = 0;
    let img: ImageData | null = null;
    let buf: Uint32Array | null = null;
    // Per-pixel constants, precomputed at resize so the hot loop doesn't
    // re-derive them 60x/sec: Bayer dither offset and vignette factor depend
    // only on the pixel coordinate.
    let ditherLUT: Float32Array | null = null;
    let vigLUT: Float32Array | null = null;
    let gw = 0;
    let gh = 0;
    let aspect = 1;

    const ensureSize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const nw = Math.max(1, Math.ceil(cw / PIXEL));
      const nh = Math.max(1, Math.ceil(ch / PIXEL));
      if (nw !== gw || nh !== gh) {
        gw = nw;
        gh = nh;
        aspect = gw / gh;
        canvas.width = gw;
        canvas.height = gh;
        img = ctx.createImageData(gw, gh);
        buf = new Uint32Array(img.data.buffer);
        ditherLUT = new Float32Array(gw * gh);
        vigLUT = new Float32Array(gw * gh);
        for (let gy = 0; gy < gh; gy += 1) {
          const vy = gy / gh - 0.5;
          for (let gx = 0; gx < gw; gx += 1) {
            const vx = gx / gw - 0.5;
            const i = gy * gw + gx;
            ditherLUT[i] = (bayer8(gx, gy) - 0.5) * DITHER_STRENGTH;
            vigLUT[i] = 1 - Math.min(1, (vx * vx + vy * vy) * VIGNETTE);
          }
        }
      }
    };

    const draw = (time: number) => {
      if (!img || !buf || !ditherLUT || !vigLUT) return;
      const t = time * 0.00006 * FLOW;
      // ease the cursor light toward its target
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      const mx = mouse.x;
      const my = mouse.y;

      for (let gy = 0; gy < gh; gy += 1) {
        const ny = gy / gh;
        for (let gx = 0; gx < gw; gx += 1) {
          const nx = gx / gw;

          // domain-warped flow current
          const wx = vnoise(nx * 2 + t, ny * 2) * 0.5;
          let val = fbm(
            (nx + wx) * FIELD_SCALE + t,
            ny * FIELD_SCALE - t * 0.7
          );

          // cursor light (aspect-corrected radial falloff)
          const dx = (nx - mx) * aspect;
          const dy = ny - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mLight = Math.max(0, 1 - dist / MOUSE_RADIUS);
          val += mLight * mLight * MOUSE_LIFT;

          const i = gy * gw + gx;
          // vignette + bias toward dark so most of the field is ink
          val = (val * (0.55 + 0.45 * vigLUT[i])) * 1.3 - 0.22;

          // ordered dither + quantise (offset precomputed per pixel)
          let level = Math.round(clamp01(val + ditherLUT[i]) * (LEVELS - 1));
          if (level < 0) level = 0;
          else if (level > LEVELS - 1) level = LEVELS - 1;

          let r = TONES[level][0];
          let g = TONES[level][1];
          let b = TONES[level][2];

          // warm the lit tones near the cursor
          if (mLight > 0.02 && level > 0) {
            const warm = mLight * mLight * (level / (LEVELS - 1)) * 0.6;
            r += (ORANGE[0] - r) * warm;
            g += (ORANGE[1] - g) * warm;
            b += (ORANGE[2] - b) * warm;
          }

          buf[gy * gw + gx] =
            (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = (time: number) => {
      raf = window.requestAnimationFrame(loop);
      if (document.hidden) return;
      if (time - last < 1000 / FPS) return;
      last = time;
      ensureSize();
      draw(time);
    };

    ensureSize();
    if (reduce) {
      // one static frame, no animation
      draw(0);
    } else {
      raf = window.requestAnimationFrame(loop);
    }

    const onResize = () => ensureSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0, imageRendering: "pixelated" }}
    />
  );
}

export default DitherBackground;
