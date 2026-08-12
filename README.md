# CV — Henry Fernández

Personal CV published at <https://henryjfv.github.io/CV/>.

Vue 3 single-page app built with Vue CLI. All content lives in
[`src/data/resume.js`](src/data/resume.js) and is rendered with `v-for`, so a
copy change never touches a template.

## Where things are

| What | Where |
| --- | --- |
| CV content (profile, experience, skills, certifications) | `src/data/resume.js` |
| Markup | `src/components/Portafolio.vue` |
| SEO, Open Graph, JSON-LD, `<noscript>` fallback | `public/index.html` |
| Project styles + print sheet | `src/assets/css/custom.css` |
| Vendored Bootstrap 5.1.3 + Start Bootstrap Resume theme | `src/assets/css/styles.css` |
| Open Graph card (1200×630) | `public/og-image.png` |

## Setup

```
npm install
```

## Develop

```
npm run serve
```

## Build

```
npm run build
```

Output lands in `dist/`. Note that `vue.config.js` sets `publicPath: "/CV/"`,
so opening `dist/index.html` directly, or serving `dist/` at the root of a
local server, renders a blank page — the assets are requested from `/CV/`.
To preview the production build the way GitHub Pages serves it:

```
mkdir -p /tmp/preview/CV && cp -R dist/* /tmp/preview/CV/
(cd /tmp/preview && python3 -m http.server 8080)
# then open http://localhost:8080/CV/
```

## Deploy to GitHub Pages

```
npm run deploy
```

This runs [`deploy.bat`](deploy.bat): builds, initialises a throwaway repo
inside `dist/`, and force-pushes it to the `gh-pages` branch, which is what
GitHub Pages serves. The publication URL does not change.

Deployment pushes over SSH, so the machine needs a key registered at
<https://github.com/settings/keys>. Generate it **outside this repository**:

```
ssh-keygen -t ed25519 -f ~/.ssh/gh_cv
```

Never commit a private key. `.gitignore` blocks the usual filenames.

## After changing content

Open Graph previews are cached by each platform. To refresh them after a
deploy:

- LinkedIn — <https://www.linkedin.com/post-inspector/>
- Facebook / WhatsApp — <https://developers.facebook.com/tools/debug/>

## PDF

The "Download PDF" button calls `window.print()`. The print sheet at the
bottom of `src/assets/css/custom.css` hides the navigation, buttons and social
icons, and collapses the full-viewport section heights the theme uses on
screen. There is no PDF file to keep in sync.
