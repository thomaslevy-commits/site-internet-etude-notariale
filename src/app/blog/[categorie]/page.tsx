import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilAriane } from "@/components/fil-ariane";
import { JsonLd, schemaFilAriane } from "@/components/json-ld";
import {
  CATEGORIE_LABELS,
  CATEGORIES,
  loadArticlesParCategorie,
  type Categorie,
} from "@/lib/content";

interface Params {
  params: Promise<{ categorie: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((categorie) => ({ categorie }));
}

function estCategorieValide(categorie: string): categorie is Categorie {
  return (CATEGORIES as readonly string[]).includes(categorie);
}

/**
 * Chapeau de catégorie — descriptif du champ couvert, sans qualification de
 * l'étude (§3). Il donne à la page un contenu propre plutôt qu'une simple
 * liste de liens.
 */
const CHAPEAUX: Record<Categorie, string> = {
  immobilier:
    "Acquisition et vente, vente en l'état futur d'achèvement, promotion, baux et fiscalité immobilière : les publications de l'étude sur le droit immobilier.",
  "patrimoine-famille":
    "Successions, donations, partages, régimes matrimoniaux et structuration du patrimoine familial : les publications de l'étude en droit patrimonial de la famille.",
  entreprise:
    "Transmission d'entreprise, baux commerciaux et articulation entre patrimoine professionnel et patrimoine privé : les publications de l'étude en droit des affaires.",
  international:
    "Successions comportant des éléments d'extranéité, expatriation, acquisitions par des non-résidents : les publications de l'étude en droit international privé.",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categorie } = await params;
  if (!estCategorieValide(categorie)) return {};
  return {
    title: {
      absolute: `${CATEGORIE_LABELS[categorie]} — Blog de l'étude Thomas Lévy, Paris`,
    },
    description: CHAPEAUX[categorie],
    alternates: { canonical: `/blog/${categorie}` },
  };
}

/**
 * Page de catégorie du blog. Le segment existait dans l'URL des articles
 * (/blog/[categorie]/[slug]) sans page correspondante : /blog/immobilier
 * servait une erreur 404, et le fil d'Ariane portait un maillon mort.
 */
export default async function PageCategorie({ params }: Params) {
  const { categorie } = await params;
  if (!estCategorieValide(categorie)) notFound();

  const articles = loadArticlesParCategorie(categorie);
  const libelle = CATEGORIE_LABELS[categorie];

  return (
    <main className="mx-auto w-full max-w-grid px-6 py-16">
      <JsonLd
        data={schemaFilAriane([
          { href: "/blog", label: "Blog" },
          { label: libelle },
        ])}
      />
      <FilAriane
        maillons={[{ href: "/blog", label: "Blog" }, { label: libelle }]}
      />

      <h1 className="mt-8 font-serif text-4xl font-medium tracking-tight text-night">
        {libelle}
      </h1>
      <p className="mt-6 max-w-3xl text-slate-soft">{CHAPEAUX[categorie]}</p>

      {articles.length > 0 ? (
        <ul className="mt-14 space-y-8">
          {articles.map(({ frontmatter }) => (
            <li key={frontmatter.slug} className="border-b border-line pb-8">
              <h2 className="font-serif text-2xl text-night">
                <Link
                  href={`/blog/${categorie}/${frontmatter.slug}`}
                  className="decoration-gold underline-offset-4 hover:underline"
                >
                  {frontmatter.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-slate-soft">
                <time dateTime={frontmatter.date}>{frontmatter.date}</time>
                {" — "}
                {frontmatter.author}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-14 text-slate-soft">
          Les publications de cette rubrique seront mises en ligne
          prochainement.
        </p>
      )}

      <p className="mt-14">
        <Link
          href="/blog"
          className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
        >
          Toutes les rubriques
        </Link>
      </p>
    </main>
  );
}
