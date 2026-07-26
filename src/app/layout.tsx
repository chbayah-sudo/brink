import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Roboto_Slab } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import "@/lib/safe-storage";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

// Slab serif for the BRINK wordmark (hero + footer).
const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-slab",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brink",
  description:
    "Brink is a neurotech company building a calmer, more intuitive interface for the mind.",
  icons: {
    // Square 512px crop of the dot-cluster logo (public/logo.png is the
    // full-size portrait source; regenerate via sips if the art changes).
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${ibmPlexMono.variable} ${robotoSlab.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
