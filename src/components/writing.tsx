import { SectionHeader } from "@/components/section-header";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { AllContent } from "@/components/all-content";

export function Writing() {
  return (
    <section id="writing" className="relative py-24 md:py-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <SectionHeader number="02" title="SCIENCE" sec="SEC-02" />
        <FeaturedCarousel />

        <div className="mt-28 md:mt-40">
          <SectionHeader title="ALL CONTENT" sec="13" size="md" />
          <AllContent />
        </div>
      </div>
    </section>
  );
}
