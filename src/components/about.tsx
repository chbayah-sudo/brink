import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";

/**
 * NOT CURRENTLY MOUNTED — `src/app/page.tsx` does not import this component.
 * `#brain` (AsciiBrain) is what the "Thesis" nav link resolves to.
 *
 * The copy is kept claim-safe anyway: an earlier version localised the stop
 * decision to the prefrontal cortex and promised to "hand the reserve back",
 * which would reintroduce exactly the claims the SCIENCE section dropped if
 * anyone ever remounts this.
 */
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
                Fatigue is a decision, not a limit. It gets assembled from
                perceived effort, motivation, and the state of your body — not
                from one empty tank. Brink reads the inputs to that decision,
                and moves before it gets made.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
