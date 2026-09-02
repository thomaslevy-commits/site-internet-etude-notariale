import { SITE_URL } from "@/config/site";
import { loadAllArticles } from "@/lib/content";

export const dynamic = "force-static";

function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Flux RSS du blog, généré statiquement au build (§2). */
export function GET(): Response {
  const articles = loadAllArticles();

  const items = articles
    .map(({ frontmatter }) => {
      const url = `${SITE_URL}/blog/${frontmatter.categorie}/${frontmatter.slug}`;
      return [
        "<item>",
        `<title>${echapper(frontmatter.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        frontmatter.description
          ? `<description>${echapper(frontmatter.description)}</description>`
          : "",
        `<pubDate>${new Date(`${frontmatter.date}T09:00:00Z`).toUTCString()}</pubDate>`,
        "</item>",
      ].join("");
    })
    .join("");

  // atom:link auto-référent : les validateurs et la plupart des agrégateurs
  // l'attendent pour identifier l'adresse canonique du flux.
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>` +
    `<title>Blog — Étude notariale Thomas Lévy, Paris</title>` +
    `<link>${SITE_URL}/blog</link>` +
    `<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />` +
    `<description>Publications de l'étude en droit immobilier, patrimonial, des affaires et international.</description>` +
    `<language>fr</language>` +
    items +
    `</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
