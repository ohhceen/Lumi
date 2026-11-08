import { cn } from "@/lib/utils";

export type MascotMood = "happy" | "wink" | "worried" | "sleepy" | "excited";

/**
 * "Bibo" — MyMoney Buddy's original mascot: a round little blue alien from a
 * savings planet, with two star-tipped antennae and a purple belly coin.
 */
export function Mascot({ mood = "happy", className, title = "Bibo, maskot MyMoney Buddy" }: { mood?: MascotMood; className?: string; title?: string }) {
  const eyes = () => {
    switch (mood) {
      case "wink":
        return (
          <>
            <Eye cx={47} />
            <path d="M70 58 q7 -6 14 0" stroke="#1d2a3d" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case "sleepy":
        return (
          <>
            <path d="M40 60 q7 5 14 0" stroke="#1d2a3d" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M70 60 q7 5 14 0" stroke="#1d2a3d" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case "worried":
        return (
          <>
            <Eye cx={47} small />
            <Eye cx={77} small />
            <path d="M38 44 l14 4" stroke="#1d2a3d" strokeWidth="3" strokeLinecap="round" />
            <path d="M86 44 l-14 4" stroke="#1d2a3d" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <Eye cx={47} />
            <Eye cx={77} />
          </>
        );
    }
  };

  const mouth = () => {
    switch (mood) {
      case "worried":
        return <path d="M53 80 q9 -6 18 0" stroke="#1d2a3d" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      case "sleepy":
        return <ellipse cx="62" cy="80" rx="4" ry="3" fill="#1d2a3d" />;
      case "excited":
        return <path d="M50 74 q12 16 24 0 z" fill="#1d2a3d" stroke="#1d2a3d" strokeWidth="2" strokeLinejoin="round" />;
      default:
        return <path d="M51 75 q11 10 22 0" stroke="#1d2a3d" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    }
  };

  return (
    <svg viewBox="0 0 124 132" role="img" aria-label={title} className={cn("select-none drop-shadow-[0_0_18px_rgba(142,197,247,0.45)]", className)}>
      {/* antennae */}
      <path d="M46 26 Q40 12 30 8" stroke="#5fa6ea" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M78 26 Q84 12 94 8" stroke="#5fa6ea" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Star x={30} y={8} />
      <Star x={94} y={8} />
      {/* little feet */}
      <ellipse cx="44" cy="122" rx="13" ry="7" fill="#5fa6ea" />
      <ellipse cx="80" cy="122" rx="13" ry="7" fill="#5fa6ea" />
      {/* side nubs (arms) */}
      <ellipse cx="13" cy="80" rx="9" ry="13" fill="#7cb9f2" transform="rotate(-20 13 80)" />
      <ellipse cx="111" cy="80" rx="9" ry="13" fill="#7cb9f2" transform="rotate(20 111 80)" />
      {/* body */}
      <circle cx="62" cy="72" r="50" fill="#7cb9f2" />
      <circle cx="58" cy="67" r="45" fill="#8ec5f7" />
      <ellipse cx="44" cy="44" rx="16" ry="10" fill="#bfe0ff" opacity="0.8" transform="rotate(-25 44 44)" />
      {/* belly coin */}
      <ellipse cx="62" cy="103" rx="16" ry="11" fill="#c8b5f5" />
      <text x="62" y="108" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7f62d6" fontFamily="var(--font-poppins), sans-serif">Rp</text>
      {/* cheeks */}
      <ellipse cx="34" cy="74" rx="7" ry="4.5" fill="#f49a9a" opacity="0.6" />
      <ellipse cx="90" cy="74" rx="7" ry="4.5" fill="#f49a9a" opacity="0.6" />
      {eyes()}
      {mouth()}
      {mood === "worried" ? <path d="M98 42 q4 8 0 11 q-4 -3 0 -11z" fill="#bfe0ff" stroke="#5fa6ea" strokeWidth="1.5" /> : null}
    </svg>
  );
}

function Eye({ cx, small = false }: { cx: number; small?: boolean }) {
  const r = small ? 7 : 9;
  return (
    <g>
      <ellipse cx={cx} cy={58} rx={r} ry={r + 2} fill="#1d2a3d" />
      <circle cx={cx + 3} cy={54} r={small ? 2.2 : 3} fill="#fff" />
      <circle cx={cx - 3} cy={62} r={1.4} fill="#fff" opacity="0.8" />
    </g>
  );
}

function Star({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x - 8} ${y - 8})`}
      d="M8 0 L10 5.6 L16 6 L11.3 9.6 L13 16 L8 12.4 L3 16 L4.7 9.6 L0 6 L6 5.6 Z"
      fill="#ffe39a"
      stroke="#e8be4a"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  );
}
