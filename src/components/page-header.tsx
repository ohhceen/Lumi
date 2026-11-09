import { Character } from "./character";
import type { CharacterKey } from "@/lib/characters";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
  character,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** small character illustration beside the title */
  character?: CharacterKey;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex items-end gap-3">
        {character ? <Character name={character} className="-mb-1 size-16 sm:size-20" /> : null}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm font-semibold text-ink-soft">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
