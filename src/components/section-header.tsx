import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

export function SectionHeader({
  number,
  title,
  sec,
  size = "lg",
}: {
  number?: string;
  title: string;
  sec?: string;
  size?: "lg" | "md";
}) {
  return (
    <header className="w-full select-none">
      {number && (
        <Reveal className="text-center">
          <div className="font-grotesque text-df-gray text-base md:text-lg mb-5 md:mb-8 tracking-tight">
            {number}
          </div>
        </Reveal>
      )}
      <div className="relative flex justify-center">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-px border-t hairline" />
        {sec && (
          <span className="mono-label absolute left-0 top-full mt-2">{sec}</span>
        )}
        <h2
          className={cn(
            "relative bg-black px-5 md:px-8 font-grotesque leading-none text-center text-df-white",
            size === "lg"
              ? "text-3xl md:text-5xl lg:text-6xl"
              : "text-2xl md:text-4xl"
          )}
        >
          {title}
        </h2>
      </div>
    </header>
  );
}
