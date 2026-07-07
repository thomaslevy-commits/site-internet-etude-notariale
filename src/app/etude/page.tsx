import type { Metadata } from "next";
import { PLACEHOLDER } from "@/lib/content";
import { etude } from "@/config/etude";

export const metadata: Metadata = {
  title: "L'étude — Étude notariale, Paris",
};

const SECTIONS = [
  "Histoire",
  "Méthode de travail",
  "Équipe",
  "Engagements",
] as const;

export default function PageEtude() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        L&apos;étude
      </h1>
      {SECTIONS.map((titre) => (
        <section key={titre} className="mt-14 max-w-3xl">
          <h2 className="font-serif text-2xl text-night">{titre}</h2>
          <p className="mt-4 text-slate-soft">{PLACEHOLDER}</p>
        </section>
      ))}
      <section className="mt-14 max-w-3xl">
        <h2 className="font-serif text-2xl text-night">Langues</h2>
        <p className="mt-4 text-slate-soft">{etude.langues.join(", ")}</p>
      </section>
    </main>
  );
}
