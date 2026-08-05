"use client";

import { useEffect, useRef, useState } from "react";
import { Cross, GridDots } from "@/components/glyphs";
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

      {/* Legibility scrim. The headline and subhead sit on moving ASCII
          footage, which has no stable luminance — without a seat, 15px copy
          disappears whenever a bright frame passes. Same device the brain and
          explorer sections already use; it does not crop or letterbox. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(180deg,rgba(10,12,16,0.55)_0%,rgba(10,12,16,0.10)_34%,rgba(10,12,16,0.86)_100%)]"
      />

      {/* chrome: BRINK wordmark + corner letters over the video */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between px-3 md:px-6 pt-16 md:pt-20 pb-6">
        <div className="flex items-start justify-between">
          <CornerLetter letter="B" side="left" />
          <CornerLetter letter="R" side="right" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-5 text-center">
          {/* Must stay static: this and the two blocks below are the whole
              proposition, and they have to be readable on the first frame
              rather than after an animation settles. */}
          <p className="max-w-full text-balance bg-df-orange px-3 py-0.5 font-mono-df uppercase tracking-[0.14em] text-df-black text-[clamp(10px,1.7vw,18px)]">
            Brink · The operating system for human capacity
          </p>

          {/* Logotype, not a heading: the header nav link already announces the
              company. Demoting it leaves exactly one h1, holding the claim. */}
          <div
            aria-hidden="true"
            className="hero-word font-grotesque text-df-white leading-[0.8] tracking-[-0.03em] whitespace-nowrap text-[clamp(54px,15.5vw,280px)] [text-shadow:0_0_40px_rgba(10,12,16,0.55)]"
          >
            BRINK
          </div>

          {/* w-full on both: with align-items:center these are shrink-to-fit,
              so a bare max-w in ch units resolves wider than a phone viewport
              (56ch of mono ≈ 437px) and widens the whole column off-screen. */}
          <h1 className="w-full max-w-[22ch] text-balance font-serif-df text-df-white text-[clamp(21px,3.1vw,42px)] leading-[1.14]">
            Know when your capacity is about to drop. Act before it does.
          </h1>

          <p className="w-full max-w-[56ch] font-mono-df text-df-white/75 text-[13px] md:text-[15px] leading-[1.55]">
            Brink reads neural, physiological, movement and contextual signals
            to learn your baseline, forecast decline before it shows, and
            intervene in real time. The first interface is a neuroperformance
            headband.
          </p>
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
                href="#app"
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
