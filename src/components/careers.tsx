import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";

export function Careers() {
  return (
    <section id="careers" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="04" title="CONTACT" sec="SEC-04" />

        <Reveal className="mt-14 md:mt-20 text-center">
          <p className="font-serif-df text-[#a3a19c] text-3xl md:text-5xl lg:text-6xl leading-[1.12] max-w-3xl mx-auto">
            Find your reserve.
          </p>
          <p className="mt-8 md:mt-12 font-serif-df text-df-gray text-xl md:text-2xl leading-[1.4] max-w-2xl mx-auto">
            Brink is early, and building fast. If you invest in neurotech, human
            performance, or the science of effort — let&apos;s talk.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
