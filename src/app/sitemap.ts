import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import {
  CATEGORIES,
  EXPERTISE_SLUGS,
  loadAllArticles,
  loadArticlesParCategorie,
} from "@/lib/content";

const ROUTES_STATIQUES = [
  "/",
  "/etude",
  "/expertises",
  "/tarif",
  "/blog",
  "/faq",
  "/contact",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/cookies",
  "/accessibilite",
] as const;

/** Sitemap généré au build (§7) : routes statiques, expertises, articles. */
export default function sitemap(): MetadataRoute.Sitemap {
  const statiques = ROUTES_STATIQUES.map((route) => ({
    url: route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`,
  }));
  const expertises = EXPERTISE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/expertises/${slug}`,
  }));
  // Les pages de catégorie ne sont déclarées qu'une fois peuplées : une page
  // de rubrique vide n'a rien à faire dans un sitemap.
  const categories = CATEGORIES.filter(
    (categorie) => loadArticlesParCategorie(categorie).length > 0,
  ).map((categorie) => ({ url: `${SITE_URL}/blog/${categorie}` }));
  const articles = loadAllArticles().map(({ frontmatter }) => ({
    url: `${SITE_URL}/blog/${frontmatter.categorie}/${frontmatter.slug}`,
    lastModified: frontmatter.date,
  }));
  return [...statiques, ...expertises, ...categories, ...articles];
}
