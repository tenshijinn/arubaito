// Shared aesthetic tokens — mirror /aesthetics page
export const CREAM = "#faf1e1";
export const PAPER = "#f5ead7";
export const SURFACE = "#efe2c9";
export const CONCRETE = "#e3d4b6";
export const INK = "#181818";
export const GRAPHITE = "#2a2a2a";
export const MUTED = "rgba(24,24,24,0.55)";
export const BORDER = "rgba(24,24,24,0.18)";
export const ACCENT = "#ed565a";

export const SANS = "'Consolas', 'IBM Plex Mono', monospace";
export const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
export const MONO = "'Consolas', 'IBM Plex Mono', monospace";

export const cardStyle = (inverted = false) => ({
  background: inverted ? INK : "transparent",
  border: `1.5px solid ${inverted ? "rgba(239,226,201,0.18)" : BORDER}`,
  borderRadius: 20,
});

export const labelStyle = (inverted = false) => ({
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: inverted ? "rgba(239,226,201,0.55)" : MUTED,
});

export const pillButtonStyle = (variant: "primary" | "outline" | "accent" = "primary") => {
  if (variant === "accent") return { background: ACCENT, color: PAPER, fontFamily: SANS };
  if (variant === "outline") return { background: "transparent", color: INK, border: `1.5px solid ${INK}`, fontFamily: SANS };
  return { background: INK, color: CREAM, fontFamily: SANS };
};
