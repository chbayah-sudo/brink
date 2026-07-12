import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { AllContent } from "@/components/all-content";

export function Writing() {
  return (
    <section id="writing" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="02" title="SCIENCE" sec="SEC-02" />

        <div className="mt-20 md:mt-32 space-y-16 md:space-y-24">
          <Reveal>
            <p className="font-serif-df text-[#a3a19c] text-2xl md:text-4xl lg:text-[52px] leading-[1.12] max-w-4xl">
              The signal before the stop.
            </p>
          </Reveal>

          <Reveal className="md:pl-[38%]" delay={120}>
            <div className="relative max-w-xl">
              <span className="mono-label absolute -top-6 left-0 md:top-1.5 md:-left-24">
                How It Works
              </span>
              <p className="font-serif-df text-df-gray text-xl md:text-2xl leading-[1.4]">
                There&apos;s a measurable neural signature in the DLPFC that
                shows up seconds before you consciously decide to quit. We detect
                it with EEG and fNIRS, then intervene before the thought becomes
                a stop.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-28 md:mt-40">
          <FeaturedCarousel />
        </div>

        <div className="mt-28 md:mt-40">
          <SectionHeader title="ALL CONTENT" sec="13" size="md" />
          <AllContent />
        </div>
      </div>
    </section>
  );
}
