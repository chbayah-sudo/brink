import { cn } from "@/lib/utils";

/* Thin registration cross (the "+" corner marks) */
export function Cross({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 11 11"
      className={cn("h-2.5 w-2.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <line x1="5.5" y1="0" x2="5.5" y2="11" />
      <line x1="0" y1="5.5" x2="11" y2="5.5" />
    </svg>
  );
}

/* 2x2 pixel grid (used in bars + list rows) */
export function GridDots({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={cn("h-2.5 w-2.5", className)}
      fill="currentColor"
      aria-hidden
    >
      <rect x="0" y="0" width="4" height="4" />
      <rect x="6" y="0" width="4" height="4" />
      <rect x="0" y="6" width="4" height="4" />
      <rect x="6" y="6" width="4" height="4" />
    </svg>
  );
}

/* Diagonal arrow made of pixels (article link cue) */
export function PixelArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={cn("h-2.5 w-2.5", className)}
      fill="currentColor"
      aria-hidden
    >
      <rect x="0" y="0" width="4" height="4" />
      <rect x="6" y="6" width="4" height="4" />
      <rect x="6" y="0" width="4" height="4" opacity="0.35" />
    </svg>
  );
}

/* Transport / play controls cluster ( >|< ) */
export function Transport({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 10"
      className={cn("h-2.5 w-[30px]", className)}
      fill="currentColor"
      aria-hidden
    >
      <path d="M0 0 L5 5 L0 10 Z" />
      <rect x="8" y="0" width="2" height="10" />
      <rect x="11" y="0" width="2" height="10" />
      <path d="M20 0 L15 5 L20 10 Z" opacity="0.6" />
      <path d="M30 0 L25 5 L30 10 Z" opacity="0.6" />
    </svg>
  );
}

/* Small pixel mark for the header logo */
// The Brink dot-cluster mark (see public/logo.png): six dots ringing a
// central speech-bubble dot with a comma tail. currentColor so it inherits
// hover tints like any glyph.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-[34px] w-[34px]", className)}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="3.1" r="2.75" />
      <circle cx="19.7" cy="7.55" r="2.75" />
      <circle cx="19.7" cy="16.45" r="2.75" />
      <circle cx="12" cy="20.9" r="2.75" />
      <circle cx="4.3" cy="16.45" r="2.75" />
      <circle cx="4.3" cy="7.55" r="2.75" />
      <circle cx="12" cy="11.6" r="3.3" />
      <path d="M12.4 14.5 L14.7 14.1 L12.9 17.3 Z" />
    </svg>
  );
}

/* Animated VU-meter dashes for the transport bar */
export function VuDashes({ className }: { className?: string }) {
  const bars = [0.9, 0.4, 0.7, 0.3, 0.6, 0.85, 0.35];
  return (
    <div className={cn("flex items-end gap-[3px] h-2.5", className)} aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] bg-df-white/70 origin-bottom"
          style={{
            height: "100%",
            transform: `scaleY(${h})`,
            animation: `vu 0.7s ${i * 0.12}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
