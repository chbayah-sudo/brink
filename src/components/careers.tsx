import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";

export function Careers() {
  return (
    <section
      id="careers"
      className="relative py-14 md:py-20"
      // soft ink seat so the copy doesn't fight the dither haze behind it
      style={{
        background:
          "linear-gradient(180deg, rgba(10,12,16,0) 0%, rgba(10,12,16,0.6) 16%, rgba(10,12,16,0.6) 84%, rgba(10,12,16,0) 100%)",
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="04" title="CONTACT" sec="SEC-04" />

        <Reveal className="mt-10 md:mt-14 text-center">
          <p className="font-serif-df text-[#a3a19c] text-3xl md:text-5xl lg:text-6xl leading-[1.12] max-w-3xl mx-auto">
            Find your reserve.
          </p>
          <p className="mt-8 md:mt-12 font-serif-df text-df-white/75 text-xl md:text-2xl leading-[1.4] max-w-2xl mx-auto">
            Brink is early, and building fast. If you invest in neurotech, human
            performance, or the future of human capacity, let&apos;s talk.
          </p>
          <a
            href="mailto:contact@neurabrink.bio"
            className="mt-8 inline-block font-mono-df text-sm md:text-base tracking-[0.16em] text-df-orange transition-colors hover:text-df-white md:mt-10"
          >
            [ contact@neurabrink.bio ]
          </a>
        </Reveal>
      </div>
    </section>
  );
}
