import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ContactBand } from "@/components/contact-band";
import { etude } from "@/config/etude";
import { cheminPublic } from "@/lib/chemins";

export const metadata: Metadata = {
  title: { absolute: "L'étude — Étude notariale Thomas Lévy, Paris 16" },
  description:
    "Histoire, méthode de travail et équipe de l'étude notariale Thomas Lévy, à Paris 16ᵉ. Une pratique dédiée à l'immobilier et au patrimoine, en français, anglais et allemand.",
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
    titre: "Parcours",
    contenu: [
      `${etude.nomNotaire} effectue son stage dans des études parisiennes tournées vers l'immobilier complexe, à une période où la documentation de l'investissement institutionnel se transforme : les data rooms apparaissent, et les cessions de portefeuilles appellent des clauses rédigées sur mesure pour des investisseurs internationaux.`,
      "Il rejoint ensuite une étude à la pratique mixte, où se côtoient l'investissement institutionnel, la vente en l'état futur d'achèvement en bloc, le financement et la découpe d'immeubles destinée à la vente aux particuliers. Ces années donnent une vue continue de l'opération immobilière, du montage jusqu'au lot vendu.",
      "Il est nommé notaire par arrêté du 27 décembre 2005.",
      "La fiscalité s'est imposée ensuite, par goût des mathématiques et de règles qui changent. Elle occupe depuis une part constante de sa pratique.",
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
      "L'étude réunit autour de Thomas Lévy une équipe de deux notaires salariées et de collaborateurs formés au traitement des dossiers immobiliers, patrimoniaux et internationaux. La taille de l'équipe est volontairement maîtrisée : chaque dossier est suivi personnellement, de l'ouverture à l'accomplissement des dernières formalités.",
    ],
  },
  {
    titre: "Engagements",
    contenu: [
      "Trois engagements structurent la pratique de l'étude : la rigueur de l'analyse, qui précède toute rédaction ; la clarté de l'information, notamment sur les coûts, communiqués avant tout engagement ; et la confidentialité absolue attachée au secret professionnel.",
    ],
  },
];

/**
 * Formation du notaire titulaire. Sans années : le parcours n'en fournit
 * qu'une seule, celle de la nomination, et une chronologie à repère unique
 * afficherait ses trous plutôt qu'elle ne renseignerait.
 *
 * Le directeur de mémoire n'est pas nommé. Il exerce aussi comme avocat en
 * urbanisme et construction : son nom sur cette page prêterait le flanc à
 * une contestation d'impartialité le jour où il défendrait une partie
 * adverse. Le sujet du mémoire porte à lui seul la spécialisation.
 */
const FORMATION: readonly {
  etablissement: string;
  titres: readonly string[];
  memoire?: string;
}[] = [
  {
    etablissement: "Université de Strasbourg",
    titres: [
      "Lauréat du prix Dalloz en droit des obligations",
      "Maîtrise de droit privé",
      "Certificat d'urbanisme, de construction et marchés publics",
    ],
  },
  {
    etablissement: "Université Paris Nanterre",
    titres: ["Diplôme supérieur du notariat"],
    memoire: "La cession de la construction irrégulière",
  },
  {
    etablissement: "Université d'Auvergne",
    titres: ["Gestion de patrimoine"],
  },
];

export default function PageEtude() {
  return (
    <main className="etude-page">
      <PageIntro
        titre="L'étude Thomas Lévy"
        rubrique="Notaire à Paris XVI"
        description="Une pratique dédiée à l'immobilier et au patrimoine, en français, anglais et allemand."
      />
      <div className="site-container page-body profile-layout">
        <div className="reading-sections">
          {SECTIONS.map((section, index) => (
            <section key={section.titre} id={`etude-${index}`}>
              <p className="profile-section-number" aria-hidden="true">0{index + 1}</p>
              <h2>{section.titre}</h2>
              {section.contenu.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
          <section>
            <h2>Formation</h2>
            <dl>
              {FORMATION.map((etape) => (
                <div
                  key={etape.etablissement}
                  className="border-b border-line py-5"
                >
                  <dt className="font-serif text-2xl">{etape.etablissement}</dt>
                  {etape.titres.map((titre) => (
                    <dd className="mt-2 text-slate-soft" key={titre}>
                      {titre}
                    </dd>
                  ))}
                  {etape.memoire && (
                    <dd className="mt-3 text-sm text-slate-soft">
                      Mémoire : <em>{etape.memoire}</em>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2>Langues</h2>
            <p>
              L&apos;étude reçoit en {etude.langues.slice(0, -1).join(", en ")}{" "}
              et en {etude.langues[etude.langues.length - 1]}.
            </p>
          </section>
        </div>
        <aside className="order-first lg:order-none lg:sticky lg:top-44">
          {/* Même présentation que le portrait de l'accueil (décision du
              notaire du 11 octobre 2026). La date de nomination reste dans le
              paragraphe « Parcours » ; la flèche renvoie au contact, la page
              du parcours étant celle-ci. */}
          <figure className="signature-portrait">
            <div className="signature-image">
              <Image
                src={cheminPublic("/images/portrait.jpg")}
                alt="Maître Thomas Lévy, notaire à Paris"
                width={1023}
                height={1537}
                priority
                sizes="(min-width: 1024px) 450px, 100vw"
              />
              <span className="portrait-edge" aria-hidden="true">LÉVY NOTAIRES · PARIS</span>
            </div>
            <figcaption>
              <span><strong>Thomas Lévy</strong><span>Notaire à Paris</span></span>
              <Link href="/contact" className="round-link" aria-label="Contacter l'étude">↗</Link>
            </figcaption>
          </figure>
        </aside>
      </div>
      <ContactBand />
    </main>
  );
}
