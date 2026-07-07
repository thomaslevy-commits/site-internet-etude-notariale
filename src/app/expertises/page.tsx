import type { Metadata } from "next";
import Link from "next/link";
import { loadExpertise, PLACEHOLDER, type ExpertiseSlug } from "@/lib/content";

export const metadata: Metadata = {
  title: "Expertises",
  description: PLACEHOLDER,
  alternates: { canonical: "/expertises" },
};

/** Regroupement éditorial des 18 expertises par familles. */
const FAMILLES: { titre: string; slugs: ExpertiseSlug[] }[] = [
  {
    titre: "Immobilier",
    slugs: [
      "immobilier-residentiel",
      "immobilier-commercial",
      "vefa",
      "promotion-immobiliere",
      "marchands-de-biens",
      "fiscalite-immobiliere",
    ],
  },
  {
    titre: "Patrimoine et famille",
    slugs: [
      "successions",
      "donations",
      "partage",
      "divorce",
      "structuration-patrimoniale",
      "sci",
    ],
  },
  {
    titre: "Entreprise",
    slugs: ["transmission-entreprise", "baux-commerciaux"],
  },
  {
    titre: "International",
    slugs: [
      "successions-internationales",
      "expatries",
      "investisseurs-etrangers",
      "family-office",
    ],
  },
];

export default function IndexExpertises() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Nos expertises
      </h1>
      <div className="mt-14 space-y-16">
        {FAMILLES.map((famille) => (
          <section key={famille.titre}>
            <h2 className="border-b border-line pb-3 font-serif text-2xl text-night">
              {famille.titre}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {famille.slugs.map((slug) => {
                const { frontmatter } = loadExpertise(slug);
                return (
                  <li key={slug}>
                    <Link
                      href={`/expertises/${slug}`}
                      className="block rounded-sm border border-line bg-paper px-5 py-4 transition-colors hover:bg-ivory"
                    >
                      <span className="font-serif text-lg text-night">
                        {frontmatter.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
