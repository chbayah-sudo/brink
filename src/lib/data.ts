export type Article = {
  title: string;
  excerpt: string;
  category: "THE RESERVE" | "THE MECHANISM";
  href: string;
  image?: string;
  source?: string; // small muted mono citation line
  ascii?: boolean; // render image via the AsciiImage dot-matrix effect
};

// The two SCIENCE proof cards: the claim ("The signal before the stop") is
// backed by the proof (3×) and the why (Marcora's model / the DLPFC).
export const featuredWriting: Article[] = [
  {
    title: "The tank is never empty.",
    category: "THE RESERVE",
    href: "#writing",
    // Cyclist-at-effort photo, rendered as ASCII via AsciiImage.
    image: "/images/hf_20260717_100315_e083d5c7-47a7-4ad6-a16a-6a9dd5f3caea.png",
    ascii: true,
    excerpt:
      "Cyclists ridden to exhaustion could still produce roughly 3× the power in an all-out effort — the limit was set by the brain, not the muscle. Brink lives in that gap.",
    source: "Marcora & Staiano, 2010",
  },
  {
    title: "Effort is a decision.",
    category: "THE MECHANISM",
    href: "#writing",
    // Runner's-face-at-effort photo, rendered as ASCII via AsciiImage.
    image: "/images/hf_20260717_103317_742ceb50-5ded-4175-ae97-f8a44b85c4c9.png",
    ascii: true,
    excerpt:
      "Exhaustion isn't your muscles failing — it's your prefrontal cortex deciding the effort isn't worth it. Brink reads that decision and hands the reserve back.",
    source: "Marcora, psychobiological model (2009)",
  },
];

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Thesis", href: "#brain" },
  { label: "Science", href: "#writing" },
  { label: "Product", href: "#product" },
  { label: "Contact", href: "#footer" },
];
