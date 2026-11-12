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
  /**
   * Les MDX de `content/` accompagnent chaque fonction serveur.
   *
   * Sur Vercel, chaque route rendue à la demande devient une fonction qui
   * n'embarque que les fichiers que le traçage de Next a su rattacher à sa
   * page. Le layout lit `content/` à chaque rendu (index de la recherche
   * globale, `construireIndexRecherche`), mais le traçage ne rattache ces
   * fichiers qu'aux pages qui importent elles-mêmes `@/lib/content`. La page
   * Contact, seule page rendue à la demande (elle lit `?sujet=`), partait donc
   * sans eux : `ENOENT` sur le premier MDX lu, et « Application error » servie
   * aux visiteurs depuis l'ajout de la recherche (22 septembre 2026),
   * constaté le 12 novembre 2026. Reproduit hors Vercel en retirant `content/`
   * d'une construction autonome : /contact répond 500, les pages statiques 200.
   * Déclarer le dossier pour toutes les routes ferme la porte pour toute page
   * dynamique à venir.
   */
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
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
