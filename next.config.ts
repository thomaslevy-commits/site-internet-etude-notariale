import type { NextConfig } from "next";

/**
 * Export statique conditionnel : activé par NEXT_OUTPUT=export pour le
 * déploiement GitHub Pages (prévisualisation). La cible de production
 * demeure Vercel (CLAUDE.md §4), sans export ni basePath.
 *
 * Les en-têtes de sécurité ne sont volontairement PAS déclarés ici : leur
 * source unique est vercel.json, appliqué par la plateforme de production
 * et couvrant aussi les fichiers statiques. Déclarer des en-têtes aux deux
 * endroits fait envoyer deux politiques concurrentes, dont le navigateur
 * applique l'intersection — une directive assouplie d'un côté reste alors
 * bloquée par l'autre, sans erreur visible.
 */
const estExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(estExport
    ? {
        output: "export" as const,
        basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
