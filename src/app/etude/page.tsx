import type { Metadata } from "next";
import Image from "next/image";
import { etude } from "@/config/etude";

export const metadata: Metadata = {
  title: "L'étude",
  description:
    "Une étude notariale parisienne dédiée à l'immobilier complexe, à la structuration patrimoniale et aux dossiers internationaux. Méthode, équipe et engagements.",
  alternates: { canonical: "/etude" },
};

const SECTIONS: { titre: string; contenu: string[] }[] = [
  {
    titre: "L'esprit de l'étude",
    contenu: [
      "L'étude est établie à Paris, sous la responsabilité de Maître Thomas Lévy, notaire. Sa pratique est tournée vers les opérations immobilières complexes, la structuration patrimoniale, les successions — françaises et internationales — et le conseil aux entreprises et aux family offices.",
      "Nous considérons que le rôle du notaire ne se réduit pas à la rédaction d'actes : il consiste à comprendre une opération, à en anticiper les difficultés et à construire une architecture juridique solide. L'acte n'est que la conclusion de ce travail d'analyse.",
    ],
  },
  {
    titre: "Méthode de travail",
    contenu: [
      "Chaque dossier commence par l'écoute des objectifs. Les textes servent les objectifs, jamais l'inverse : avant de rechercher la règle applicable, nous identifions les intérêts en présence, les risques, les contraintes et les marges de manœuvre.",
      "Le dossier est ensuite conduit selon un calendrier établi dès l'ouverture, avec un interlocuteur identifié, des points d'étape réguliers et une revue systématique des aspects civils, fiscaux et de publicité foncière avant toute signature.",
    ],
  },
  {
    titre: "Équipe",
    contenu: [
      "L'étude réunit autour du notaire une équipe de collaborateurs formés au traitement des dossiers immobiliers, patrimoniaux et internationaux. La taille de l'équipe est volontairement maîtrisée : chaque dossier est suivi personnellement, de l'ouverture à l'accomplissement des dernières formalités.",
    ],
  },
  {
    titre: "Engagements",
    contenu: [
      "Trois engagements structurent la pratique de l'étude : la rigueur de l'analyse, qui précède toute rédaction ; la clarté de l'information, notamment sur les coûts, communiqués avant tout engagement ; et la confidentialité absolue attachée au secret professionnel.",
    ],
  },
];

export default function PageEtude() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        L&apos;étude
      </h1>
      <div className="mt-14 grid gap-14 lg:grid-cols-[2fr,1fr]">
        <div>
          {SECTIONS.map((section) => (
            <section key={section.titre} className="mb-14 max-w-3xl">
              <h2 className="font-serif text-2xl text-night">{section.titre}</h2>
              {section.contenu.map((paragraphe) => (
                <p key={paragraphe.slice(0, 40)} className="mt-4 text-slate-soft">
                  {paragraphe}
                </p>
              ))}
            </section>
          ))}
          <section className="max-w-3xl">
            <h2 className="font-serif text-2xl text-night">Langues</h2>
            <p className="mt-4 text-slate-soft">
              L&apos;étude reçoit en {etude.langues.join(" et en ")}.
            </p>
          </section>
        </div>
        <div className="flex flex-col gap-8">
          <figure>
            <Image
              src="/images/portrait.jpg"
              alt="Maître Thomas Lévy, notaire à Paris"
              width={880}
              height={1322}
              className="w-full rounded-sm"
              priority
            />
            <figcaption className="mt-3 text-sm text-slate-soft">
              Maître Thomas Lévy, notaire
            </figcaption>
          </figure>
          <Image
            src="/images/panonceau.jpg"
            alt="Panonceau de notaire à l'effigie de la République française"
            width={680}
            height={1025}
            className="w-full rounded-sm"
          />
        </div>
      </div>
    </main>
  );
}
