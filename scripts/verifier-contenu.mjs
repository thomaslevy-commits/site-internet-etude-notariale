/**
 * Garde de contenu — CLAUDE.md §9.
 *
 * 1. Valide les frontmatters des 18 expertises (liste fermée du §6).
 * 2. Vérifie que les quatre pages légales existent et sont structurées.
 * 3. Recense les placeholders bloquants ; interrompt le build lorsqu'il
 *    s'agit d'un déploiement de production (VERCEL_ENV=production).
 * 4. Recense les éléments « [À VALIDER — … ] » — non bloquants, mais listés
 *    à chaque construction pour qu'ils ne s'oublient pas.
 *
 * Ce script n'était appelé nulle part : ni par package.json, ni par la CI.
 * Il est désormais branché sur `prebuild` et sur le pipeline. Il comportait
 * par ailleurs un défaut qui l'aurait rendu inutilisable : parcourant tout
 * le dépôt à la recherche de la chaîne sentinelle, il trouvait la constante
 * qui la définit dans src/lib/content.ts et aurait donc fait échouer
 * *toute* construction de production, y compris sur un contenu irréprochable.
 * Les fichiers qui définissent légitimement la sentinelle sont exclus.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PLACEHOLDER = "[CONTENU À VALIDER — NE PAS PUBLIER]";
const A_VALIDER = /\[À VALIDER[^\]]*\]/g;

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

const PAGES_LEGALES = [
  "mentions-legales",
  "politique-de-confidentialite",
  "cookies",
  "accessibilite",
];

/**
 * Fichiers où la sentinelle est attendue : celui qui la définit, celui qui
 * la cherche, et le cahier des charges qui l'institue (§9). Les y traiter
 * comme des fautes ferait échouer toute construction de production, même
 * sur un contenu irréprochable.
 */
const DEFINITIONS = new Set([
  path.join("src", "lib", "content.ts"),
  path.join("scripts", "verifier-contenu.mjs"),
  "CLAUDE.md",
]);

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

// 2. Présence et structure des pages légales
const dossierLegal = path.join(racine, "content", "legal");
for (const page of PAGES_LEGALES) {
  const fichier = path.join(dossierLegal, `${page}.mdx`);
  if (!fs.existsSync(fichier)) {
    erreurs.push(`legal/${page}.mdx : fichier manquant`);
    continue;
  }
  const { data } = matter.read(fichier);
  if (!data.titre) erreurs.push(`legal/${page}.mdx : titre manquant`);
  if (!data.description) erreurs.push(`legal/${page}.mdx : description manquante`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.miseAJour ?? "")) {
    erreurs.push(`legal/${page}.mdx : miseAJour absente ou mal formée (AAAA-MM-JJ)`);
  }
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    erreurs.push(`legal/${page}.mdx : aucune section`);
  }
}

if (erreurs.length > 0) {
  console.error("Contenu invalide — build interrompu :");
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}

// 3 et 4. Parcours des fichiers publiés
const suffixes = [".ts", ".tsx", ".mdx", ".md"];
const exclusions = new Set(["node_modules", ".next", ".git", "docs", "out"]);

function scanner(dossier) {
  const resultats = [];
  for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (exclusions.has(entree.name)) continue;
    // Un dossier de contenu préfixé par « _ » n'est pas publié : il sert de
    // réserve de gabarits et n'est chargé par aucune route.
    if (entree.isDirectory() && entree.name.startsWith("_")) continue;
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) {
      resultats.push(...scanner(chemin));
      continue;
    }
    if (!suffixes.some((s) => entree.name.endsWith(s))) continue;
    const relatif = path.relative(racine, chemin);
    if (DEFINITIONS.has(relatif)) continue;
    const texte = fs.readFileSync(chemin, "utf8");
    resultats.push({
      fichier: relatif,
      placeholder: texte.includes(PLACEHOLDER),
      aValider: texte.match(A_VALIDER) ?? [],
    });
  }
  return resultats;
}

const fichiers = scanner(racine);
const bloquants = fichiers.filter((f) => f.placeholder);
const aValider = fichiers.filter((f) => f.aValider.length > 0);

if (aValider.length > 0) {
  const total = aValider.reduce((n, f) => n + f.aValider.length, 0);
  console.log(`\n${total} élément(s) en attente de validation du notaire :`);
  for (const f of aValider) {
    for (const marque of f.aValider) {
      const extrait = marque.length > 110 ? `${marque.slice(0, 107)}…` : marque;
      console.log(`  - ${f.fichier} : ${extrait}`);
    }
  }
  console.log("");
}

if (bloquants.length > 0) {
  const message = [
    "Placeholders « NE PAS PUBLIER » présents (CLAUDE.md §9) :",
    ...bloquants.map((f) => `  - ${f.fichier}`),
  ].join("\n");
  if (process.env.VERCEL_ENV === "production" || process.env.CONTENU_STRICT === "1") {
    console.error(`Build de production bloqué — ${message}`);
    process.exit(1);
  }
  console.warn(`Avertissement — ${message}`);
}

console.log(
  `Contenu vérifié : ${SLUGS.length} expertises, ${PAGES_LEGALES.length} pages légales, ` +
    `${bloquants.length} fichier(s) avec placeholder bloquant.`,
);
