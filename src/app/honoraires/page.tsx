import type { Metadata } from "next";
import { PLACEHOLDER } from "@/lib/content";

export const metadata: Metadata = {
  title: "Honoraires",
  description: PLACEHOLDER,
  alternates: { canonical: "/honoraires" },
};

/**
 * Gabarit Honoraires (§8) : quatre sections, aucune simulation chiffrée,
 * aucun montant. Les textes validés citeront les références en vigueur
 * (art. L. 444-1 et s. C. com.) — à vérifier avant publication.
 */
const SECTIONS = [
  "Émoluments réglementés",
  "Débours",
  "Droits et taxes",
  "Honoraires libres",
] as const;

export default function PageHonoraires() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Honoraires
      </h1>
      {SECTIONS.map((titre) => (
        <section key={titre} className="mt-14 max-w-3xl">
          <h2 className="font-serif text-2xl text-night">{titre}</h2>
          <p className="mt-4 text-slate-soft">{PLACEHOLDER}</p>
        </section>
      ))}
    </main>
  );
}
