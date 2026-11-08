import { Mascot } from "@/components/mascot";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-center gap-3">
        <Mascot mood="excited" className="size-12 animate-float" />
        <p className="font-extrabold text-ink-soft">Bibo sedang menghitung uangmu…</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}
