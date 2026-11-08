// Chart colours for the dark "galaxy" theme, validated with the dataviz
// palette validator against the card surface (#1b1940, dark mode):
// - income/expense pair: lightness band, chroma, CVD (ΔE 9.3), normal-vision
//   and contrast (>= 3:1) all pass.
// - categorical: the validated dark-mode reference order, all checks pass.
export const SERIES = {
  income: "#1baf7a",
  expense: "#d95926",
  net: "#3987e5",
} as const;

// Fixed categorical order (never cycled). 7th+ categories fold into "Lainnya".
export const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"] as const;
export const OTHER_COLOR = "#6b7096";

export const SURFACE = "#1d1a4a"; // gap/ring colour between marks

export const AXIS = {
  stroke: "#8a8fc0",
  fill: "#8a8fc0",
  fontSize: 11,
  fontWeight: 700,
  fontFamily: "var(--font-nunito), sans-serif",
} as const;

export const GRID = "rgb(170 160 255 / 0.14)";
export const CURSOR_FILL = "rgb(200 181 245 / 0.10)";
export const MUTED_LINE = "#b9bde6";
