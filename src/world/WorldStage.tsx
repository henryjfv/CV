"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Hud } from "@/hud/Hud";
import { detectQuality, type QualitySettings } from "./engine/quality";
import { resetJourney } from "./engine/journey";
import { useJourneyInput } from "./engine/useJourneyInput";

// Three.js and the scene are ~150 KB gzip that a text-mode visitor never needs,
// so the canvas is its own chunk fetched only when the world is entered.
const WorldCanvas = dynamic(
  () => import("./WorldCanvas").then((mod) => mod.WorldCanvas),
  { ssr: false }
);

type Mode = "world" | "text";

/**
 * Decides whether this visitor gets the world, and owns the switch between the
 * two layers.
 *
 * The first decision was already taken by the inline script in `layout.tsx`,
 * before React ran — that is what lets the boot screen cover the page from the
 * first paint instead of flashing the text CV. This component confirms it with
 * the fuller capability check and then keeps the two in sync.
 */
export function WorldStage() {
  // Both are settled on the first render rather than in an effect. This
  // component is mounted through `WorldStageLoader`, which keeps it off the
  // server, so `window` is always there and there is no hydration to match —
  // and detecting in an effect would only buy a second render pass that
  // repaints the whole stage.
  const [quality] = useState<QualitySettings>(detectQuality);
  const [mode, setMode] = useState<Mode>(() =>
    document.documentElement.dataset.mode === "world" && quality.tier !== "none"
      ? "world"
      : "text"
  );

  useEffect(() => {
    // Tells the layout's safety timer to stand down: from here on, this
    // component decides which layer the visitor gets.
    document.documentElement.dataset.react = "1";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    // Nothing is going to render into the canvas in text mode, so the cover has
    // nothing to wait for — on first load and on every later switch alike.
    if (mode === "text") finishBoot();
  }, [mode]);

  // A canvas that never reports back — WebGL context lost on creation, a driver
  // that hangs — would otherwise leave the cover up for good.
  useEffect(() => {
    if (mode !== "world") return;
    const timer = window.setTimeout(() => {
      if (document.documentElement.dataset.boot !== "done") setMode("text");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [mode]);

  useJourneyInput(mode === "world");

  const enterWorld = useCallback(() => {
    resetJourney();
    setMode("world");
  }, []);

  const exitToText = useCallback(() => {
    setMode("text");
    // Leaving the world has to take the keyboard with it, or focus is left on a
    // button that no longer exists and the next Tab starts from the top.
    requestAnimationFrame(() => {
      document.getElementById("resume")?.focus();
    });
  }, []);

  if (mode === "text") {
    // The offer to enter is only shown to devices that can actually deliver it.
    if (quality.tier === "none") return null;
    return (
      <div className="stage-invite">
        <button type="button" className="stage-invite__button" onClick={enterWorld}>
          Enter the world
        </button>
      </div>
    );
  }

  return (
    <div className="world-stage">
      <WorldCanvas quality={quality} onReady={finishBoot} />
      <Hud onExitToText={exitToText} />
    </div>
  );
}

/** Fades out the server-rendered cover once there is something behind it. */
function finishBoot() {
  document.documentElement.dataset.boot = "done";
}
