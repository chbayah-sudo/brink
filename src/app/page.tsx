import { MenuProvider } from "@/components/menu-context";
import { Header } from "@/components/header";
import { MenuOverlay } from "@/components/menu-overlay";
import { Hero } from "@/components/hero";
import { AsciiBrain } from "@/components/ascii-brain";
import { BrainNerveScrub } from "@/components/brain-nerve-scrub";
import BrinkSystemExplorer from "@/components/brink-system-explorer";
import { LenisProvider } from "@/components/lenis-provider";
import { Writing } from "@/components/writing";
import GalleryFrame from "@/components/gallery-frame";
import { Team } from "@/components/team";
import { Portfolio } from "@/components/portfolio";
import { Careers } from "@/components/careers";
import Skiper14 from "@/components/ui/skiper14";

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
          <BrainNerveScrub />
          <BrinkSystemExplorer />
          <Writing />
          <GalleryFrame />
          <Team />
          <Portfolio />
          <Careers />
          <Skiper14 />
        </main>
      </MenuProvider>
    </LenisProvider>
  );
}
