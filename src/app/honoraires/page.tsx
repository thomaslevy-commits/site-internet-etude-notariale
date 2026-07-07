import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honoraires",
  description:
    "Comprendre le coût d'un acte notarié : émoluments réglementés, débours, droits et taxes, honoraires libres. Une information claire avant tout engagement.",
  alternates: { canonical: "/honoraires" },
};

/**
 * Page Honoraires (§8) : quatre sections, aucune simulation chiffrée,
 * aucun montant. Références : art. L. 444-1 et s. C. com. et arrêtés
 * tarifaires en vigueur — à vérifier avant publication.
 */
const SECTIONS: { titre: string; contenu: string[] }[] = [
  {
    titre: "Émoluments réglementés",
    contenu: [
      "La rémunération du notaire est, pour la plupart des actes, fixée par un tarif national réglementé (articles L. 444-1 et suivants du code de commerce et arrêtés pris pour leur application). Ce tarif est identique pour tous les notaires de France : à acte égal, émolument égal, quelle que soit l'étude choisie.",
      "Les émoluments sont tantôt fixes, tantôt proportionnels à la valeur énoncée à l'acte, selon un barème dégressif par tranches. Ils rémunèrent l'analyse juridique, la rédaction, la réception de l'acte et l'accomplissement des formalités qui lui sont attachées.",
    ],
  },
  {
    titre: "Débours",
    contenu: [
      "Les débours correspondent aux sommes que l'étude avance pour le compte de son client auprès de tiers : état hypothécaire, documents d'urbanisme, extraits cadastraux, pièces d'état civil, intervention d'un géomètre ou d'un syndic, notamment. Ils sont restitués à l'euro près et détaillés dans le compte remis à l'issue du dossier.",
    ],
  },
  {
    titre: "Droits et taxes",
    contenu: [
      "La part la plus importante des sommes versées à l'occasion d'un acte — couramment dénommées « frais de notaire » — est en réalité constituée d'impôts perçus pour le compte de l'État et des collectivités : droits d'enregistrement, taxe de publicité foncière, contribution de sécurité immobilière, TVA le cas échéant. Le notaire les collecte et les reverse intégralement au Trésor public.",
    ],
  },
  {
    titre: "Honoraires libres",
    contenu: [
      "Les prestations qui ne relèvent pas du tarif réglementé — consultations juridiques, négociations, audits, ingénierie patrimoniale ou accompagnement d'opérations complexes — donnent lieu à des honoraires librement convenus. Leur montant ou leur mode de calcul est convenu par écrit avec le client avant toute intervention, conformément à l'article L. 444-1 du code de commerce.",
      "Un devis ou une convention d'honoraires est remis sur demande. Un rendez-vous permet d'examiner votre situation et de préciser le coût prévisible de l'opération envisagée.",
    ],
  },
];

export default function PageHonoraires() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Honoraires
      </h1>
      <p className="mt-6 max-w-3xl text-slate-soft">
        Le coût d'un acte notarié obéit à des règles précises. Il se compose de
        quatre éléments de nature différente, présentés ci-dessous, dont un
        seul constitue la rémunération de l'étude.
      </p>
      {SECTIONS.map((section) => (
        <section key={section.titre} className="mt-14 max-w-3xl">
          <h2 className="font-serif text-2xl text-night">{section.titre}</h2>
          {section.contenu.map((paragraphe) => (
            <p key={paragraphe.slice(0, 40)} className="mt-4 text-slate-soft">
              {paragraphe}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
