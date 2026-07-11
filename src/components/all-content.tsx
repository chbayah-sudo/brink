"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { allContent } from "@/lib/data";
import { GridDots } from "@/components/glyphs";

const filters = [
  "All",
  "Comment-Letter",
  "Legal",
  "Opinion",
  "Recruiting",
  "Research",
] as const;

const STEP = 6;

export function AllContent() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [count, setCount] = useState(STEP);

  const filtered = useMemo(() => {
    if (active === "All") return allContent;
    return allContent.filter((a) => a.category === active);
  }, [active]);

  const visible = filtered.slice(0, count);
  const hasMore = count < filtered.length;

  return (
    <div className="mt-12 md:mt-16">
      {/* filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => {
              setActive(f);
              setCount(STEP);
            }}
            className={cn(
              "mono-label px-3 py-2 border transition-colors",
              active === f
                ? "bg-df-white !text-black border-df-white"
                : "hairline !text-df-gray hover:!text-df-orange"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* rows */}
      <div className="border-t hairline">
        {visible.map((a) => (
          <a
            key={a.title}
            href={a.href}
            target={a.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="group grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_120px_16px] gap-x-4 md:gap-x-8 gap-y-1 items-start py-5 border-b hairline transition-colors hover:bg-white/[0.02]"
          >
            <h3 className="font-grotesque uppercase leading-snug text-df-white text-sm md:text-[15px] group-hover:text-df-orange transition-colors">
              {a.title}
            </h3>
            <p className="hidden md:block font-serif-df text-df-gray text-[15px] leading-relaxed">
              {a.excerpt}
            </p>
            <span className="mono-label md:text-left self-start">
              {a.category}
            </span>
            <GridDots className="hidden md:block mt-1 text-df-white/70 group-hover:text-df-orange transition-colors" />
          </a>
        ))}
      </div>

      {/* load more */}
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setCount((c) => c + STEP)}
            className="group flex items-center gap-3 mono-label !text-df-white hover:!text-df-orange transition-colors"
          >
            Load More
            <GridDots className="group-hover:text-df-orange" />
          </button>
        </div>
      )}
    </div>
  );
}
