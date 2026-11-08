import { cn } from "@/lib/utils";

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
    </svg>
  );
}

export function Planet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-12", className)}>
      <circle cx="32" cy="32" r="16" fill="#c8b5f5" />
      <circle cx="26" cy="27" r="4" fill="#b29be9" />
      <circle cx="37" cy="38" r="2.5" fill="#b29be9" />
      <ellipse cx="32" cy="34" rx="29" ry="7" fill="none" stroke="#ffe39a" strokeWidth="4" transform="rotate(-18 32 34)" />
    </svg>
  );
}

export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" aria-hidden className={cn("w-20", className)}>
      <path d="M18 36 a12 12 0 0 1 0-24 a16 16 0 0 1 30-4 a13 13 0 0 1 16 12 a8 8 0 0 1-2 16z" fill="#fff" stroke="#ece4d6" strokeWidth="2" />
    </svg>
  );
}

/** Scattered stars for hero sections (decorative only). */
export function StarField({ className }: { className?: string }) {
  const stars = [
    { x: "8%", y: "20%", s: "size-3", d: "0s", c: "text-accent" },
    { x: "22%", y: "70%", s: "size-2", d: "1s", c: "text-secondary" },
    { x: "48%", y: "12%", s: "size-2.5", d: "0.5s", c: "text-primary" },
    { x: "70%", y: "78%", s: "size-3", d: "1.6s", c: "text-accent" },
    { x: "90%", y: "30%", s: "size-2", d: "0.8s", c: "text-secondary" },
  ];
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {stars.map((st, i) => (
        <span key={i} className={cn("absolute animate-twinkle", st.c)} style={{ left: st.x, top: st.y, animationDelay: st.d }}>
          <Sparkle className={st.s} />
        </span>
      ))}
    </div>
  );
}
