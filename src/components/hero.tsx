"use client";

import { useEffect, useRef, useState } from "react";
import { Cross, GridDots } from "@/components/glyphs";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { HERO_SRC_DEFAULT, applyHeroSrc } from "@/lib/hero-src";

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
  // The hero clip already has the ASCII effect baked in, so it plays directly
  // as a full-bleed background video — no canvas / per-frame processing.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Phones swap to the 720p rendition before playback ramps up.
  useEffect(() => {
    applyHeroSrc(videoRef.current);
  }, []);

  // Track whether the hero is on screen so we can pause the video off-screen.
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

  // Play only while visible; honor prefers-reduced-motion by staying paused.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible && !isReduced) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isVisible, isReduced]);

  // The clip is authored to run at 2x. playbackRate survives loops but resets
  // on load, so set it on mount and re-assert on the events that can clear it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const setRate = () => {
      video.playbackRate = 2;
    };
    setRate();
    video.addEventListener("loadedmetadata", setRate);
    video.addEventListener("play", setRate);
    return () => {
      video.removeEventListener("loadedmetadata", setRate);
      video.removeEventListener("play", setRate);
    };
  }, []);

  return (
    <section id="home" className="relative h-[100svh] overflow-hidden">
      <video
        ref={videoRef}
        src={HERO_SRC_DEFAULT}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        /* no autoPlay attr + metadata-only preload: keeps the browser from
           eagerly pulling the 1080p file on phones before the JS rendition
           swap; the isVisible effect calls play() right after hydration */
        preload="metadata"
      />

      {/* Weighted to the bottom edge: it seats the two calls to action against
          moving footage, and carries the hero into the ink the ASCII brain
          section opens on, so the scroll handoff stops being a hard cut. Light
          at the top so the video keeps its contrast behind the wordmark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(180deg,rgba(10,12,16,0.30)_0%,rgba(10,12,16,0.06)_30%,rgba(10,12,16,0.82)_100%)]"
      />

      {/* chrome: BRINK wordmark + corner letters over the video */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between px-3 md:px-6 pt-16 md:pt-20 pb-6">
        <div className="flex items-start justify-between">
          <CornerLetter letter="B" side="left" />
          <CornerLetter letter="R" side="right" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h1 className="hero-word font-grotesque text-df-white text-center leading-[0.8] tracking-[-0.03em] whitespace-nowrap text-[clamp(54px,15.5vw,280px)] [text-shadow:0_0_40px_rgba(10,12,16,0.55)]">
            BRINK
          </h1>

          {/* Typing tagline beneath the wordmark. Loops the two phrases;
              static first phrase under prefers-reduced-motion. Rendered as a
              <p> so the wordmark above stays the section's only heading. */}
          <TypingAnimation
            as="p"
            phrases={[
              "THE OPERATING SYSTEM FOR HUMAN CAPACITY",
              "THE INTELLIGENCE LAYER FOR HUMAN PERFORMANCE",
            ]}
            typeSpeed={70}
            deleteSpeed={40}
            pauseDelay={1800}
            loop
            startOnView
            cursorStyle="block"
            cursorClassName="!bg-df-black"
            /* default-"highlighted" look: solid amber bar with ink text, like
               the site's ::selection style, growing as the phrase types */
            className="bg-df-orange px-3 py-0.5 font-mono-df text-df-black uppercase tracking-[0.14em] text-[clamp(14px,2.4vw,26px)]"
          />
        </div>

        <div className="flex items-end justify-between gap-3">
          <CornerLetter letter="K" side="left" />

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-[3px] text-df-white/60">
              <span className="h-[3px] w-[3px] bg-current" />
              <span className="h-[3px] w-[3px] bg-current opacity-60" />
              <span className="h-[3px] w-[3px] bg-current" />
            </div>
            {/* #app is the demo, which is where the loop is actually visible;
                #how-brink-works is the device teardown, so its label says that
                rather than borrowing the "closed loop" line it doesn't earn. */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <a
                href="#demo"
                className="flex min-h-[44px] items-center justify-center gap-2 bg-df-orange px-5 font-mono-df text-[11px] uppercase tracking-[0.16em] text-df-black transition-opacity hover:opacity-85"
              >
                See the closed loop
                <GridDots />
              </a>
              <a
                href="#how-brink-works"
                className="flex min-h-[44px] items-center justify-center border hairline bg-black/40 px-5 font-mono-df text-[11px] uppercase tracking-[0.16em] text-df-white backdrop-blur-sm transition-colors hover:text-df-orange"
              >
                Inside the headband
              </a>
            </div>
          </div>

          <CornerLetter letter="∙" side="right" />
        </div>
      </div>
    </section>
  );
}
