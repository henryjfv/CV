# CV — Henry Fernández

Personal CV published at <https://henryjfv.github.io/CV/>.

The site is a 3D world you walk through, with the written CV underneath it as a
first-class layer rather than a fallback. Next.js (App Router) + React Three
Fiber, exported as static files for GitHub Pages.

The design brief, the content audit behind it and the phase plan live in
[`docs/engineers-journey.md`](docs/engineers-journey.md). Read that before
changing anything structural.

## Where things are

| What | Where |
| --- | --- |
| CV content — the single source of truth | `src/data/resume.ts` |
| How the CV maps onto the world (stations, stages, zones) | `src/data/world.ts` |
| The 3D world | `src/world/` |
| Scene-independent engine (camera rail, quality tiers, text textures) | `src/world/engine/` |
| The career stations and how they grow | `src/world/zones/Journey/Station.tsx` |
| The written CV | `src/text/ResumeDocument.tsx` |
| HUD | `src/hud/` |
| SEO, Open Graph, JSON-LD, colour tokens, boot script | `app/layout.tsx` |
| Styles, including the print sheet | `app/globals.css` |
| Open Graph card (1200×630) | `public/og-image.png` |

Content never lives in a component. `resume.ts` holds it; `world.ts` says where
it goes in 3D; everything else renders it.

## Two layers, one content

Both layers are in the served HTML:

- **The world** — WebGL, entered by default on capable devices.
- **The written CV** — a Server Component, so it is what crawlers read, what
  `window.print()` formats, and what anyone without WebGL2 gets.

An inline script in `app/layout.tsx` picks the layer before first paint, so the
document never flashes behind the world. The visitor can switch either way at
any time: "Read as text" in the HUD, "Enter the world" in the document. Reduced
motion, no WebGL2, or a bundle that fails to arrive all land on the document.

## Setup

```
npm install
```

## Develop

```
npm run dev
```

Open <http://localhost:3000/CV> — **not** `localhost:3000`. `basePath` is set in
development too, so the dev URL has the same shape as production and path bugs
surface before deploy rather than after.

## Build

```
npm run build
```

Output lands in `out/`. To preview it the way GitHub Pages serves it:

```
mkdir -p /tmp/preview/CV && cp -R out/* /tmp/preview/CV/
(cd /tmp/preview && python3 -m http.server 8080)
# then open http://localhost:8080/CV/
```

## Deploy to GitHub Pages

```
npm run deploy
```

This runs [`deploy.bat`](deploy.bat): builds, writes `.nojekyll`, initialises a
throwaway repo inside `out/` and force-pushes it to the `gh-pages` branch. The
publication URL does not change.

Three things in `next.config.ts` are what make Pages work, and dropping any of
them serves a blank page:

- `output: "export"` — Pages has no Node server.
- `basePath: "/CV"` — the site is not at the domain root.
- `images: { unoptimized: true }` — the image optimizer needs a server.

And `.nojekyll`, written by the deploy script: Jekyll skips directories starting
with an underscore, which would drop all of `_next/`.

Deployment pushes over SSH, so the machine needs a key registered at
<https://github.com/settings/keys>. Generate it **outside this repository**:

```
ssh-keygen -t ed25519 -f ~/.ssh/gh_cv
```

Never commit a private key. `.gitignore` blocks the usual filenames.

## Content rules

These are not style preferences. They are why the file reads the way it does:

- **No client names.** Engagements are described by the problem they solved.
- **No invented metrics.** An unverified number is not written.
- **`cert1.png` and `cert2.png` are never published.** Both show a national ID
  number. They are deliberately not imported anywhere, so the bundler cannot
  emit them, and the certificates they belong to are listed as text only.
- **No plain `mailto:` in the markup.** The address is assembled on click.

## After changing content

Open Graph previews are cached by each platform. To refresh them after a deploy:

- LinkedIn — <https://www.linkedin.com/post-inspector/>
- Facebook / WhatsApp — <https://developers.facebook.com/tools/debug/>

## PDF

The "Download PDF" button calls `window.print()`. The print sheet at the bottom
of `app/globals.css` hides the world, the HUD and the buttons, and forces the
written CV visible even when the world is on screen. There is no PDF file to
keep in sync.
