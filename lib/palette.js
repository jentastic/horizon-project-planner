// Shared colour palette. Keep in sync with the :root block in app/globals.css.

export const PALETTE = [
  { name: "Yale Blue", hex: "#174b63" },
  { name: "Pacific Cyan", hex: "#268c9e" },
  { name: "Tropical Teal", hex: "#36adaf" },
  { name: "Ash Grey", hex: "#b3d1c7" },
  { name: "Sand Dune", hex: "#e2dac2" },
  { name: "Golden Bronze", hex: "#d5a751" },
  { name: "Bronze", hex: "#ce853b" },
  { name: "Spicy Paprika", hex: "#c96334" },
  { name: "Blushed Brick", hex: "#be4d43" },
  { name: "Dusty Mauve", hex: "#b04d50" },
];

// Colours dark enough to carry white text on a badge.
export const BADGE_SAFE = PALETTE.filter(
  (c) => !["Ash Grey", "Sand Dune"].includes(c.name)
).map((c) => c.hex);

// UI roles, mirrored from the CSS custom properties.
export const UI = {
  ink: "#174b63",
  muted: "#6b7f88",
  line: "#ded7c8",
  overdue: "#b04d50",
  accent: "#268c9e",
};
