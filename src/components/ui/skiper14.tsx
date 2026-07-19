import { FooterDither } from "@/components/footer-dither";

// Footer in the style of Skiper UI "skiper14" (an ASCII-art element over a
// giant wordmark with a row of small info columns). The @skiper-ui registry
// item wasn't fetchable (skiper14.json 404 / auth-gated), so this is a manual
// build per the documented fallback — themed to Brink, with the install-command
// bar and all Skiper branding removed. No purple/green; amber-red is the only
// accent.

const INFO_ROWS: { value: string; href?: string }[] = [
  { value: "SF" },
  { value: "NEUROTECH" },
  { value: "PRE-FATIGUE DETECTION" },
  { value: "CONTACT", href: "mailto:contact@neurabrink.bio" },
];

// Wordmark panel look. "bleed" = no panel; the dithered page background flows
// straight through and the BRINK wordmark sits on it in off-white (keeps the
// background continuous to the very end). "light" = cream #e8e4d8 panel with ink
// BRINK. "dark" = ink panel with off-white BRINK. Default bleed.
const WORDMARK_PANEL: "bleed" | "light" | "dark" = "light";

const PANEL_LOOKUP = {
  light: "bg-df-white text-df-black",
  dark: "bg-df-black text-df-white",
  bleed: "text-df-white", // transparent — wordmark sits on the dithered bg
} as const;
const PANEL_CLASS = PANEL_LOOKUP[WORDMARK_PANEL];

export default function Skiper14() {
  return (
    <footer id="footer" className="relative bg-df-black text-df-white">
      {/* TOP — brain visual in its own dark band. The ASCII/dot signal loop,
          object-cover across a tall block. On ink so its black plate blends via
          mix-blend-screen. Animated webp: no motion-reduce hook, but ambient. */}
      <div className="h-[74vh] min-h-[460px] w-full overflow-hidden bg-df-black">
        <img
          src="/footer-brain.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none h-full w-full select-none object-contain opacity-90 mix-blend-screen"
        />
      </div>

      {/* info rows — stay on the dark band, below the brain */}
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-2 md:px-8 md:pb-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-df-white/10 pt-8 md:grid-cols-4">
          {INFO_ROWS.map((row, i) => (
            <div key={row.value} className="flex flex-col gap-2">
              <span className="font-mono-df text-[0.6rem] tracking-[0.24em] text-df-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              {row.href ? (
                <a
                  href={row.href}
                  className="font-mono-df text-[0.78rem] uppercase tracking-[0.12em] text-df-orange transition-opacity hover:opacity-70"
                >
                  {row.value}
                </a>
              ) : (
                <span className="font-mono-df text-[0.78rem] uppercase tracking-[0.12em] text-df-white">
                  {row.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM — giant wordmark on its OWN clean panel, separated from the
          brain so it stays sharp and fully readable. Panel look is controlled
          by WORDMARK_PANEL (default: light cream panel, ink text). */}
      <div className={`relative overflow-hidden select-none px-2 pb-3 pt-3 md:px-4 md:pb-4 md:pt-4 ${PANEL_CLASS}`}>
        {/* Bayer-dithered cream field behind the wordmark (site's dither language). */}
        <FooterDither />
        <h2 className="relative z-[1] font-grotesque leading-[0.74] tracking-[-0.03em] text-center whitespace-nowrap text-[clamp(2rem,9vw,8rem)]">
          BRINK
        </h2>
      </div>
    </footer>
  );
}
