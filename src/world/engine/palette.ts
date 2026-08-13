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

/**
 * Façades, by technology lineage. Kept out of `palette` itself because these
 * never reach the HUD: the stylesheet takes its variables from the object
 * above, and a wall colour is not a state.
 *
 * All five are light. The whole point of a sunset city is that the buildings
 * catch the low sun on one face, hold the sky on another and fall into the
 * hemisphere light on the third — and a dark façade catches none of it. The
 * three tones per volume come from the light, not from painting the faces.
 */
export const facade = {
  cream: "#e3d5bd",
  paleBlue: "#c8daed",
  sage: "#c9dcd1",
  terracotta: "#e8bda9",
  /** Archived work. The one colour here that is not warm. */
  legacy: "#b3b8c2",
} as const;

/** Cornices, mullions, rooftop plant: the trim that gives a volume its edges. */
export const TRIM = "#8b8275";

export const windows = {
  lit: "#ffd489",
  /** A minority of cells, so the grid does not read as one printed texture. */
  litWarm: "#fff0c4",
  dark: "#4e5a72",
};

/**
 * The sky, top to horizon. Four stops rather than two: a single ramp from navy
 * to orange goes through a muddy brown in the middle, and the violet band is
 * what keeps it looking like dusk.
 */
export const sky = {
  zenith: "#151c36",
  upper: "#39406a",
  lower: "#8a6a7c",
  horizon: "#b8836e",
};

/** `--color-active: #4DA3FF; …` for the stylesheet. */
export function paletteAsCssVariables(): string {
  return Object.entries(palette)
    .map(([key, value]) => `--color-${toKebab(key)}: ${value};`)
    .join("\n  ");
}

function toKebab(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
