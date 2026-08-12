import { MenuProvider } from "@/components/menu-context";
import { Preloader } from "@/components/preloader";
import { HashAnchors } from "@/components/hash-anchors";
import { DitherBackground } from "@/components/dither-background";
import { Header } from "@/components/header";
import { MenuOverlay } from "@/components/menu-overlay";
import { Hero } from "@/components/hero";
import { AsciiBrain } from "@/components/ascii-brain";
import BrinkSystemExplorer from "@/components/brink-system-explorer";
import { AppDemo } from "@/components/app-demo";
import { LenisProvider } from "@/components/lenis-provider";
import { Writing } from "@/components/writing";
import { Preorder } from "@/components/preorder";
import { Careers } from "@/components/careers";
import Skiper14 from "@/components/ui/skiper14";

export default function Home() {
  return (
    <LenisProvider>
      <MenuProvider>
        <Preloader />
        <HashAnchors />
        <DitherBackground />
        <div className="grain-overlay" />
        <Header />
        <MenuOverlay />
        <main className="relative z-[1]">
          <Hero />
          <AsciiBrain />
          <BrinkSystemExplorer />
          <AppDemo />
          <Writing />
          <Preorder />
          <Careers />
          <Skiper14 />
        </main>
      </MenuProvider>
    </LenisProvider>
  );
}
