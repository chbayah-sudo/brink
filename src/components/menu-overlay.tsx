"use client";

import { useMenu } from "@/components/menu-context";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PixelMark, Cross } from "@/components/glyphs";

const socials = [
  { label: "X", href: "https://x.com/dragonfly_xyz" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/dragonfly-capital-partners/",
  },
  { label: "Press Kit", href: "https://brand.dragonfly.xyz/" },
];

export function MenuOverlay() {
  const { open, setOpen } = useMenu();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black transition-[opacity,visibility] duration-500",
        open ? "opacity-100 visible" : "opacity-0 invisible"
      )}
    >
      {/* faint grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--df-line) 1px, transparent 1px), linear-gradient(90deg, var(--df-line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative h-full flex flex-col px-4 md:px-8 py-4 md:py-5">
        {/* top */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-df-white">
            <PixelMark className="text-df-white" />
            <span className="font-mono text-[11px] tracking-[0.22em]">
              DRAGONFLY
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 group"
            aria-label="Close menu"
          >
            <span className="mono-label !text-df-white group-hover:!text-df-orange transition-colors">
              Close
            </span>
            <Cross className="h-3 w-3 rotate-45 text-df-white group-hover:text-df-orange transition-colors" />
          </button>
        </div>

        {/* links */}
        <nav className="flex-1 flex flex-col justify-center">
          <ul className="divide-y divide-[var(--df-line-soft)] border-y border-[var(--df-line-soft)]">
            {navLinks.map((link, i) => (
              <li key={link.label} className="overflow-hidden">
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-4 md:gap-8 py-3 md:py-4"
                  style={{
                    transform: open ? "translateY(0)" : "translateY(110%)",
                    opacity: open ? 1 : 0,
                    transition: `transform 0.7s cubic-bezier(0.16,1,0.3,1) ${
                      120 + i * 55
                    }ms, opacity 0.7s ease ${120 + i * 55}ms`,
                  }}
                >
                  <span className="mono-label w-8 shrink-0 group-hover:!text-df-orange transition-colors">
                    0{i + 1}
                  </span>
                  <span className="font-grotesque text-4xl sm:text-6xl md:text-7xl leading-[0.95] text-df-white group-hover:text-df-orange group-hover:translate-x-2 transition-all duration-300">
                    {link.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* bottom */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="mono-label !text-df-white hover:!text-df-orange transition-colors link-sweep"
              >
                {s.label}
              </a>
            ))}
          </div>
          <div className="flex gap-6">
            <a
              href="#footer"
              onClick={() => setOpen(false)}
              className="mono-label hover:!text-df-orange transition-colors"
            >
              Terms
            </a>
            <a
              href="#footer"
              onClick={() => setOpen(false)}
              className="mono-label hover:!text-df-orange transition-colors"
            >
              Disclosures
            </a>
            <span className="mono-label">© DRAGONFLY 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
