/**
 * Garde de contenu — CLAUDE.md §9.
 * 1. Valide les frontmatters des 18 expertises (liste fermée du §6).
 * 2. Recense les placeholders ; bloque le build lorsqu'il s'agit d'un
 *    déploiement de production (VERCEL_ENV=production).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PLACEHOLDER = "[CONTENU À VALIDER — NE PAS PUBLIER]";

const SLUGS = [
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
];

const racine = process.cwd();
const erreurs = [];

// 1. Validation des frontmatters d'expertise
const dossierExpertises = path.join(racine, "content", "expertises");
for (const slug of SLUGS) {
  const fichier = path.join(dossierExpertises, `${slug}.mdx`);
  if (!fs.existsSync(fichier)) {
    erreurs.push(`${slug}.mdx : fichier manquant`);
    continue;
  }
  const { data } = matter.read(fichier);
  if (data.slug !== slug) erreurs.push(`${slug}.mdx : slug incohérent (« ${data.slug} »)`);
  if (!data.title) erreurs.push(`${slug}.mdx : title manquant`);
  if (!data.description) erreurs.push(`${slug}.mdx : description manquante`);
  if (!Array.isArray(data.related) || data.related.length < 3 || data.related.length > 5) {
    erreurs.push(`${slug}.mdx : related doit contenir 3 à 5 slugs`);
  } else {
    for (const r of data.related) {
      if (!SLUGS.includes(r)) erreurs.push(`${slug}.mdx : related inconnu « ${r} »`);
      if (r === slug) erreurs.push(`${slug}.mdx : related ne peut pas se référencer lui-même`);
    }
  }
}

if (erreurs.length > 0) {
  console.error("Contenu invalide — build interrompu :");
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}

// 2. Recensement des placeholders
const suffixes = [".ts", ".tsx", ".mdx", ".md"];
const exclusions = new Set(["node_modules", ".next", ".git", "docs"]);

function scanner(dossier) {
  const fautifs = [];
  for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (exclusions.has(entree.name)) continue;
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) {
      fautifs.push(...scanner(chemin));
    } else if (suffixes.some((s) => entree.name.endsWith(s))) {
      if (fs.readFileSync(chemin, "utf8").includes(PLACEHOLDER)) {
        fautifs.push(path.relative(racine, chemin));
      }
    }
  }
  return fautifs;
}

const fautifs = scanner(racine);

if (process.env.VERCEL_ENV === "production" && fautifs.length > 0) {
  console.error("Build de production bloqué — placeholders présents (CLAUDE.md §9) :");
  for (const f of fautifs) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `Contenu vérifié : ${SLUGS.length} expertises valides, ${fautifs.length} fichier(s) avec placeholders (tolérés hors production).`,
);
