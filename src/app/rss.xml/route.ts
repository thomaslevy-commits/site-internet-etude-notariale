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
  const items = loadAllArticles()
    .map(({ frontmatter }) => {
      const url = `${SITE_URL}/blog/${frontmatter.categorie}/${frontmatter.slug}`;
      return [
        "<item>",
        `<title>${echapper(frontmatter.title)}</title>`,
        `<link>${url}</link>`,
        `<guid>${url}</guid>`,
        `<pubDate>${new Date(`${frontmatter.date}T09:00:00Z`).toUTCString()}</pubDate>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0"><channel>` +
    `<title>Blog — Étude notariale, Paris</title>` +
    `<link>${SITE_URL}/blog</link>` +
    `<description>Publications de l'étude.</description>` +
    `<language>fr</language>` +
    items +
    `</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
