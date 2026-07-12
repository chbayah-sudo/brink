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

export default function Skiper14() {
  return (
    <footer id="footer" className="relative overflow-hidden bg-df-black text-df-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24">
        {/* brain animation — the ASCII/dot signal loop, on ink so its black
            plate blends into the footer. Animated webp: no motion-reduce hook,
            but it's ambient (no essential info), so that's acceptable. */}
        <div className="mb-12 flex justify-center md:mb-16">
          <img
            src="/footer-brain.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="pointer-events-none w-full max-w-[520px] select-none opacity-90 mix-blend-screen"
          />
        </div>

        {/* small info rows */}
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

      {/* giant wordmark, full-bleed at the bottom edge */}
      <div className="mt-10 select-none px-2 md:mt-16 md:px-4">
        <h2 className="font-grotesque leading-[0.74] tracking-[-0.03em] text-df-white text-center whitespace-nowrap text-[clamp(4rem,21vw,20rem)]">
          BRINK
        </h2>
      </div>
    </footer>
  );
}
