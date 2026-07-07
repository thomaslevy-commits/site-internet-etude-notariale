import type { Metadata } from "next";
import Link from "next/link";
import {
  CATEGORIE_LABELS,
  CATEGORIES,
  loadAllArticles,
  PLACEHOLDER,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: PLACEHOLDER,
  alternates: { canonical: "/blog" },
};

export default function IndexBlog() {
  const articles = loadAllArticles();

  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Blog
      </h1>

      <nav aria-label="Catégories" className="mt-8">
        <ul className="flex flex-wrap gap-3">
          {CATEGORIES.map((categorie) => (
            <li key={categorie}>
              <span className="inline-block rounded-sm border border-line bg-paper px-4 py-2 text-sm text-night">
                {CATEGORIE_LABELS[categorie]}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="mt-14 space-y-8">
        {articles.map(({ frontmatter }) => (
          <li
            key={`${frontmatter.categorie}/${frontmatter.slug}`}
            className="border-b border-line pb-8"
          >
            <p className="text-sm text-gold">
              {CATEGORIE_LABELS[frontmatter.categorie]}
            </p>
            <h2 className="mt-2 font-serif text-2xl text-night">
              <Link
                href={`/blog/${frontmatter.categorie}/${frontmatter.slug}`}
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
    </main>
  );
}
