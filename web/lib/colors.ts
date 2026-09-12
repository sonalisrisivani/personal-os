// ─── Deterministic Color Palette & Utilities ────────────────────────────────

export interface ColorScheme {
  hex: string;       // Primary solid color (dots, borders, badges)
  bg: string;        // Soft background tint for pills/tags
  border: string;    // Light border
  text: string;      // Readable text color on light/tint backgrounds
}

const PALETTE: ColorScheme[] = [
  { hex: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" }, // Indigo
  { hex: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8", text: "#be185d" }, // Pink
  { hex: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" }, // Emerald
  { hex: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#b45309" }, // Amber
  { hex: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" }, // Purple
  { hex: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc", text: "#0e7490" }, // Cyan
  { hex: "#f97316", bg: "#fff7ed", border: "#ffedd5", text: "#c2410c" }, // Orange
  { hex: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4", text: "#0f766e" }, // Teal
  { hex: "#e11d48", bg: "#fff1f2", border: "#fecdd3", text: "#be123c" }, // Rose
  { hex: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" }, // Blue
  { hex: "#84cc16", bg: "#f7fee7", border: "#d9f99d", text: "#4d7c0f" }, // Lime
  { hex: "#a855f7", bg: "#faf5ff", border: "#e9d5ff", text: "#7e22ce" }, // Violet
];

export function getEntityColor(id?: string | null): ColorScheme {
  if (!id) {
    return {
      hex: "#6b7280",
      bg: "#f3f4f6",
      border: "#e5e7eb",
      text: "#374151",
    };
  }

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}
