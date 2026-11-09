import { Character, hasCharacter } from "@/components/character";
import { ToyBlock } from "@/components/decorations";
import { Skeleton } from "@/components/ui/skeleton";
import type { CharacterKey } from "@/lib/characters";

const CAST: CharacterKey[] = ["jessie", "rex", "hamm"];

export default function Loading() {
  const cast = CAST.filter(hasCharacter);
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-end gap-3">
        <div className="flex items-end gap-1">
          {cast.length
            ? cast.map((c) => <Character key={c} name={c} className="size-12 animate-float" />)
            : (
              <>
                <ToyBlock letter="A" color="#ef6b5f" className="size-9 animate-float" />
                <ToyBlock letter="B" color="#5ab0ea" className="size-9 animate-float [animation-delay:0.3s]" />
                <ToyBlock letter="C" color="#3fae6f" className="size-9 animate-float [animation-delay:0.6s]" />
              </>
            )}
        </div>
        <p className="pb-1 font-extrabold text-ink-soft">Sebentar ya, sedang menghitung uangmu…</p>
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
