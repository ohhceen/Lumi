import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className={cn("flex flex-col items-center justify-center rounded-3xl glass border-2 border-dashed border-line px-6 py-10 text-center", className)}>
      <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-full bg-cream text-ink-soft">
        <Inbox className="size-6" strokeWidth={2} />
      </span>
      <p className="mt-3 text-base font-black text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm font-semibold text-ink-soft">{description}</p> : null}
      {children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
