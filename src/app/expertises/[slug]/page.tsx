import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaRendezVous } from "@/components/cta-rdv";
import { FilAriane } from "@/components/fil-ariane";
import { JsonLd, schemaFaq, schemaFilAriane } from "@/components/json-ld";
import { SEO_TITLES } from "@/config/seo";
import {
  EXPERTISE_SLUGS,
  loadExpertise,
  PLACEHOLDER,
  type ExpertiseSlug,
} from "@/lib/content";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return EXPERTISE_SLUGS.map((slug) => ({ slug }));
}

function estSlugValide(slug: string): slug is ExpertiseSlug {
  return (EXPERTISE_SLUGS as readonly string[]).includes(slug);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (!estSlugValide(slug)) return {};
  const { frontmatter } = loadExpertise(slug);
  return {
    // Title absolu : il porte déjà la marque et la localisation (§7).
    title: { absolute: frontmatter.seoTitle ?? SEO_TITLES[slug] },
    description: frontmatter.description,
    alternates: { canonical: `/expertises/${slug}` },
  };
}

/**
 * Gabarit unique des pages d'expertise (§8) : introduction → problématiques
 * → approche → déroulement → FAQ → expertises connexes → CTA.
 * Les contenus proviennent exclusivement des MDX (§9).
 */
export default async function PageExpertise({ params }: Params) {
  const { slug } = await params;
  if (!estSlugValide(slug)) notFound();

  const { frontmatter, body } = loadExpertise(slug);
  const paragraphes = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const etapes = frontmatter.etapes ?? [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER];

  return (
    <main className="mx-auto w-full max-w-grid px-6 py-16">
      <JsonLd
        data={schemaFilAriane([
          { href: "/expertises", label: "Expertises" },
          { label: frontmatter.title },
        ])}
      />
      {frontmatter.faq.length > 0 ? (
        <JsonLd data={schemaFaq(frontmatter.faq)} />
      ) : null}

      <FilAriane
        maillons={[
          { href: "/expertises", label: "Expertises" },
          { label: frontmatter.title },
        ]}
      />

      <h1 className="mt-8 font-serif text-4xl font-medium tracking-tight text-night">
        {frontmatter.title}
      </h1>

      <section className="mt-8 max-w-3xl space-y-4">
        {paragraphes.map((paragraphe, index) => (
          <p key={index} className="text-slate-soft">
            {paragraphe}
          </p>
        ))}
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-serif text-2xl text-night">
          Problématiques rencontrées
        </h2>
        {frontmatter.problematiques ? (
          <ul className="mt-4 space-y-3">
            {frontmatter.problematiques.map((probleme, index) => (
              <li key={index} className="flex gap-3">
                <span aria-hidden="true" className="mt-3 h-px w-4 shrink-0 bg-gold" />
                <span className="text-slate-soft">{probleme}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-slate-soft">{PLACEHOLDER}</p>
        )}
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-serif text-2xl text-night">
          L&apos;approche de l&apos;étude
        </h2>
        <p className="mt-4 text-slate-soft">
          {frontmatter.approche ?? PLACEHOLDER}
        </p>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-serif text-2xl text-night">
          Déroulement d&apos;un dossier
        </h2>
        <ol className="mt-6 space-y-4">
          {etapes.map((etape, index) => (
            <li key={index} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="font-serif text-2xl leading-none text-gold"
              >
                {`0${index + 1}`}
              </span>
              <p className="text-sm text-slate-soft">{etape}</p>
            </li>
          ))}
        </ol>
      </section>

      {frontmatter.faq.length > 0 ? (
        <section className="mt-16 max-w-3xl">
          <h2 className="font-serif text-2xl text-night">Questions fréquentes</h2>
          <dl className="mt-6 space-y-6">
            {frontmatter.faq.map((entree) => (
              <div key={entree.question}>
                <dt className="font-medium text-night">{entree.question}</dt>
                <dd className="mt-2 text-sm text-slate-soft">{entree.reponse}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-serif text-2xl text-night">Expertises connexes</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {frontmatter.related.map((connexe) => {
            const { frontmatter: fmConnexe } = loadExpertise(connexe);
            return (
              <li key={connexe}>
                <Link
                  href={`/expertises/${connexe}`}
                  className="inline-block rounded-sm border border-line bg-paper px-4 py-2 text-sm text-night transition-colors hover:bg-ivory"
                >
                  {fmConnexe.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-16 border-t border-line pt-10">
        <p className="text-sm text-slate-soft">
          Un rendez-vous permet d&apos;examiner votre situation.
        </p>
        <div className="mt-4">
          <CtaRendezVous />
        </div>
        {/* La question du coût se pose sur chaque dossier : /tarif ne
            recevait pourtant de lien que depuis l'accueil. */}
        <p className="mt-6">
          <Link
            href="/tarif"
            className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
          >
            Comprendre le tarif notarial
          </Link>
        </p>
      </section>
    </main>
  );
}
