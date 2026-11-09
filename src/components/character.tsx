import Image from "next/image";
import manifest from "@/lib/character-manifest.json";
import { CHARACTER_SLOTS, type CharacterKey } from "@/lib/characters";
import { cn } from "@/lib/utils";

const available = manifest as Partial<Record<CharacterKey, string>>;
const showSlots = process.env.NEXT_PUBLIC_SHOW_CHARACTER_SLOTS === "1";

export function hasCharacter(name: CharacterKey) {
  return Boolean(available[name]);
}

/**
 * A character illustration slot. Renders the image from public/characters/
 * when it exists; otherwise renders nothing (or, with
 * NEXT_PUBLIC_SHOW_CHARACTER_SLOTS=1, a labelled outline to help place assets).
 */
export function Character({
  name,
  className,
  priority = false,
  decorative = true,
}: {
  name: CharacterKey;
  /** size it with height/width classes, e.g. "h-32 w-32" */
  className?: string;
  priority?: boolean;
  /** decorative images get empty alt text (screen readers skip them) */
  decorative?: boolean;
}) {
  const src = available[name];
  if (!src) {
    if (!showSlots) return null;
    return (
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-primary/60 bg-white/50 p-1 text-center text-[10px] leading-tight font-bold break-all text-primary-strong",
          className,
        )}
      >
        {name}.png
      </span>
    );
  }
  return (
    <span className={cn("relative block shrink-0", className)}>
      <Image
        src={src}
        alt={decorative ? "" : CHARACTER_SLOTS[name].name}
        fill
        sizes="(max-width: 640px) 40vw, 240px"
        priority={priority}
        className="object-contain drop-shadow-[0_8px_12px_rgba(31,111,178,0.25)]"
      />
    </span>
  );
}
