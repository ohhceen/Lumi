import { Mascot, type MascotMood } from "./mascot";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  mood = "sleepy",
  children,
  className,
}: {
  title: string;
  description?: string;
  mood?: MascotMood;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line px-6 py-10 text-center", className)}>
      <Mascot mood={mood} className="size-20 animate-float" />
      <p className="mt-3 text-base font-black text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm font-semibold text-ink-soft">{description}</p> : null}
      {children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
