import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";
import { PixelArrow } from "@/components/glyphs";
import { careers } from "@/lib/data";

export function Careers() {
  return (
    <section id="careers" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="05" title="CONTACT" sec="SEC-05" />

        <Reveal className="mt-14 md:mt-20 text-center">
          <p className="font-serif-df text-df-gray text-xl md:text-2xl leading-[1.4] max-w-2xl mx-auto">
            Dragonfly introduces world-class operators to the strongest teams in
            crypto. If you&apos;re ready to tackle big problems, we&apos;ll
            connect you with a team that matches your ambition.
          </p>
        </Reveal>

        <div className="mt-16 md:mt-24 border-t hairline">
          {careers.map((c, i) => (
            <Reveal key={c.index} delay={i * 80}>
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-6 py-8 md:py-12 border-b hairline transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-baseline gap-5 md:gap-10">
                  <span className="mono-label group-hover:!text-df-orange transition-colors">
                    {c.index}
                  </span>
                  <span className="font-grotesque text-2xl md:text-5xl lg:text-6xl leading-[0.95] whitespace-pre-line text-df-white group-hover:text-df-orange transition-colors">
                    {c.title}
                  </span>
                </div>
                <span className="flex items-center gap-3 mono-label !text-df-white group-hover:!text-df-orange transition-all group-hover:translate-x-1 shrink-0">
                  {c.action}
                  <PixelArrow className="h-3 w-3" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
