"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

type TextTextureOptions = {
  text: string;
  /** Height of the glyphs inside the generated canvas, in pixels. */
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  /** Tracking, as a fraction of the font size. Wide tracking reads as engraved. */
  tracking?: number;
  color?: string;
};

export type TextTexture = {
  texture: THREE.CanvasTexture;
  /** width / height of the generated canvas, for sizing the plane it lands on. */
  aspect: number;
};

/**
 * Rasterising type costs a canvas, a text measurement and a texture upload.
 * Doing that for eight labels at the instant the visitor arrives at a station
 * is a visible hitch — it was the stutter felt when moving between sections.
 *
 * So textures are cached and shared. The set of strings in this world is fixed
 * and small (technology names, years, stage labels), every label is identical
 * wherever it appears, and nothing here is ever disposed on unmount: a label
 * that scrolls out of view will be needed again on the way back.
 */
const cache = new Map<string, TextTexture>();

/** Resolved once the webfont is ready, so nothing is rasterised in a fallback face. */
let fontsReady: Promise<unknown> | null = null;

function whenFontsReady(): Promise<unknown> {
  if (!fontsReady) {
    fontsReady =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready
        : Promise.resolve();
  }
  return fontsReady;
}

function render(
  key: string,
  {
    text,
    fontSize,
    fontFamily,
    fontWeight,
    tracking,
    color,
  }: Required<TextTextureOptions>
): TextTexture | null {
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // The CSS custom property has to be resolved by hand: canvas fonts do not
  // inherit anything from the document.
  const resolvedFamily = resolveFontFamily(fontFamily);
  const font = `${fontWeight} ${fontSize}px ${resolvedFamily}`;
  const letterSpacing = `${fontSize * tracking}px`;

  ctx.font = font;
  ctx.letterSpacing = letterSpacing;
  const metrics = ctx.measureText(text);
  const padding = fontSize * 0.3;
  const width = Math.ceil(metrics.width + padding * 2);
  const height = Math.ceil(fontSize * 1.4 + padding * 2);

  canvas.width = width;
  canvas.height = height;

  // Resizing the canvas resets the context, so the state is set again.
  ctx.font = font;
  ctx.letterSpacing = letterSpacing;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const result = { texture, aspect: width / height };
  cache.set(key, result);
  return result;
}

/**
 * Renders type into a canvas and hands back a texture.
 *
 * Chosen over a 3D text library on purpose: those need a font file fetched at
 * runtime (or fall back to one from a CDN, which this site does not talk to),
 * and text projected onto a wall is exactly what a flat texture is for.
 */
export function useTextTexture(options: TextTextureOptions): TextTexture | null {
  const {
    text,
    fontSize = 200,
    fontFamily = "var(--font-display), system-ui, sans-serif",
    fontWeight = 500,
    tracking = 0.08,
    color = "#ffffff",
  } = options;

  const key = `${text}|${fontSize}|${fontWeight}|${tracking}|${color}`;

  // The cache is the source of truth, read during render. State here is only a
  // nudge to rerender once an absent texture has been rasterised — keeping the
  // texture itself in state would mean a second copy that can fall out of step
  // with the cache, and a setState on every cache hit.
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (cache.has(key)) return;

    let cancelled = false;
    whenFontsReady().then(() => {
      if (cancelled) return;
      const made = render(key, {
        text,
        fontSize,
        fontFamily,
        fontWeight,
        tracking,
        color,
      });
      if (made) setRevision((revision) => revision + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [key, text, fontSize, fontFamily, fontWeight, tracking, color]);

  return cache.get(key) ?? null;
}

function resolveFontFamily(family: string): string {
  const match = family.match(/var\((--[^)]+)\)/);
  if (!match || typeof document === "undefined") return family;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  return value ? family.replace(match[0], value) : family.replace(`${match[0]}, `, "");
}
