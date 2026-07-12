import { MenuProvider } from "@/components/menu-context";
import { Header } from "@/components/header";
import { MenuOverlay } from "@/components/menu-overlay";
import { Hero } from "@/components/hero";
import { AsciiBrain } from "@/components/ascii-brain";
import { LenisProvider } from "@/components/lenis-provider";
import { Writing } from "@/components/writing";
import { Team } from "@/components/team";
import { Portfolio } from "@/components/portfolio";
import { Careers } from "@/components/careers";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <LenisProvider>
      <MenuProvider>
        <div className="grain-overlay" />
        <Header />
        <MenuOverlay />
        <main className="relative">
          <Hero />
          <AsciiBrain />
          <Writing />
          <Team />
          <Portfolio />
          <Careers />
          <Footer />
        </main>
      </MenuProvider>
    </LenisProvider>
  );
}
