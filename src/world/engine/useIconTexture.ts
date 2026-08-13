"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { ICON_VIEWBOX, iconPaths, layerIconPaths } from "./icon-paths";

/**
 * Rasterises a glyph into a texture, cached and shared.
 *
 * Same reasoning as the text textures: the set of glyphs is small and fixed,
 * every node that uses one uses exactly the same one, and building them at the
 * moment a station comes into view is a visible hitch. Nothing is disposed on
 * unmount — a node that scrolls out of view will be back.
 *
 * `Path2D` takes SVG path data directly, so the glyphs stay as the strings they
 * were authored as rather than being converted into drawing calls.
 */
const cache = new Map<string, THREE.CanvasTexture>();

/** Rendered at this many pixels square, then scaled down by the GPU. */
const RESOLUTION = 128;

export function iconPathFor(name: string, layerId: string): string {
  return iconPaths[name] ?? layerIconPaths[layerId] ?? layerIconPaths.service;
}

function render(key: string, path: string, color: string): THREE.CanvasTexture | null {
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = RESOLUTION;
  canvas.height = RESOLUTION;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // A little inset, so a glyph that fills its 24×24 box does not touch the
  // edge of the node it sits on.
  const inset = RESOLUTION * 0.14;
  const scale = (RESOLUTION - inset * 2) / ICON_VIEWBOX;
  ctx.translate(inset, inset);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  try {
    ctx.fill(new Path2D(path));
  } catch {
    // A malformed path should cost one blank node, not the whole scene.
    return null;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

export function useIconTexture(
  path: string,
  color: string
): THREE.CanvasTexture | null {
  const key = `${path}|${color}`;
  // Unlike the text textures, nothing here waits on a webfont, so there is no
  // reason to draw in an effect and rerender: the glyph is ready on the first
  // render. The cache makes the call idempotent — asking twice hands back the
  // same texture rather than drawing a second one.
  return useMemo(() => render(key, path, color), [key, path, color]);
}
