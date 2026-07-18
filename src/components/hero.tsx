"use client";

import { useEffect, useRef, useState } from "react";
import { Cross, GridDots } from "@/components/glyphs";
import { TypingAnimation } from "@/components/ui/typing-animation";

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
        src="/hero-final.mp4"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        autoPlay={!isReduced}
        preload="auto"
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

          {/* Typing tagline beneath the wordmark. Loops the three phrases;
              static first phrase under prefers-reduced-motion. */}
          <TypingAnimation
            as="h1"
            phrases={[
              "YOUR BRAIN QUITS FIRST",
              "THE SIGNAL BEFORE THE STOP",
              "FIND YOUR RESERVE",
            ]}
            typeSpeed={70}
            deleteSpeed={40}
            pauseDelay={1800}
            loop
            startOnView
            cursorStyle="block"
            className="font-mono-df text-df-white uppercase tracking-[0.14em] text-[clamp(14px,2.4vw,26px)] [text-shadow:0_0_24px_rgba(10,12,16,0.6)]"
          />
        </div>

        <div className="flex items-center justify-between">
          <CornerLetter letter="K" side="left" />

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
                href="#brain"
                className="px-3 flex items-center mono-label !text-df-white hover:!text-df-orange transition-colors"
              >
                Open
              </a>
            </div>
          </div>

          <CornerLetter letter="∙" side="right" />
        </div>
      </div>
    </section>
  );
}
