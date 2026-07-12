"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";
import { PixelMark, Cross } from "@/components/glyphs";
import { team, type TeamMember } from "@/lib/data";

function bioFor(m: TeamMember) {
  return `As ${m.title}, ${m.name.split(" ")[0]} works across Dragonfly's global team — spanning New York City and Singapore — backing exceptional founders building the future of crypto.`;
}

function TeamCell({ member, index }: { member: TeamMember; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative bg-black p-5 md:p-6 flex flex-col justify-between min-h-[150px] transition-colors hover:bg-[#080808]">
      <div className="flex items-start justify-between">
        <span className="mono-label">{String(index + 1).padStart(2, "0")}</span>
        <PixelMark className="h-4 w-4 text-df-white/25 group-hover:text-df-orange transition-colors" />
      </div>

      <div className="mt-6">
        <h3 className="font-grotesque text-lg md:text-xl leading-tight text-df-white group-hover:text-df-orange transition-colors">
          {member.name}
        </h3>
        <p className="mt-1 font-serif-df text-df-gray text-sm leading-snug">
          {member.title}
        </p>

        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-3 flex items-center gap-2 mono-label !text-df-white/60 hover:!text-df-orange transition-colors"
        >
          {open ? "Hide Bio" : "Show Bio"}
          <Cross
            className={cnRotate(open)}
          />
        </button>

        <div
          className="grid transition-all duration-500 ease-out"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <p className="mt-3 font-serif-df text-df-gray text-sm leading-relaxed">
              {bioFor(member)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cnRotate(open: boolean) {
  return `h-2.5 w-2.5 transition-transform duration-300 ${
    open ? "rotate-45 text-df-orange" : "text-df-white/60"
  }`;
}

export function Team() {
  return (
    <section id="team" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="03" title="PRODUCT" sec="SEC-03" />

        <div className="mt-20 md:mt-32 space-y-16 md:space-y-24">
          <Reveal>
            <p className="font-serif-df text-[#a3a19c] text-2xl md:text-4xl lg:text-[52px] leading-[1.12] max-w-4xl">
              Built for the edge.
            </p>
          </Reveal>

          <Reveal className="md:pl-[38%]" delay={120}>
            <div className="relative max-w-xl">
              <span className="mono-label absolute -top-6 left-0 md:top-1.5 md:-left-24">
                The Device
              </span>
              <p className="font-serif-df text-df-gray text-xl md:text-2xl leading-[1.4]">
                A headband that reads the pre-fatigue signal in real time and
                nudges you past it — through self-talk priming, sensory
                entrainment, and taVNS. No lab. No wires. Just the reserve you
                didn&apos;t know you had.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 md:mt-24 border hairline">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[var(--df-line)]">
            {team.map((m, i) => (
              <TeamCell key={m.name} member={m} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
