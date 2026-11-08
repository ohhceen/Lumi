// Chart colours (validated with the dataviz palette validator, light mode):
// income/expense pair passes lightness, chroma, CVD (ΔE 11.3) and normal-vision checks.
// Contrast vs surface is < 3:1 for the coral, so every chart ships with a legend,
// tooltips and the exact numbers in adjacent cards/lists.
export const SERIES = {
  income: "#17825d",
  expense: "#f28b6e",
  net: "#4a9be8",
} as const;

// Fixed categorical order (never cycled). 7th+ categories fold into "Lainnya".
export const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"] as const;
export const OTHER_COLOR = "#a3abb8";

export const AXIS = {
  stroke: "#94a1b4",
  fontSize: 11,
  fontWeight: 700,
  fontFamily: "var(--font-nunito), sans-serif",
} as const;

export const GRID = "#ece4d6";
