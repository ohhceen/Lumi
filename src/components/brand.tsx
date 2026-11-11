import { cn } from "@/lib/utils";

/** App logo mark: a white star on a charcoal rounded square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Logo Lumi" className={cn("size-10", className)}>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#1d1d1f" />
      <path d="M24 10l3.6 7.4 8.1 1-5.9 5.6 1.5 8L24 28.1l-7.3 3.9 1.5-8-5.9-5.6 8.1-1z" fill="#ffffff" />
    </svg>
  );
}
