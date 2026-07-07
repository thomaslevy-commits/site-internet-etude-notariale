import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Étude notariale — Paris",
  description:
    "[CONTENU À VALIDER — NE PAS PUBLIER] Description à fournir avant mise en ligne.",
  // Le site n'est pas publié : aucune indexation avant validation.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-sans text-base sm:text-lg">{children}</body>
    </html>
  );
}
