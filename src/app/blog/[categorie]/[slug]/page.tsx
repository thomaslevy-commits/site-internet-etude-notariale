import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilAriane } from "@/components/fil-ariane";
import {
  JsonLd,
  schemaArticle,
  schemaFilAriane,
} from "@/components/json-ld";
import {
  CATEGORIE_LABELS,
  CATEGORIES,
  loadAllArticles,
  loadExpertise,
  type Categorie,
} from "@/lib/content";

interface Params {
  params: Promise<{ categorie: string; slug: string }>;
}

export function generateStaticParams() {
  return loadAllArticles().map(({ frontmatter }) => ({
    categorie: frontmatter.categorie,
    slug: frontmatter.slug,
  }));
}

function estCategorieValide(categorie: string): categorie is Categorie {
  return (CATEGORIES as readonly string[]).includes(categorie);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categorie, slug } = await params;
  if (!estCategorieValide(categorie)) return {};
  const article = loadAllArticles().find(
    (a) => a.frontmatter.categorie === categorie && a.frontmatter.slug === slug,
  );
  if (!article) return {};
  return {
    title: article.frontmatter.title,
    alternates: { canonical: `/blog/${categorie}/${slug}` },
  };
}

/** Gabarit article : contenu MDX, expertise pilier, articles connexes (§6). */
export default async function PageArticle({ params }: Params) {
  const { categorie, slug } = await params;
  if (!estCategorieValide(categorie)) notFound();

  const articles = loadAllArticles();
  const article = articles.find(
    (a) => a.frontmatter.categorie === categorie && a.frontmatter.slug === slug,
  );
  if (!article) notFound();

  const { frontmatter, body } = article;
  const pilier = loadExpertise(frontmatter.pillar);
  const connexes = articles.filter(
    (a) =>
      a.frontmatter.categorie === categorie && a.frontmatter.slug !== slug,
  );
  const paragraphes = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-grid px-6 py-16">
      <JsonLd data={schemaArticle(frontmatter)} />
      <JsonLd
        data={schemaFilAriane([
          { href: "/blog", label: "Blog" },
          { label: CATEGORIE_LABELS[categorie] },
          { label: frontmatter.title },
        ])}
      />

      <FilAriane
        maillons={[
          { href: "/blog", label: "Blog" },
          { label: CATEGORIE_LABELS[categorie] },
          { label: frontmatter.title },
        ]}
      />

      <article className="mt-8 max-w-3xl">
        <p className="text-sm uppercase tracking-wide text-slate-soft">
          {CATEGORIE_LABELS[categorie]}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-night">
          {frontmatter.title}
        </h1>
        <p className="mt-4 text-sm text-slate-soft">
          <time dateTime={frontmatter.date}>{frontmatter.date}</time>
          {" — "}
          {frontmatter.author}
        </p>
        <div className="mt-8 space-y-4">
          {paragraphes.map((paragraphe) => (
            <p key={paragraphe.slice(0, 60)} className="text-slate-soft">
              {paragraphe}
            </p>
          ))}
        </div>
      </article>

      <section className="mt-16 max-w-3xl border-t border-line pt-10">
        <h2 className="font-serif text-xl text-night">Expertise associée</h2>
        <p className="mt-4">
          <Link
            href={`/expertises/${frontmatter.pillar}`}
            className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
          >
            {pilier.frontmatter.title}
          </Link>
        </p>
      </section>

      {connexes.length > 0 ? (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-serif text-xl text-night">
            Dans la même catégorie
          </h2>
          <ul className="mt-4 space-y-2">
            {connexes.map((connexe) => (
              <li key={connexe.frontmatter.slug}>
                <Link
                  href={`/blog/${connexe.frontmatter.categorie}/${connexe.frontmatter.slug}`}
                  className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
                >
                  {connexe.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
