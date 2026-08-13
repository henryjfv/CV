import coreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Flat config. `next lint` was removed in Next 16, so `npm run lint` calls
 * ESLint directly and this file is what it reads.
 */
const config = [
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
  ...coreWebVitals,
];

export default config;
