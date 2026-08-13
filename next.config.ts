import type { NextConfig } from "next";

/**
 * The site is published at https://henryjfv.github.io/CV/, so every asset and
 * link has to be prefixed with /CV. `basePath` already prefixes the `_next/`
 * assets on its own — adding `assetPrefix` on top of it would produce
 * /CV/CV/_next/... and serve a blank page.
 *
 * The prefix is kept in development too, so `npm run dev` reproduces the
 * production URL shape (http://localhost:3000/CV) instead of hiding path bugs
 * until deploy. Set NEXT_PUBLIC_BASE_PATH="" to serve from the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/CV";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files; there is no Node server to render on.
  output: "export",
  basePath,
  // The image optimizer needs a server, which a static export does not have.
  images: { unoptimized: true },
  // Emits out/<route>/index.html, which is what Pages resolves for a directory
  // URL. Without it, any route added later 404s.
  trailingSlash: true,
};

export default nextConfig;
