import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/config/site";
import { construireIndexRecherche } from "@/lib/recherche";
import "./globals.css";
import "./editorial.css";

/**
 * Polices auto-hébergées via next/font (téléchargées au build, servies depuis
 * le domaine — aucune requête externe à l'exécution). C'était une obligation
 * du §4 ; le §4 révisé du 3 septembre 2026 autorise les polices distantes.
 * L'auto-hébergement est conservé parce qu'il évite d'avoir à déclarer un
 * transfert vers Google dans les pages légales, non parce qu'il est imposé.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

/**
 * Jost remplace Inter le 7 septembre 2026, sur demande du notaire : Inter est
 * la grotesque des interfaces logicielles, elle donnait à l'en-tête et au pied
 * de page l'aspect d'un produit numérique plutôt que d'une étude.
 *
 * Jost est un dessin géométrique de la lignée des sans empattement allemandes
 * de l'entre-deux-guerres — celles que les maisons de luxe parisiennes ont
 * retenues pour leurs identités. Deux raisons de la choisir ici plutôt qu'une
 * grotesque contemporaine : ses capitales, larges et à faible contraste,
 * portent l'interlettrage des petites capitales de la navigation sans se
 * refermer ; et son axe géométrique s'accorde à la plume ancienne du
 * Cormorant sans lui disputer le regard. Elle sert toute la partie sans
 * empattement du site — en-tête, pied de page et corps de texte — pour que
 * l'écriture reste une seule et même voix d'un bloc à l'autre.
 */
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Métadonnées globales (§7) : gabarit de titre « {Sujet} — Étude notariale,
 * Paris », Open Graph et Twitter Card ; les pages fournissent leur titre,
 * leur description et leur canonical.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Notaire à Paris 16 — Étude notariale Thomas Lévy",
    template: "%s — Étude Thomas Lévy, notaire à Paris",
  },
  description:
    "Étude notariale à Paris 16ᵉ. Immobilier, successions, structuration patrimoniale, entreprise et clientèle internationale. Consultations sur rendez-vous.",
  // Indexation ouverte par décision du notaire du 11 octobre 2026. Les pages
  // légales encore incomplètes (marqueur de validation) restent `noindex, follow`
  // par dérivation du contenu (page-legale.tsx) ; la 404 aussi.
  robots: { index: true, follow: true },
  // Vérification de propriété Bing Webmaster Tools (11 octobre 2026) :
  // la balise doit rester en place, sa suppression fait perdre la vérification.
  verification: {
    other: { "msvalidate.01": "A0EDDC7B72EE8D8A4FDA736C77B37142" },
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Étude Notariale Thomas Lévy — Paris 16",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-base">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-night focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
        >
          Aller au contenu
        </a>
        <SiteHeader indexRecherche={construireIndexRecherche()} />
        <div id="contenu" className="flex-1" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
        <SpeedInsights />
      </body>
    </html>
  );
}
