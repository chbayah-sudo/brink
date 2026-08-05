import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Roboto_Slab } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const SITE_URL = "https://www.neurabrink.bio";
const SITE_DESCRIPTION =
  "Brink is the intelligence layer between the brain and human performance: a neurotech headband that recognizes approaching breakdown, predicts decline before it shows, intervenes in real time, and learns what works for you.";

export const metadata: Metadata = {
  // Static export emits no server origin, so relative OG URLs never resolve —
  // metadataBase is what makes og:image absolute in the shipped HTML.
  metadataBase: new URL(SITE_URL),
  title: "Brink — The Operating System for Human Capacity",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Brink",
    title: "Brink — The Operating System for Human Capacity",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "A person wearing the Brink neuroperformance headband across the forehead",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brink — The Operating System for Human Capacity",
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
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
        <Analytics />
      </body>
    </html>
  );
}
