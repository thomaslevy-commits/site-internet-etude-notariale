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

/**
 * Redirections permanentes (§6 : toute modification d'URL en exige une).
 * /honoraires est devenue /tarif — le mot « honoraires » ne désignait
 * qu'une des trois composantes du coût, à côté des émoluments et des
 * débours. L'ancienne adresse a été indexée : elle doit continuer de
 * répondre et transmettre son autorité à la nouvelle.
 */
const REDIRECTIONS = [
  { source: "/honoraires", destination: "/tarif", permanent: true },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(estExport
    ? {
        output: "export" as const,
        basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
        images: { unoptimized: true },
      }
    : {
        // Comme headers(), redirects() est sans effet sur un export statique :
        // les redirections y relèvent du serveur web.
        async redirects() {
          return REDIRECTIONS;
        },
      }),
};

export default nextConfig;
