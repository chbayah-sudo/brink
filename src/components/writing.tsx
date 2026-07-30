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
              <p className="font-serif-df text-df-white/80 text-xl md:text-2xl leading-[1.4]">
                Cognitive and physical breakdown announce themselves in the
                brain before anything shows outside. Brink reads that signature
                with EEG and fNIRS, predicts the decline before it becomes
                visible, then intervenes in real time.
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
