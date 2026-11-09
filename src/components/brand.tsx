import { cn } from "@/lib/utils";

/** App logo mark: a sky-blue toy block with a yellow star. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Logo MyMoney Buddy" className={cn("size-10", className)}>
      <rect x="2" y="5" width="44" height="40" rx="11" fill="#1f6fb2" />
      <rect x="2" y="2" width="44" height="40" rx="11" fill="#5ab0ea" />
      <path d="M24 9.5l3.6 7.4 8.1 1-5.9 5.6 1.5 8L24 27.6l-7.3 3.9 1.5-8-5.9-5.6 8.1-1z" fill="#ffd54f" stroke="#e2a800" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
