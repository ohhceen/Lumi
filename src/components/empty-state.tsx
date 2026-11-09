import { Character, hasCharacter } from "./character";
import { Cloud, Star } from "./decorations";
import { cn } from "@/lib/utils";

/** Friendly empty state; the Little Green Men keep it company when their image is available. */
export function EmptyState({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-white/70 px-6 py-10 text-center", className)}>
      {hasCharacter("aliens") ? (
        <Character name="aliens" className="size-24 animate-float" />
      ) : (
        <span aria-hidden className="relative block h-14 w-24">
          <Cloud className="absolute inset-x-0 bottom-0 w-24" />
          <Star className="absolute top-0 right-1 size-5 animate-twinkle" />
        </span>
      )}
      <p className="mt-3 text-base font-black text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm font-semibold text-ink-soft">{description}</p> : null}
      {children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
