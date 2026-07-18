"use client";

import { useEffect, useRef } from "react";

// Cream Bayer-dithered field for the footer wordmark panel — same technique as
// the preloader loading screen, so the footer speaks the site's dithered
// language. Dark dots on cream, slow flowing fbm, quantised through bayer8.
// Only animates while the footer is on screen.
const DOT = 8;
const DOT_SIZE = 2.4;
const FIELD_SCALE = 3.4;
const FLOW = 0.45;
const THRESH = 0.6;
const CREAM = "#e8e4d8";
const INK_DOT = "rgba(20,22,28,0.8)";

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

export function FooterDither() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (time: number) => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      const t = time * 0.00005 * FLOW;
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

    if (reduce) {
      // static single frame
      requestAnimationFrame((tm) => paint(tm));
      const onResize = () => requestAnimationFrame((tm) => paint(tm));
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    let raf = 0;
    let last = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (time - last < 1000 / 30) return;
      last = time;
      paint(time);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

export default FooterDither;
