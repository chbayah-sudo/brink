"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useMenu } from "@/components/menu-context";
import { GridDots, LogoMark } from "@/components/glyphs";
import { HyperText } from "@/components/ui/hyper-text";

export function Header() {
  const { setOpen } = useMenu();
  const [scrolled, setScrolled] = useState(false);
  // True while the header floats over the paper-white app-demo section — the
  // lockup flips to ink there, since off-white on cream is unreadable.
  const [onLight, setOnLight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("app");
    if (!el) return;
    // Shrink the observation band to the top sliver of the viewport (where
    // the fixed header sits): intersecting means the light section is under it.
    const io = new IntersectionObserver(
      ([e]) => setOnLight(e.isIntersecting),
      { rootMargin: "0px 0px -94% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40 px-3 md:px-6 transition-all duration-500",
        scrolled ? "pt-3" : "pt-4 md:pt-5"
      )}
    >
      <div className="relative flex items-center justify-between">
        {/* logo */}
        <a
          href="#home"
          className={cn(
            "group flex items-center gap-2 hover:text-df-orange transition-[color,opacity] duration-300",
            onLight ? "text-[#201f1d]" : "text-df-white",
            scrolled ? "md:opacity-100" : "md:opacity-0 md:pointer-events-none"
          )}
        >
          <LogoMark className="text-current group-hover:text-df-orange transition-colors" />
          <HyperText
            as="span"
            active={scrolled}
            className="font-mono text-[15px] tracking-[0.22em] hidden sm:block"
          >
            BRINK
          </HyperText>
        </a>

        {/* center menu bar — pixel-dot mark + label, no transport chrome */}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2.5 border hairline px-5 py-2 mono-label !text-df-white hover:!text-df-orange transition-all duration-500",
            scrolled
              ? "bg-black/80 backdrop-blur-md"
              : "bg-black/30 backdrop-blur-sm"
          )}
        >
          <GridDots className="text-current" />
          Menu
        </button>

        {/* right: desktop status + mobile menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden flex items-center gap-2 group"
            aria-label="Open menu"
          >
            <span
              className={cn(
                "mono-label group-hover:!text-df-orange transition-colors",
                onLight ? "!text-[#201f1d]" : "!text-df-white"
              )}
            >
              Menu
            </span>
            <GridDots
              className={cn(
                "h-3 w-3 group-hover:text-df-orange transition-colors",
                onLight ? "text-[#201f1d]" : "text-df-white"
              )}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
