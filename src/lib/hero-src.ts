// Hero clip renditions. Desktop is the SSR/default; phones swap to the 720p
// rendition on mount (14MB vs 29MB — the single biggest mobile-data win).
// Hero and AsciiBrain's sampling copy MUST both use this so their frames stay
// in sync through the shred handoff.
export const HERO_SRC_DEFAULT = "/hero-1080.mp4";
const HERO_SRC_MOBILE = "/hero-720.mp4";

export function pickHeroSrc(): string {
  if (typeof window === "undefined") return HERO_SRC_DEFAULT;
  return window.matchMedia("(max-width: 767px)").matches
    ? HERO_SRC_MOBILE
    : HERO_SRC_DEFAULT;
}

/** Swap a mounted <video> to the responsive rendition (no-op on desktop). */
export function applyHeroSrc(video: HTMLVideoElement | null) {
  if (!video) return;
  const src = pickHeroSrc();
  if (!video.src.endsWith(src)) {
    video.src = src;
    video.load();
  }
}
