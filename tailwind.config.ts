import type { Config } from "tailwindcss";

/**
 * Design tokens — CLAUDE.md §5. Seule source de vérité chromatique.
 * Aucune couleur arbitraire hors de ces tokens.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}", "./content/**/*.mdx"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF7F2",
        paper: "#FFFFFF",
        night: "#101C2C",
        anthracite: "#2B2E33",
        "slate-soft": "#5A6472",
        gold: "#A98A4C",
        line: "#E4DED4",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        grid: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
