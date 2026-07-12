// Footer in the style of Skiper UI "skiper14" (an ASCII-art element over a
// giant wordmark with a row of small info columns). The @skiper-ui registry
// item wasn't fetchable (skiper14.json 404 / auth-gated), so this is a manual
// build per the documented fallback — themed to Brink, with the install-command
// bar and all Skiper branding removed. No purple/green; amber-red is the only
// accent.

const INFO_ROWS: { value: string; href?: string }[] = [
  { value: "NORMAN, OK" },
  { value: "AND ONLINE" },
  { value: "NEUROTECH" },
  { value: "PRE-FATIGUE DETECTION" },
  // TODO: replace with the real contact address once provided.
  { value: "CONTACT", href: "mailto:YOUR_EMAIL_HERE" },
];

// Wordmark panel look. "light" = cream #e8e4d8 panel with ink #0a0c10 BRINK
// (matches the reference — crisp, high-contrast). "dark" = ink panel with
// off-white BRINK. Default light.
const WORDMARK_PANEL: "light" | "dark" = "light";

const PANEL_CLASS =
  WORDMARK_PANEL === "light"
    ? "bg-df-white text-df-black"
    : "bg-df-black text-df-white";

export default function Skiper14() {
  return (
    <footer id="footer" className="relative bg-df-black text-df-white">
      {/* TOP — brain visual in its own dark band. The ASCII/dot signal loop,
          object-cover across a tall block. On ink so its black plate blends via
          mix-blend-screen. Animated webp: no motion-reduce hook, but ambient. */}
      <div className="h-[44vh] min-h-[340px] w-full overflow-hidden">
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
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-df-white/10 pt-8 sm:grid-cols-3 md:grid-cols-5">
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
      <div className={`select-none px-2 pb-3 pt-3 md:px-4 md:pb-4 md:pt-4 ${PANEL_CLASS}`}>
        <h2 className="font-grotesque leading-[0.74] tracking-[-0.03em] text-center whitespace-nowrap text-[clamp(2rem,9vw,8rem)]">
          BRINK
        </h2>
      </div>
    </footer>
  );
}
