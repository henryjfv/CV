import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { profile, skills, SITE_URL } from "@/data/resume";
import { paletteAsCssVariables } from "@/world/engine/palette";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

const description =
  "Senior Full Stack Engineer with 9+ years building scalable web and mobile " +
  "applications for banking, fintech, energy, healthcare and logistics — Node.js, " +
  "TypeScript, Python, Java, REST APIs and microservices on AWS and Azure.";

const title = `${profile.shortName} — ${profile.role}`;

/**
 * Open Graph and Twitter tags drive the link preview on LinkedIn, WhatsApp and
 * Slack. Those crawlers do not execute JavaScript, so the image URLs are
 * absolute rather than resolved against `basePath` at runtime.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  authors: [{ name: "Henry Fernández" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "profile",
    url: SITE_URL,
    title,
    description,
    siteName: profile.shortName,
    locale: "en_US",
    firstName: "Henry",
    lastName: "Fernández",
    images: [
      {
        url: `${SITE_URL}og-image.png`,
        width: 1200,
        height: 630,
        alt: `${profile.shortName} — ${profile.role}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${SITE_URL}og-image.png`],
  },
};

/**
 * Runs before React and before first paint. Two jobs:
 *  - mark that scripts are available, so the stylesheet can hide the text CV
 *    that non-JS visitors must keep seeing;
 *  - pick the layer this device gets, so the boot cover can be painted
 *    immediately instead of flashing the text CV for a few hundred milliseconds
 *    while the bundle loads.
 *
 * The timeout is the safety net for the case where React never arrives at all
 * — flaky network, a runtime error, an old browser. Nobody should be left
 * staring at a black screen with a name on it, so after six seconds the visitor
 * gets the written CV instead. Once `data-react` is set, the component owns the
 * decision and this timer stands down, which keeps the two from fighting.
 */
const bootScript = `(function(){var d=document.documentElement;d.dataset.js="1";try{var r=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var g=!!document.createElement("canvas").getContext("webgl2");d.dataset.mode=g&&!r?"world":"text";}catch(e){d.dataset.mode="text";}setTimeout(function(){if(d.dataset.boot!=="done"&&d.dataset.react!=="1"){d.dataset.boot="done";d.dataset.mode="text";}},6000);})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Henry Fernández",
  givenName: "Henry",
  familyName: "Fernández",
  jobTitle: profile.role,
  url: SITE_URL,
  image: `${SITE_URL}og-image.png`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Barranquilla",
    addressCountry: "CO",
  },
  sameAs: [profile.links.linkedin, profile.links.github],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Universidad Libre Seccional Barranquilla" },
    {
      "@type": "EducationalOrganization",
      name: "International Language Academy of Canada (ILAC)",
    },
  ],
  // Derived from the same list the site renders, so the structured data can
  // never fall behind the visible content.
  knowsAbout: skills.flatMap((group) => group.items),
  knowsLanguage: [
    { "@type": "Language", name: "Spanish" },
    { "@type": "Language", name: "English" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The boot script writes `data-js` and `data-mode` onto this element before
    // React hydrates — that is the whole point of it, and it is what stops the
    // written CV from flashing behind the world. React would otherwise report
    // those two attributes as a hydration mismatch on every load.
    <html
      lang="en"
      className={`${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style>{`:root {\n  ${paletteAsCssVariables()}\n}`}</style>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
