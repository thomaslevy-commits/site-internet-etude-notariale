import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Polices auto-hébergées via next/font (téléchargées au build, servies
 * depuis le domaine — aucune requête externe à l'exécution). CLAUDE.md §4-5.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
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
    default: "Étude Thomas Lévy — Notaire à Paris",
    template: "%s — Étude Thomas Lévy, notaire à Paris",
  },
  description:
    "Étude notariale à Paris : immobilier complexe, structuration patrimoniale, successions internationales, conseil aux entreprises et aux family offices.",
  // Le site n'est pas publié : aucune indexation avant validation.
  robots: { index: false, follow: false },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Étude Thomas Lévy — Notaire à Paris",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-base sm:text-lg">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-night focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <div id="contenu" className="flex-1">
          {children}
        </div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
