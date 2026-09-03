import type { Metadata } from "next";
import { FilAriane } from "@/components/fil-ariane";
import { JsonLd, schemaFilAriane } from "@/components/json-ld";
import {
  loadPageLegale,
  pageLegaleIncomplete,
  type PageLegaleSlug,
  A_VALIDER,
} from "@/lib/content";

/**
 * Gabarit commun des pages légales. Le texte provient de content/legal/*.mdx,
 * validé par Zod (§9) : le code n'écrit aucune mention, il les met en page.
 *
 * Les éléments que seul le notaire peut renseigner portent dans le MDX le
 * marqueur de validation défini par A_VALIDER. Ils sont rendus visiblement
 * distincts plutôt que masqués : une mention légale incomplète doit se voir,
 * sur la page comme dans le rapport de construction.
 */

const DATE_FR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formaterDate(iso: string): string {
  return DATE_FR.format(new Date(`${iso}T12:00:00Z`));
}

/**
 * Métadonnées d'une page légale, dérivées de son propre contenu.
 *
 * Une page qui porte encore des marqueurs est déclarée non indexable,
 * indépendamment du `noindex` global : le jour où celui-ci sera levé, une
 * mention en attente de validation deviendrait un résultat de recherche sur
 * le site d'un officier public. L'exclusion est dérivée du contenu et non
 * déclarée à la main — elle tombe d'elle-même lorsque le dernier marqueur
 * est renseigné, sans que personne ait à penser à la retirer.
 *
 * `follow: true` : les liens de la page restent suivis, seule l'indexation
 * de son texte est écartée.
 */
export function metadonneesPageLegale(slug: PageLegaleSlug): Metadata {
  const contenu = loadPageLegale(slug);
  return {
    title: { absolute: `${contenu.titre} — Étude Thomas Lévy, notaire à Paris` },
    description: contenu.description,
    alternates: { canonical: `/${slug}` },
    ...(pageLegaleIncomplete(slug)
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

function Valeur({ texte }: { texte: string }) {
  if (!texte.startsWith(A_VALIDER)) return <>{texte}</>;
  return (
    <span className="border-l-2 border-gold pl-3 italic text-slate-soft">
      {texte}
    </span>
  );
}

export function PageLegale({ slug }: { slug: PageLegaleSlug }) {
  const contenu = loadPageLegale(slug);

  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <JsonLd data={schemaFilAriane([{ label: contenu.titre }])} />
      <FilAriane maillons={[{ label: contenu.titre }]} />

      <h1 className="mt-8 font-serif text-4xl font-medium tracking-tight text-night">
        {contenu.titre}
      </h1>
      <p className="mt-4 text-sm text-slate-soft">
        Dernière mise à jour : {formaterDate(contenu.miseAJour)}
      </p>

      <div className="mt-14 max-w-3xl">
        {contenu.sections.map((section) => (
          <section key={section.titre} className="mb-12">
            <h2 className="font-serif text-2xl text-night">{section.titre}</h2>

            {section.paragraphes?.map((paragraphe, index) => (
              <p key={index} className="mt-4 text-slate-soft">
                {paragraphe}
              </p>
            ))}

            {section.liste ? (
              <ul className="mt-4 space-y-3">
                {section.liste.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-3 h-px w-4 shrink-0 bg-gold"
                    />
                    <span className="text-slate-soft">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.definitions ? (
              <dl className="mt-6 space-y-4">
                {section.definitions.map((entree) => (
                  <div key={entree.terme}>
                    <dt className="text-sm font-medium text-night">
                      {entree.terme}
                    </dt>
                    <dd className="mt-1 text-slate-soft">
                      <Valeur texte={entree.valeur} />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
