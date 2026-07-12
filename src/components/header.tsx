"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useMenu } from "@/components/menu-context";
import { PixelMark, Transport, VuDashes } from "@/components/glyphs";
import { HyperText } from "@/components/ui/hyper-text";

export function Header() {
  const { setOpen } = useMenu();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
            "group flex items-center gap-2 text-df-white hover:text-df-orange transition-[color,opacity] duration-300",
            scrolled ? "md:opacity-100" : "md:opacity-0 md:pointer-events-none"
          )}
        >
          <PixelMark className="text-df-white group-hover:text-df-orange transition-colors" />
          <HyperText
            as="span"
            className="font-mono text-[11px] tracking-[0.22em] hidden sm:block"
          >
            BRINK
          </HyperText>
        </a>

        {/* center transport bar */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 hidden md:flex items-stretch border hairline overflow-hidden transition-all duration-500",
            scrolled
              ? "bg-black/80 backdrop-blur-md"
              : "bg-black/30 backdrop-blur-sm"
          )}
        >
          <div className="px-3 flex items-center border-r hairline text-df-white/80">
            <Transport />
          </div>
          <div className="px-4 flex items-center border-r hairline">
            <VuDashes />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="px-4 mono-label !text-df-white hover:!text-df-orange transition-colors"
          >
            Menu
          </button>
        </div>

        {/* right: desktop status + mobile menu */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "hidden md:flex items-center gap-2 mono-label transition-opacity duration-500",
              scrolled ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="h-[6px] w-[6px] bg-df-white blink" />
            NYC / SG
          </span>
          <button
            onClick={() => setOpen(true)}
            className="md:hidden flex items-center gap-2 group"
            aria-label="Open menu"
          >
            <span className="mono-label !text-df-white group-hover:!text-df-orange transition-colors">
              Menu
            </span>
            <span className="flex flex-col gap-[3px]">
              <span className="block h-px w-4 bg-df-white group-hover:bg-df-orange transition-colors" />
              <span className="block h-px w-4 bg-df-white group-hover:bg-df-orange transition-colors" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
