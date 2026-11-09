// Chart colours for the light Toy Story theme, validated with the dataviz
// palette validator in light mode:
// - income/expense pair (#17825d / #f28b6e): lightness band, chroma,
//   CVD (ΔE 11.3) and normal-vision checks pass. The coral is < 3:1 against
//   white, so every chart has a legend, tooltips and the exact numbers nearby.
// - categorical: the validated light-mode reference order.
export const SERIES = {
  income: "#17825d",
  expense: "#f28b6e",
  net: "#2a78d6",
} as const;

// Fixed categorical order (never cycled). 7th+ categories fold into "Lainnya".
export const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"] as const;
export const OTHER_COLOR = "#a3abb8";

export const SURFACE = "#ffffff"; // gap/ring colour between marks

export const AXIS = {
  stroke: "#74839a",
  fill: "#74839a",
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "var(--font-poppins), sans-serif",
} as const;

export const GRID = "#e3edf7";
export const CURSOR_FILL = "rgb(90 176 234 / 0.12)";
export const MUTED_LINE = "#4e5f78";
