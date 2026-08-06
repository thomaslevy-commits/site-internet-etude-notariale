import type { Config } from "tailwindcss";

/**
 * Design tokens — CLAUDE.md §5. Seule source de vérité chromatique.
 * Aucune couleur arbitraire hors de ces tokens.
 * gold : accents décoratifs uniquement (filets, puces, icônes) — 3:1 sur ivory.
 * gold-ink : variante assombrie réservée aux textes dorés sur fonds clairs
 * (5,6:1 sur ivory, conforme WCAG AA).
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
        "gold-ink": "#77613A",
        line: "#E4DED4",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        grid: "1200px",
      },
      /**
       * Balancement du panonceau suspendu (accueil) : oscillation amortie de
       * quelques secondes, répétée toutes les 15 s. Amplitude ≤ 1,6° — un
       * frémissement, pas un mouvement. Appliqué via motion-safe uniquement.
       */
      keyframes: {
        balancier: {
          "0%, 26%, 100%": { transform: "rotate(0deg)" },
          "4%": { transform: "rotate(1.6deg)" },
          "9%": { transform: "rotate(-1.1deg)" },
          "14%": { transform: "rotate(0.6deg)" },
          "19%": { transform: "rotate(-0.25deg)" },
          "23%": { transform: "rotate(0.1deg)" },
        },
      },
      animation: {
        balancier: "balancier 15s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
