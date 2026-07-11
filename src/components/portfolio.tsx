"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";
import { PixelArrow } from "@/components/glyphs";
import {
  portfolio,
  spotlight,
  type Category,
  type PortfolioCompany,
} from "@/lib/data";

const filters: ("All" | Category)[] = [
  "All",
  "CeFi",
  "DeFi",
  "Infrastructure",
  "L1/L2s",
  "NFT",
  "Stablecoin",
];

export function Portfolio() {
  const [active, setActive] = useState<"All" | Category>("All");

  const groups = useMemo(() => {
    const list =
      active === "All"
        ? portfolio
        : portfolio.filter((p) => p.category === active);
    const map: Record<string, PortfolioCompany[]> = {};
    for (const c of list) {
      let key = c.name[0].toUpperCase();
      if (!/[A-Z]/.test(key)) key = "#";
      (map[key] ||= []).push(c);
    }
    return Object.keys(map)
      .sort()
      .map((letter) => ({ letter, items: map[letter] }));
  }, [active]);

  return (
    <section id="portfolio" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="04" title="TEAM" sec="SEC-04" />

        {/* intro */}
        <div className="mt-20 md:mt-32 space-y-16 md:space-y-20">
          <Reveal>
            <p className="font-serif-df text-[#a3a19c] text-2xl md:text-4xl leading-[1.15] max-w-3xl">
              From protocols to exchanges to apps and beyond, we back teams
              building generational companies and products in crypto across
              sectors and stages.
            </p>
          </Reveal>
          <Reveal className="md:pl-[38%]" delay={120}>
            <div className="relative max-w-xl">
              <span className="mono-label absolute -top-6 left-0 md:top-1.5 md:-left-24">
                Tenet
              </span>
              <p className="font-serif-df text-df-gray text-lg md:text-xl leading-[1.4]">
                We support teams tackling big, wicked problems and pushing the
                boundaries of the industry. Working on something weird? We love
                the weird stuff.
              </p>
            </div>
          </Reveal>
        </div>

        {/* SPOTLIGHT */}
        <div className="mt-28 md:mt-40">
          <SectionHeader title="SPOTLIGHT" sec="09" size="md" />
          <div className="mt-12 md:mt-16 border-t hairline">
            {spotlight.map((s) => (
              <a
                key={s.name}
                href="#portfolio"
                className="group flex items-baseline justify-between gap-4 border-b hairline py-3 md:py-4"
              >
                <span className="font-serif-df uppercase leading-[1.05] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#6f6d69] group-hover:text-df-orange transition-colors duration-300">
                  {s.name}
                </span>
                <span className="mono-label shrink-0 self-center group-hover:!text-df-orange transition-colors">
                  {s.category}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* INDEX */}
        <div className="mt-28 md:mt-40">
          <SectionHeader title="INDEX" sec="128" size="md" />

          <div className="mt-12 md:mt-16 flex flex-wrap gap-1.5 mb-10">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={cn(
                  "mono-label px-3 py-2 border transition-colors",
                  active === f
                    ? "bg-df-orange !text-black border-df-orange"
                    : "hairline !text-df-gray hover:!text-df-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="columns-2 md:columns-3 lg:columns-4 gap-8 md:gap-12">
            {groups.map((g) => (
              <div
                key={g.letter}
                className="break-inside-avoid mb-8 inline-block w-full align-top"
              >
                <div className="font-serif-df text-df-gray text-center text-lg mb-1 border-b hairline pb-1">
                  {g.letter}
                </div>
                <ul>
                  {g.items.map((c) => (
                    <li key={c.name}>
                      <a
                        href="#portfolio"
                        className="group flex items-center justify-between border-b hairline py-2"
                      >
                        <span className="font-grotesque uppercase text-[12px] md:text-[13px] tracking-wide text-df-white/85 group-hover:text-df-orange transition-colors">
                          {c.name}
                        </span>
                        <PixelArrow className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-df-orange transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
