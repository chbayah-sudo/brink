"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Scroll-driven "video into gallery frame" section.
 *
 * At scroll 0 the video (public/ro.mp4) is full-screen. As you scroll through
 * the pinned section it shrinks — via a single uniform scale + translate, so
 * the video never distorts — while the room photo (public/fifi.png) fades and
 * settles in behind it. At scroll 1 the video sits exactly inside the wall
 * screen in the photo.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TUNE ME: the wall-frame rectangle, as PERCENTAGES OF THE VIEWPORT.
 *   left/top   = the frame's top-left corner (% of viewport width / height)
 *   width/height = the frame's size (% of viewport width / height)
 * The video's END position/size == this rectangle. Nudge these until the
 * video lines up with the screen on the wall in fifi.png, then reload.
 * ─────────────────────────────────────────────────────────────────────────
 */
const FRAME = {
  left: 43.2, // %
  top: 41.4, // %
  width: 12.2, // %
  height: 10.6, // %
};

// Background photo starts slightly zoomed-in and eases back to 1.
const BG_START_SCALE = 1.08;

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function GalleryFrame() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // On-screen tracking: pause the video + skip the rAF loop when off-screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Play only while visible; honor reduced motion by staying paused (static).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible && !isReduced) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isVisible, isReduced]);

  // Eased scroll progress 0..1 for the pinned section (window scroll = Lenis).
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-section.getBoundingClientRect().top, 0, total || 1);
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

  // Apply the transforms. Reduced motion pins the end state once; otherwise a
  // rAF loop maps eased scroll progress onto transform-only scale/translate.
  useEffect(() => {
    const apply = () => {
      const p = isReduced ? 1 : easeInOutCubic(pRef.current);

      // Video: rest layout == FRAME rect. At p=0 scale it up (uniformly) and
      // recenter so it covers the viewport; at p=1 it's identity (in-frame).
      const cx = FRAME.left + FRAME.width / 2;
      const cy = FRAME.top + FRAME.height / 2;
      const coverScale = Math.max(100 / FRAME.width, 100 / FRAME.height);
      const scale = coverScale + (1 - coverScale) * p;
      const tx = (50 - cx) * (1 - p);
      const ty = (50 - cy) * (1 - p);
      if (videoWrapRef.current) {
        videoWrapRef.current.style.transform = `translate(${tx}vw, ${ty}vh) scale(${scale})`;
      }

      // Background: fade in over the first half, ease from slightly-zoomed to 1.
      if (bgRef.current) {
        const bgScale = BG_START_SCALE + (1 - BG_START_SCALE) * p;
        bgRef.current.style.transform = `scale(${bgScale})`;
        bgRef.current.style.opacity = String(isReduced ? 1 : smoothstep(0, 0.5, pRef.current));
      }
    };

    if (isReduced) {
      apply();
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = window.requestAnimationFrame(loop);
      if (!isVisible) return;
      apply();
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [isVisible, isReduced]);

  return (
    <section ref={sectionRef} id="gallery-frame" className="relative h-[250vh] bg-df-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* room photo — hidden + slightly zoomed at 0, resolves in by mid-scroll */}
        <div
          ref={bgRef}
          className="absolute inset-0 will-change-transform"
          style={{ opacity: 0, transform: `scale(${BG_START_SCALE})`, transformOrigin: "center center" }}
        >
          <Image src="/fifi.png" alt="" fill sizes="100vw" className="object-cover" unoptimized />
        </div>

        {/* foreground video — rest layout is the FRAME rect; transform scales it
            up to full-screen at scroll 0 and back into the frame at scroll 1 */}
        <div
          ref={videoWrapRef}
          className="absolute overflow-hidden will-change-transform"
          style={{
            left: `${FRAME.left}%`,
            top: `${FRAME.top}%`,
            width: `${FRAME.width}%`,
            height: `${FRAME.height}%`,
            transformOrigin: "center center",
          }}
        >
          <video
            ref={videoRef}
            src="/ro.mp4"
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay={!isReduced}
            preload="auto"
          />
        </div>
      </div>
    </section>
  );
}
