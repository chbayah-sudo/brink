"use client";

import { useEffect, useRef } from "react";

/**
 * The footer's ambient dot-brain loop (H.264, ~3MB). Deliberately NOT
 * autoPlay: the attribute forces browsers to fetch the file during initial
 * page load even with preload="none". Instead an IntersectionObserver starts
 * playback (which triggers the download) once the visitor nears the footer.
 */
export function FooterBrainVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          video.play().catch(() => undefined);
        } else if (!video.paused) {
          video.pause();
        }
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src="/footer-brain.mp4"
      aria-hidden="true"
      muted
      loop
      playsInline
      preload="none"
      className="pointer-events-none h-full w-full select-none object-contain opacity-90 mix-blend-screen"
    />
  );
}
