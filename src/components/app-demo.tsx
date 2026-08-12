"use client";

import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/glyphs";
import { Reveal } from "@/components/reveal";
import { FooterDither } from "@/components/footer-dither";

/**
 * THE COMPANION APP: live dashboard demo embedded on the landing page.
 *
 * A deliberate "lights on" moment: the site's only paper-white section,
 * placed right after the headband explode. The real prototype runs inside an
 * iframe from public/demo/index.html, which scripts/build-demo.mjs generates
 * from the standalone dashboard export. Re-export the dashboard and re-run
 * that script to change what shows here.
 *
 * How it's embedded:
 *   - lazy: the iframe src is only set when the section is ~1 viewport away,
 *     so the demo's React/fonts cost nothing until a visitor approaches;
 *   - scroll-safe: pointer-events stay off until the visitor explicitly
 *     clicks EXPLORE, so wheeling past the section never gets trapped;
 *   - responsive: the app is designed at 1440px, so narrower viewports show a
 *     proportionally scaled live miniature; small screens get the full-page
 *     demo via the open link instead of inline interaction.
 */

/**
 * The dev server and every static host disagree about this path, so it has to
 * be resolved per environment. Both were checked against the real thing:
 *
 *   next dev   serves public/ by exact filename. /demo/index.html is 200 and
 *              /demo/ is 404 — there is no directory-index resolution.
 *   Vercel     routes the static export's HTML by directory and refuses the
 *              literal filename. /demo/ is 200 and /demo/index.html falls
 *              through to Next's 404 page. This is true of every .html in the
 *              export, not just index (/404.html 404s too), so renaming the
 *              file doesn't avoid it.
 *
 * Hardcoding the dev form is what shipped the demo broken: it kept working on
 * localhost the whole time it was 404ing on neurabrink.bio.
 */
const DEMO_URL =
  process.env.NODE_ENV === "production" ? "/demo/" : "/demo/index.html";
/** The gate's call to action, centred over the scaled app until it goes live.
 *  Sized to survive on top of a busy dashboard rather than to match the frame
 *  chrome, which is deliberately quiet. */
const GATE_BUTTON =
  "border-2 border-[#b3250f] bg-[#f3f2f2] px-9 py-4 font-mono-df text-sm uppercase tracking-[0.22em] text-[#b3250f] shadow-[0_4px_28px_rgba(32,31,29,0.28)] transition-colors hover:bg-[#b3250f] hover:text-[#f3f2f2]";

const DESIGN_W = 1440;
const DESIGN_H = 900;
// below this scale, inline interaction is too fiddly, so send to the full page
const MIN_INTERACTIVE_SCALE = 0.62;

/** The walkthrough's handle, published by the demo document (scripts/demo-tour.js). */
type TourWindow = Window & { __brinkTour?: { start: () => void } };

export function AppDemo() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [near, setNear] = useState(false);
  const [scale, setScale] = useState(1);
  const [active, setActive] = useState(false);

  // Explore starts the guided walkthrough inside the iframe. Same-origin, so
  // this reaches the demo's own window directly. The iframe may still be
  // booting its runtime when the click lands, hence the short retry.
  const explore = () => {
    setActive(true);
    let tries = 0;
    const attempt = () => {
      const w = frameRef.current?.contentWindow as TourWindow | null;
      if (w?.__brinkTour) {
        w.__brinkTour.start();
        return;
      }
      if (tries++ < 40) window.setTimeout(attempt, 100);
    };
    attempt();
  };

  // Lazy-load the iframe when the section approaches.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scale the fixed-width app to whatever width the stage actually has.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / DESIGN_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const interactive = scale >= MIN_INTERACTIVE_SCALE;

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative overflow-hidden bg-[#e8e4d8] py-20 text-[#201f1d] md:py-28"
    >
      {/* same Bayer-dithered cream field as the preloader / footer wordmark
          panel, the site's established "lights on" language */}
      <FooterDither />
      <div className="relative z-[1] mx-auto max-w-[1336px] px-4 md:px-8">
        <Reveal>
          {/* the dither field flows under this whole block, so anything small
              sits on a cream plate to stay legible, the same rule-straddling
              device SectionHeader uses against the dark sections */}
          <p className="inline-block bg-[#e8e4d8] pr-3 font-mono-df text-[0.6rem] tracking-[0.32em] text-[#201f1d]/60">
            THE COMPANION APP
          </p>
          <h2 className="mt-4 font-serif-df text-3xl leading-[1.08] md:text-5xl">
            The app that comes with it.
          </h2>
          {/* one line wherever it fits: the max-width that used to sit here
              broke it across two lines on every desktop width */}
          {/* 500 is the heaviest mono weight loaded in layout.tsx; anything
              above it gets synthesised and smears at this size */}
          <p className="mt-5 bg-[#e8e4d8] font-mono-df text-[0.95rem] font-medium leading-[1.6] text-[#201f1d]/80">
            It shows your state now, what Brink expects next, and what it does about it.
          </p>
          <div className="relative mt-9 flex">
            <div className="absolute inset-x-0 top-1/2 -translate-y-px border-t border-[#201f1d]/20" />
            <span className="relative bg-[#e8e4d8] pr-4 font-mono-df text-[0.6rem] tracking-[0.2em] text-[#201f1d]/55">
              SIX SECTIONS · FIVE SCENARIOS · GUIDED WALKTHROUGH
            </span>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-8">
          {/* instrument frame */}
          <div className="border-2 border-[#201f1d]">
            {/* frame chrome */}
            <div className="flex items-center justify-between gap-4 border-b-2 border-[#201f1d] bg-[#eae9e9] px-4 py-2.5">
              <span className="flex items-center gap-2.5 font-mono-df text-[0.62rem] tracking-[0.22em]">
                <LogoMark className="h-4 w-4 text-[#201f1d]" />
                BRINK · HUMAN CAPACITY OS
              </span>
              {/* Not hidden on phones: that is the width where the demo is a
                  scaled miniature and least legible, so it is exactly where the
                  "this is simulated" label has to survive. */}
              <span className="font-mono-df text-[0.6rem] tracking-[0.18em] text-[#201f1d]/50">
                ILLUSTRATIVE DATA
              </span>
              <span className="flex items-center gap-5">
                {/* Explore is the tour's entry point, but it unmounts with the
                    interaction gate once the demo is live — so the restart the
                    spec asks for needs its own control from then on. */}
                {active && (
                  <button
                    type="button"
                    onClick={explore}
                    className="font-mono-df text-[0.62rem] tracking-[0.18em] text-[#201f1d]/55 transition-colors hover:text-[#b3250f]"
                  >
                    REPLAY WALKTHROUGH
                  </button>
                )}
                <a
                  href={DEMO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono-df text-[0.62rem] tracking-[0.18em] text-[#b3250f] transition-opacity hover:opacity-70"
                >
                  OPEN FULL ↗
                </a>
              </span>
            </div>

            {/* scaled live app */}
            <div ref={stageRef} className="relative overflow-hidden bg-[#f3f2f2]">
              <div style={{ height: DESIGN_H * scale }}>
                {near && (
                  <iframe
                    ref={frameRef}
                    src={DEMO_URL}
                    title="Brink companion app demo"
                    className="border-0"
                    style={{
                      width: DESIGN_W,
                      height: DESIGN_H,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                      pointerEvents: active ? "auto" : "none",
                    }}
                  />
                )}
              </div>

              {/* click-to-interact gate: keeps page scroll from being trapped */}
              {!active && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#201f1d]/[0.07]">
                  {interactive ? (
                    <button onClick={explore} className={GATE_BUTTON}>
                      [ Explore the demo ]
                    </button>
                  ) : (
                    <a
                      href={DEMO_URL}
                      target="_blank"
                      rel="noreferrer"
                      className={GATE_BUTTON}
                    >
                      [ Open the demo ]
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
