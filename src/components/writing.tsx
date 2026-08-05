import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";
import { FeaturedCarousel } from "@/components/featured-carousel";

export function Writing() {
  return (
    <section
      id="writing"
      className="relative pt-24 pb-14 md:pt-36 md:pb-20"
      // soft ink seat so the copy doesn't fight the dither haze behind it
      style={{
        background:
          "linear-gradient(180deg, rgba(10,12,16,0) 0%, rgba(10,12,16,0.6) 12%, rgba(10,12,16,0.6) 88%, rgba(10,12,16,0) 100%)",
      }}
    >
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
              <span className="mono-label !text-df-white/55 absolute -top-6 left-0 md:top-1.5 md:-left-24">
                How It Works
              </span>
              {/* Every modality named here must exist in the demo's Device
                  sensor list. A modality on the site that the product does not
                  ship is a diligence trigger. */}
              <p className="font-serif-df text-df-white/80 text-xl md:text-2xl leading-[1.4]">
                Strain shows up in the signal before it shows in your output.
                Brink reads that window across frontal EEG, optical pulse,
                movement and skin temperature, then acts inside it — before the
                drop reaches what you are doing.
              </p>
              <p className="mt-5 font-mono-df text-[0.62rem] tracking-[0.14em] text-df-white/50">
                EARLY WARNING FROM MULTIMODAL SIGNAL · RESEARCH MODEL · IN
                TESTING
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-28 md:mt-40">
          <FeaturedCarousel />
        </div>
      </div>
    </section>
  );
}
