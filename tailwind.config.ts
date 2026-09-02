import type { Config } from "tailwindcss";

/**
 * Design tokens — CLAUDE.md §5. Seule source de vérité chromatique.
 * Aucune couleur arbitraire hors de ces tokens.
 * gold : accents décoratifs uniquement (filets, puces, icônes) — 3:1 sur ivory.
 * gold-ink : variante assombrie réservée aux textes dorés sur fonds clairs
 * (5,6:1 sur ivory, conforme WCAG AA).
 * line-strong : variante assombrie de line, réservée aux limites des
 * composants de saisie. line ne vaut que 1,34:1 sur paper, quand le critère
 * WCAG 1.4.11 en exige 3 pour la bordure qui identifie un champ ;
 * line-strong donne 3,35:1 sur paper et 3,14:1 sur ivory. Les filets et
 * séparateurs décoratifs restent en line, non concernés par ce critère.
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
        "line-strong": "#978B74",
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
