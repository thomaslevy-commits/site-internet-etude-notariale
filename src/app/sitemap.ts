import type { MetadataRoute } from "next";
import { EXPERTISE_SLUGS, loadAllArticles } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ROUTES_STATIQUES = [
  "/",
  "/etude",
  "/expertises",
  "/honoraires",
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
  const articles = loadAllArticles().map(({ frontmatter }) => ({
    url: `${SITE_URL}/blog/${frontmatter.categorie}/${frontmatter.slug}`,
    lastModified: frontmatter.date,
  }));
  return [...statiques, ...expertises, ...articles];
}
