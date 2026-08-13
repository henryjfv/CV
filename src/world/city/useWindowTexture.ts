"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { windows } from "../engine/palette";
import { hashUnit } from "./hash";

/**
 * The window grid, as one small canvas per building family.
 *
 * This is the highest-yield detail in the whole city per line of code, and it
 * only works if two things hold:
 *
 *  - **A window is the same size everywhere.** The tiers are extruded at true
 *    size, so `ExtrudeGeometry` writes its UVs in world units and one repeat
 *    fits every building. A three-metre window on a twenty-two-metre tower next
 *    to an eight-metre window on a low block is spotted instantly, even by
 *    someone who could not say what was wrong.
 *  - **No two windows blink together.** Each cell carries its own period and
 *    its own offset, so the grid never pulses. Cells switching in unison do not
 *    read as a city at all — they read as a render bug.
 *
 * Textures are shared by family and lit fraction: two buildings with the same
 * façade and the same amount of life in them get the same grid, which is eight
 * canvases at most and usually four.
 */

/** Cells in one tile of the texture. */
const COLS = 8;
const ROWS = 16;
/** Pixels per cell. 8×8 is enough for a lit rectangle with a frame around it. */
const CELL = 8;

/** World size of one cell — the actual size of a window, in metres. */
const BAY = 3;
const FLOOR = 3.2;

/** How many of the lit cells are allowed to flicker at all. */
const BLINKING_SHARE = 0.1;
/** A minority of lit cells burn colder, so the grid is not one flat colour. */
const WARM_SHARE = 0.15;

const TICK_MS = 480;

type Grid = {
  texture: THREE.CanvasTexture;
  context: CanvasRenderingContext2D;
  /** Indices allowed to flicker, and the state of every cell. */
  blinkers: number[];
  lit: boolean[];
  key: string;
};

const grids = new Map<string, Grid>();
/** One timer for the whole city, not one per building. */
let timer: ReturnType<typeof setInterval> | null = null;
let tick = 0;

function cellColour(index: number, key: string, on: boolean): string {
  if (!on) return windows.dark;
  return hashUnit(`${key}:warm:${index}`) < WARM_SHARE
    ? windows.litWarm
    : windows.lit;
}

function paint(grid: Grid, index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  grid.context.fillStyle = cellColour(index, grid.key, grid.lit[index]);
  // Inset by a pixel on each side: the gap is the mullion, and without it the
  // grid is a solid field of colour rather than a set of windows.
  grid.context.fillRect(col * CELL + 1, row * CELL + 1, CELL - 2, CELL - 3);
}

function createGrid(key: string, litFraction: number): Grid {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("window texture: no 2d context");

  // The mullion grid behind the cells.
  context.fillStyle = "#20283a";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const count = COLS * ROWS;
  const lit: boolean[] = [];
  const blinkers: number[] = [];
  for (let i = 0; i < count; i += 1) {
    lit.push(hashUnit(`${key}:lit:${i}`) < litFraction);
    if (lit[i] && hashUnit(`${key}:blink:${i}`) < BLINKING_SHARE) {
      blinkers.push(i);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // UVs arrive in world units, so the repeat is the inverse of how much world
  // one tile covers. Nothing here depends on the size of the building.
  texture.repeat.set(1 / (COLS * BAY), 1 / (ROWS * FLOOR));
  texture.colorSpace = THREE.SRGBColorSpace;
  // Windows are small and seen at a glancing angle down the avenue; without
  // this the far façades turn into grey mush.
  texture.anisotropy = 4;
  texture.magFilter = THREE.NearestFilter;

  const grid: Grid = { texture, context, blinkers, lit, key };
  for (let i = 0; i < count; i += 1) paint(grid, i);
  texture.needsUpdate = true;
  return grid;
}

/**
 * Flips a handful of cells across the whole city.
 *
 * Each blinker has its own period, taken from its index, so a cell that
 * switches on this tick may not switch again for four. Picking cells at random
 * every tick would give the same *count* of changes and none of the rhythm.
 */
function advance() {
  tick += 1;
  for (const grid of grids.values()) {
    let changed = false;
    let budget = 3;
    for (const index of grid.blinkers) {
      if (budget === 0) break;
      const period = 3 + Math.floor(hashUnit(`${grid.key}:period:${index}`) * 9);
      const offset = Math.floor(hashUnit(`${grid.key}:offset:${index}`) * period);
      if ((tick + offset) % period !== 0) continue;
      grid.lit[index] = !grid.lit[index];
      paint(grid, index);
      changed = true;
      budget -= 1;
    }
    if (changed) grid.texture.needsUpdate = true;
  }
}

function ensureTimer(animate: boolean) {
  if (!animate || timer !== null) return;
  // A `setInterval`, not the frame loop: repainting a canvas and re-uploading a
  // texture sixty times a second to change one pixel is the definition of work
  // for nothing, and the flicker is not meant to be frame-accurate anyway.
  timer = setInterval(advance, TICK_MS);
}

/**
 * Returns the shared grid for a façade family, cutting it on first use.
 *
 * Built during render rather than in an effect: the canvas only ever exists on
 * the client — the whole scene is mounted behind a dynamic import with `ssr:
 * false` — and taking it an effect later would mean every building rendered
 * once with a blank façade before its windows arrived.
 */
export function useWindowTexture(
  family: string,
  litFraction: number,
  animate: boolean
): THREE.CanvasTexture {
  // Bucketed so two buildings with 0.18 and 0.20 activity share one canvas
  // instead of each cutting their own.
  const key = `${family}:${Math.round(litFraction * 20)}`;

  const texture = useMemo(() => {
    let grid = grids.get(key);
    if (!grid) {
      grid = createGrid(key, litFraction);
      grids.set(key, grid);
    }
    return grid.texture;
  }, [key, litFraction]);

  useEffect(() => {
    ensureTimer(animate);
  }, [animate]);

  return texture;
}
