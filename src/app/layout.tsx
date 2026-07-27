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
    // All derived from the dot-cluster logo (public/logo.png is the source).
    // favicon.ico exists so the browser's eager /favicon.ico request gets the
    // same mark instead of 404ing and flashing a stale cached icon.
    // ?v=2 busts favicon caches that stored the previous mark
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png?v=2",
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
