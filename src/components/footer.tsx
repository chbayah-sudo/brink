import { Reveal } from "@/components/reveal";
import { navLinks } from "@/lib/data";

const connect = [
  { label: "Contact", href: "#footer" },
  { label: "X", href: "https://x.com/dragonfly_xyz" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/dragonfly-capital-partners/",
  },
  { label: "Press Kit", href: "https://brand.dragonfly.xyz/" },
];

const legal = [
  { label: "Terms", href: "#" },
  { label: "Disclosures", href: "#" },
];

function Column({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="font-serif-df italic text-df-gray text-sm mb-4">
        {title}
      </div>
      <ul className="border-t hairline">
        {links.map((l) => (
          <li key={l.label} className="border-b hairline">
            <a
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex items-center justify-between py-2.5 font-grotesque uppercase text-sm tracking-wide text-df-white/90 hover:text-df-orange transition-colors"
            >
              {l.label}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-df-orange">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer id="footer" className="relative pt-24 md:pt-36">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        {/* INFO block */}
        <div className="relative border-t hairline pt-6">
          <span className="mono-label absolute left-0 -top-3 bg-black pr-3">
            Info
          </span>
          <Reveal>
            <p className="font-serif-df text-df-gray text-2xl md:text-4xl leading-[1.15] max-w-4xl">
              Dragonfly is a leading crypto investment fund. We back the best
              researchers and builders who will push the entire crypto ecosystem
              forward.
            </p>
          </Reveal>
        </div>

        {/* columns */}
        <div className="mt-20 md:mt-28 grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16">
          <Column title="Sections" links={navLinks.slice(0, 6)} />
          <Column title="Connect" links={connect} />
          <Column title="Legal" links={legal} />
        </div>

        {/* meta */}
        <div className="mt-16 md:mt-24 flex items-end justify-between gap-4">
          <span className="mono-label">DFLYF · DRAGONFLY CAPITAL</span>
          <span className="mono-label text-right">© DRAGONFLY CAPITAL 2026</span>
        </div>
      </div>

      {/* giant wordmark */}
      <div className="mt-10 md:mt-16 overflow-hidden border-t hairline">
        <h2 className="font-grotesque text-df-white leading-[0.78] tracking-[-0.03em] text-center whitespace-nowrap text-[15.5vw] pt-3 pb-1 select-none">
          DRAGONFLY
        </h2>
      </div>
    </footer>
  );
}
