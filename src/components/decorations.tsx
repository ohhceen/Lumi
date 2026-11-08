import { cn } from "@/lib/utils";

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
    </svg>
  );
}

/** Ringed planet with a soft glow. */
export function Planet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-12 drop-shadow-[0_0_14px_rgba(200,181,245,0.55)]", className)}>
      <circle cx="32" cy="32" r="16" fill="#c8b5f5" />
      <circle cx="26" cy="27" r="4" fill="#b29be9" />
      <circle cx="37" cy="38" r="2.5" fill="#b29be9" />
      <path d="M22 22 a16 16 0 0 1 14 -5" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="34" rx="29" ry="7" fill="none" stroke="#ffe39a" strokeWidth="3.5" transform="rotate(-18 32 34)" />
    </svg>
  );
}

/** Small blue moon / distant planet. */
export function Moon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-8 drop-shadow-[0_0_12px_rgba(142,197,247,0.6)]", className)}>
      <circle cx="20" cy="20" r="14" fill="#8ec5f7" />
      <circle cx="15" cy="16" r="3" fill="#6fb0ee" />
      <circle cx="25" cy="25" r="2" fill="#6fb0ee" />
    </svg>
  );
}

/** Shooting star that streaks across its parent (decorative). */
export function ShootingStar({ className, delay = "0s" }: { className?: string; delay?: string }) {
  return (
    <span
      aria-hidden
      style={{ animationDelay: delay }}
      className={cn(
        "pointer-events-none absolute h-px w-24 rotate-[-25deg] animate-shoot bg-gradient-to-r from-transparent via-white to-transparent opacity-0",
        className,
      )}
    />
  );
}

/** Kept for compatibility: a faint nebula puff on dark backgrounds. */
export function Cloud({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block h-16 w-28 rounded-full bg-secondary/20 blur-2xl", className)} />;
}

/** Scattered twinkling stars for hero sections (decorative only). */
export function StarField({ className }: { className?: string }) {
  const stars = [
    { x: "8%", y: "20%", s: "size-3", d: "0s", c: "text-accent" },
    { x: "22%", y: "70%", s: "size-2", d: "1s", c: "text-secondary" },
    { x: "48%", y: "12%", s: "size-2.5", d: "0.5s", c: "text-primary" },
    { x: "62%", y: "55%", s: "size-2", d: "2.2s", c: "text-white" },
    { x: "70%", y: "78%", s: "size-3", d: "1.6s", c: "text-accent" },
    { x: "90%", y: "30%", s: "size-2", d: "0.8s", c: "text-secondary" },
  ];
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {stars.map((st, i) => (
        <span key={i} className={cn("absolute animate-twinkle drop-shadow-[0_0_6px_currentColor]", st.c)} style={{ left: st.x, top: st.y, animationDelay: st.d }}>
          <Sparkle className={st.s} />
        </span>
      ))}
      <ShootingStar className="top-[18%] left-[30%]" delay="1.5s" />
      <ShootingStar className="top-[60%] left-[60%]" delay="5s" />
    </div>
  );
}
