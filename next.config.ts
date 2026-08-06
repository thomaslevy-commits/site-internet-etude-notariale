import type { NextConfig } from "next";

/**
 * Export statique conditionnel : activé par NEXT_OUTPUT=export pour le
 * déploiement GitHub Pages (prévisualisation). La cible de production
 * demeure Vercel (CLAUDE.md §4), sans export ni basePath.
 */
const estExport = process.env.NEXT_OUTPUT === "export";

/** Vrai uniquement sur le déploiement de production Vercel. */
const estProduction = process.env.VERCEL_ENV === "production";

/**
 * Origine de l'endpoint du formulaire de contact, dérivée de la variable
 * d'environnement plutôt qu'écrite en dur : changer d'hébergeur de
 * formulaire ne doit pas obliger à retoucher la politique de sécurité.
 * Sans endpoint configuré, rien n'est autorisé — le formulaire affiche
 * de toute façon son message d'indisponibilité.
 */
function origineFormulaireContact(): string[] {
  const brut = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;
  if (!brut) return [];
  try {
    return [new URL(brut).origin];
  } catch {
    return [];
  }
}

/**
 * La barre d'outils Vercel n'est injectée que sur les déploiements de
 * prévisualisation. On l'autorise là, jamais en production, pour que la
 * relecture reste confortable sans relâcher la politique du site publié.
 */
const originesPrevisualisation = estProduction ? [] : ["https://vercel.live"];

/**
 * Politique de sécurité du contenu (CSP).
 *
 * `'unsafe-inline'` sur script-src est une concession assumée : l'App
 * Router de Next injecte des scripts en ligne (charge utile RSC) que seule
 * une empreinte ou un nonce pourrait autoriser nommément. Le nonce impose
 * un middleware et donc un rendu dynamique, incompatible avec le rendu
 * statique retenu au §4. À réexaminer si le site passe en rendu dynamique.
 */
const politiqueSecuriteContenu = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  [
    "script-src 'self' 'unsafe-inline'",
    // Speed Insights est servi depuis l'origine sur Vercel ; ce repli
    // couvre les cas où le paquet interroge son domaine d'origine.
    "https://va.vercel-scripts.com",
    ...originesPrevisualisation,
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // Polices auto-hébergées par next/font : aucune origine externe (§4).
  "font-src 'self'",
  [
    "connect-src 'self'",
    "https://va.vercel-scripts.com",
    ...origineFormulaireContact(),
    ...originesPrevisualisation,
  ].join(" "),
  // Carte du plan d'accès, chargée dans le pied de page par AccessMap.
  ["frame-src https://www.google.com", ...originesPrevisualisation].join(" "),
  "upgrade-insecure-requests",
].join("; ");

const entetesSecurite = [
  { key: "Content-Security-Policy", value: politiqueSecuriteContenu },
  {
    // Deux ans, sous-domaines compris. `preload` n'a d'effet qu'une fois le
    // domaine soumis à hstspreload.org — à faire à la mise en ligne.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Doublon volontaire de frame-ancestors, pour les navigateurs anciens.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
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
        // `headers()` est ignoré par l'export statique : les en-têtes y
        // relèvent du serveur web. Ils ne sont donc déclarés que hors export.
        async headers() {
          return [{ source: "/:path*", headers: entetesSecurite }];
        },
      }),
};

export default nextConfig;
