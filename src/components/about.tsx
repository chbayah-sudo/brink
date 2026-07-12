import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";

export function About() {
  return (
    <section id="about" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="01" title="THESIS" sec="SEC-01" />

        <div className="mt-20 md:mt-32 space-y-16 md:space-y-24">
          <Reveal>
            <p className="font-serif-df text-[#a3a19c] text-2xl md:text-4xl lg:text-[52px] leading-[1.12] max-w-4xl">
              Your brain quits first.
            </p>
          </Reveal>

          <Reveal className="md:pl-[38%]" delay={120}>
            <div className="relative max-w-xl">
              <span className="mono-label absolute -top-6 left-0 md:top-1.5 md:-left-24">
                Thesis
              </span>
              <p className="font-serif-df text-df-gray text-xl md:text-2xl leading-[1.4]">
                Fatigue is a decision, not a limit. Your prefrontal cortex calls
                it before your body is actually done. Brink reads that signal —
                and hands the reserve back.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
