/**
 * The single colour source for the whole site. `app/layout.tsx` emits these as
 * CSS custom properties, so the HUD and the WebGL world are never two palettes
 * drifting apart.
 *
 * Colour carries meaning here rather than decoration — each accent marks a
 * state, and no more than two accents share the screen at once.
 */
export const palette = {
  /** Deep void the world sits in. */
  void: "#0A0C0F",
  /** Surfaces: floors, walls, slabs. */
  surface: "#14181D",
  /** Structure: edges, grid, architectural line work. */
  structure: "#2A3138",
  /** Dimmed structure, for anything not yet built or out of focus. */
  structureDim: "#1C2228",
  /** Type, projected or engraved. */
  text: "#E6EAEE",
  textMuted: "#8A949F",

  /** State: focus, hover, selection. Inherited from the previous CV's blue. */
  active: "#4DA3FF",
  /** State: data in motion — pipelines, requests, queries. */
  data: "#3FBFA8",
  /** State: infrastructure. */
  cloud: "#8AA6C4",
  /** State: the AI lab and its agent. */
  ai: "#A98BFF",
  /** State: the human validation checkpoint. Used sparingly, on purpose. */
  alert: "#FF6B57",
} as const;

export type PaletteKey = keyof typeof palette;

/** `--color-active: #4DA3FF; …` for the stylesheet. */
export function paletteAsCssVariables(): string {
  return Object.entries(palette)
    .map(([key, value]) => `--color-${toKebab(key)}: ${value};`)
    .join("\n  ");
}

function toKebab(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
