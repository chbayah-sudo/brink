"use client";

// Permanent BRINK masthead pinned across the top (chrismacari-style). The
// preloader's converged wordmark flies up and lands exactly on #masthead-brink,
// then stays here as the site's crown. Sized in vw so the preloader can measure
// it and match at any viewport. Sits above content, below the grain + preloader.
export function Masthead() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] flex justify-center px-4 pt-11 md:pt-12">
      <span
        id="masthead-brink"
        className="font-mono-df font-bold uppercase leading-[0.82] tracking-[-0.03em] text-df-orange text-[clamp(2.25rem,9vw,8rem)]"
      >
        BRINK
      </span>
    </div>
  );
}

export default Masthead;
