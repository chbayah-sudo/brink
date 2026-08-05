export type Article = {
  title: string;
  excerpt: string;
  category: "THE FINDING" | "THE MECHANISM";
  href: string;
  image?: string;
  source?: string; // small muted mono citation line
  ascii?: boolean; // render image via the AsciiImage dot-matrix effect
};

// The two SCIENCE proof cards: what the studies found (card 1) and how the
// decision to stop is currently modelled (card 2).
//
// Both cards state findings, not implications. The earlier copy converted a
// ten-person cycling study into a universal law ("the tank is never empty",
// "the limit was set by the brain, not the muscle") and localised the stop
// decision to the prefrontal cortex — neither is supported by the abstracts,
// and neither is establishable by a seven-channel frontal dry array. `href`
// now resolves to the DOI, since the cards already open in a new tab and a
// technical reader will try them.
export const featuredWriting: Article[] = [
  {
    title: "The tank was not empty.",
    category: "THE FINDING",
    href: "https://doi.org/10.1007/s00421-010-1418-6",
    // Cyclist-at-effort photo, rendered as ASCII via AsciiImage.
    image: "/images/hf_20260717_100315_e083d5c7-47a7-4ad6-a16a-6a9dd5f3caea.png",
    ascii: true,
    excerpt:
      "Ten cyclists rode to exhaustion at 242 watts. Seconds later they produced 731 — about three times the power they had just failed to hold. Whatever stopped them, it was not an empty muscle. Brink lives in that gap.",
    source:
      "Marcora & Staiano, 2010 · Eur J Appl Physiol · DOI 10.1007/s00421-010-1418-6",
  },
  {
    title: "Effort is a decision.",
    category: "THE MECHANISM",
    href: "https://doi.org/10.1007/s40279-014-0198-2",
    // Runner's-face-at-effort photo, rendered as ASCII via AsciiImage.
    image: "/images/hf_20260717_103317_742ceb50-5ded-4175-ae97-f8a44b85c4c9.png",
    ascii: true,
    excerpt:
      "Not one signal, and not one region. The decision to stop is assembled from perceived effort, motivation, physiology, and what the task is worth. Brink reads the inputs, not the verdict.",
    source: "Pageaux, 2014 · Sports Medicine · DOI 10.1007/s40279-014-0198-2",
  },
];

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Thesis", href: "#brain" },
  { label: "Science", href: "#writing" },
  { label: "Pre-order", href: "#preorder" },
  { label: "App demo", href: "#app" },
  { label: "Contact", href: "#footer" },
];
