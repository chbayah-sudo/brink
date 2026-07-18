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
export function PixelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("h-4 w-4", className)}
      fill="currentColor"
      aria-hidden
    >
      <rect x="7" y="0" width="2" height="16" />
      <rect x="0" y="4" width="6" height="2" />
      <rect x="10" y="4" width="6" height="2" />
      <rect x="2" y="9" width="4" height="2" />
      <rect x="10" y="9" width="4" height="2" />
      <rect x="6" y="6" width="4" height="4" />
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
