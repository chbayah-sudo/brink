"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { featuredWriting } from "@/lib/data";
import { PixelArrow } from "@/components/glyphs";
import { AsciiImage } from "@/components/ascii-image";


export function FeaturedCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    let min = Infinity;
    children.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - el.scrollLeft);
      if (d < min) {
        min = d;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(featuredWriting.length - 1, i));
    const child = el.children[clamped] as HTMLElement;
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  return (
    <div className="mt-14 md:mt-20">
      <div
        ref={trackRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {featuredWriting.map((a, i) => (
          <a
            key={a.category + i}
            href={a.href}
            target="_blank"
            rel="noreferrer"
            className="group snap-start shrink-0 basis-full md:basis-[calc(50%-12px)]"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-[#080808] border hairline">
              {a.image && a.ascii ? (
                <>
                  <AsciiImage
                    src={a.image}
                    alt={a.title}
                    className="block h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {/* Hover reveals the original colour photo; fades back to ASCII on leave. */}
                  <img
                    src={a.image}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:opacity-100 group-hover:scale-[1.04]"
                  />
                </>
              ) : a.image ? (
                <img
                  src={a.image}
                  alt={a.title}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-75 grayscale-[0.2] transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.04]"
                />
              ) : null}
              <span className="absolute left-3 top-3 mono-label !text-df-white bg-black/60 backdrop-blur-sm border hairline px-2 py-1">
                {a.category}
              </span>
            </div>

            {a.title && (
              <div className="mt-4 flex items-start justify-between gap-4">
                <h3 className="font-grotesque uppercase leading-tight text-df-white text-lg md:text-xl group-hover:text-df-orange transition-colors">
                  {a.title}
                </h3>
                <PixelArrow className="mt-1.5 shrink-0 text-df-white group-hover:text-df-orange transition-colors" />
              </div>
            )}
            <p className={cn("font-serif-df text-df-white/75 leading-relaxed", a.title ? "mt-3" : "mt-4")}>
              {a.excerpt}
            </p>
            {a.source && (
              <p className="mt-2 font-mono-df text-[0.62rem] tracking-[0.14em] text-df-white/55">
                {a.source}
              </p>
            )}
          </a>
        ))}
      </div>

      {/* controls */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => goTo(active - 1)}
          aria-label="Previous"
          className="text-df-white/60 hover:text-df-orange transition-colors"
        >
          <PixelArrow className="h-3 w-3 rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          {featuredWriting.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-2 w-2 transition-colors",
                i === active ? "bg-df-white" : "bg-df-white/25 hover:bg-df-white/50"
              )}
            />
          ))}
        </div>
        <button
          onClick={() => goTo(active + 1)}
          aria-label="Next"
          className="text-df-white/60 hover:text-df-orange transition-colors"
        >
          <PixelArrow className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
