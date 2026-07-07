import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

/** Chaîne sentinelle du §9 de CLAUDE.md — bloquante au build de production. */
export const PLACEHOLDER = "[CONTENU À VALIDER — NE PAS PUBLIER]";

/** Slugs d'expertise — liste fermée du §6 de CLAUDE.md. */
export const EXPERTISE_SLUGS = [
  "immobilier-residentiel",
  "immobilier-commercial",
  "vefa",
  "promotion-immobiliere",
  "marchands-de-biens",
  "sci",
  "fiscalite-immobiliere",
  "successions",
  "successions-internationales",
  "donations",
  "partage",
  "divorce",
  "structuration-patrimoniale",
  "transmission-entreprise",
  "baux-commerciaux",
  "expatries",
  "investisseurs-etrangers",
  "family-office",
] as const;

export type ExpertiseSlug = (typeof EXPERTISE_SLUGS)[number];

const slugSchema = z.enum(EXPERTISE_SLUGS);

export const expertiseFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: slugSchema,
  description: z.string().min(1),
  related: z.array(slugSchema).min(3).max(5),
  faq: z
    .array(z.object({ question: z.string().min(1), reponse: z.string().min(1) }))
    .default([]),
});

export type ExpertiseFrontmatter = z.infer<typeof expertiseFrontmatterSchema>;

export const articleFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categorie: z.string().min(1),
  /** Page d'expertise pilier vers laquelle l'article renvoie (§6). */
  pillar: slugSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: z.string().min(1),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface Expertise {
  frontmatter: ExpertiseFrontmatter;
  body: string;
}

/** Charge et valide une expertise ; toute incohérence fait échouer le build. */
export function loadExpertise(slug: ExpertiseSlug): Expertise {
  const filePath = path.join(CONTENT_DIR, "expertises", `${slug}.mdx`);
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  const frontmatter = expertiseFrontmatterSchema.parse(data);
  if (frontmatter.slug !== slug) {
    throw new Error(
      `Frontmatter incohérent : slug « ${frontmatter.slug} » dans ${slug}.mdx`,
    );
  }
  return { frontmatter, body: content };
}

export function loadAllExpertises(): Expertise[] {
  return EXPERTISE_SLUGS.map((slug) => loadExpertise(slug));
}
