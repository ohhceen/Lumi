import { cn } from "@/lib/utils";

/** Five-point yellow star. */
export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5 text-accent", className)}>
      <path
        d="M12 1.8l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 16.6l-5.9 3.3 1.3-6.6L2.5 8.7l6.6-.8z"
        fill="currentColor"
        stroke="#e2a800"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Kept for compatibility with earlier code: a small four-point sparkle. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
    </svg>
  );
}

/** Puffy white cloud. */
export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 64" aria-hidden className={cn("w-28", className)}>
      <path
        d="M20 58c-11 0-18-8-18-17s8-17 18-17c2-12 13-21 26-21 12 0 22 7 25 18 3-1 6-2 9-2 13 0 23 10 23 21 0 10-8 18-18 18z"
        fill="#ffffff"
        stroke="#d9e8f5"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Pastel ringed planet (space-ranger flavour, no glow). */
export function Planet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-12", className)}>
      <circle cx="32" cy="32" r="15" fill="#b9a7f0" />
      <circle cx="26" cy="27" r="3.5" fill="#a08ce6" />
      <circle cx="37" cy="38" r="2.2" fill="#a08ce6" />
      <ellipse cx="32" cy="34" rx="28" ry="7" fill="none" stroke="#ffd54f" strokeWidth="3.5" transform="rotate(-18 32 34)" />
    </svg>
  );
}

/** Classic wooden alphabet toy block. */
export function ToyBlock({ letter = "A", color = "#ef6b5f", className }: { letter?: string; color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-10", className)}>
      <rect x="3" y="3" width="42" height="42" rx="8" fill={color} />
      <rect x="9" y="9" width="30" height="30" rx="5" fill="#fff" opacity="0.92" />
      <text x="24" y="32.5" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} fontFamily="var(--font-poppins), sans-serif">
        {letter}
      </text>
    </svg>
  );
}

/** Kept for compatibility: small blue moon. */
export function Moon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-8", className)}>
      <circle cx="20" cy="20" r="14" fill="#8fd0f7" />
      <circle cx="15" cy="16" r="3" fill="#5ab0ea" />
      <circle cx="25" cy="25" r="2" fill="#5ab0ea" />
    </svg>
  );
}

/** Scattered twinkling stars for hero banners (decorative only). */
export function StarField({ className }: { className?: string }) {
  const stars = [
    { x: "6%", y: "14%", s: "size-4", d: "0s" },
    { x: "38%", y: "10%", s: "size-3", d: "1.2s" },
    { x: "56%", y: "22%", s: "size-3.5", d: "0.6s" },
    { x: "74%", y: "8%", s: "size-3", d: "1.8s" },
  ];
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {stars.map((st, i) => (
        <span key={i} className="absolute animate-twinkle" style={{ left: st.x, top: st.y, animationDelay: st.d }}>
          <Star className={st.s} />
        </span>
      ))}
    </div>
  );
}
