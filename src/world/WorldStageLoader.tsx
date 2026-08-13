"use client";

import dynamic from "next/dynamic";

/**
 * Keeps `WorldStage` off the server entirely.
 *
 * A Client Component is still prerendered during the static export, and the
 * stage decides which layer to show by reading `document` — so without this it
 * would either crash the build or have to guess on the server and correct
 * itself on the client, which is a hydration mismatch by construction.
 *
 * `ssr: false` cannot be used from a Server Component, hence this one-line
 * client boundary between `page.tsx` and the stage.
 */
const WorldStage = dynamic(
  () => import("./WorldStage").then((mod) => mod.WorldStage),
  { ssr: false }
);

export function WorldStageLoader() {
  return <WorldStage />;
}
