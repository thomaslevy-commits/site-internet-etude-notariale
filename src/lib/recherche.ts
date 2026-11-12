import {
  CATEGORIE_LABELS,
  EXPERTISE_SLUGS,
  loadAllArticles,
  loadExpertise,
  loadFaq,
} from "@/lib/content";

export type TypeResultat = "Page" | "Expertise" | "Publication" | "Question";

export interface EntreeRecherche {
  type: TypeResultat;
  titre: string;
  /** Ligne affichée sous le titre. Toujours tirée du contenu validé (§9). */
  extrait: string;
  href: string;
  /** Texte cherché mais non affiché : il élargit les correspondances
   *  (« préemption » trouve l'immobilier résidentiel) sans rien publier de
   *  plus que ce que la page elle-même publie déjà. */
  corpus: string;
}

/**
 * Libellés de navigation des pages sans frontmatter. Textes fonctionnels,
 * au sens du §9 : ils disent où mène le lien, pas ce que dit le droit.
 */
const PAGES: EntreeRecherche[] = [
  { type: "Page", titre: "L'étude", extrait: "Présentation, méthode et langues de travail de l'étude.", href: "/etude", corpus: "notaire thomas levy equipe methode langues" },
  { type: "Page", titre: "Expertises", extrait: "L'ensemble des domaines d'intervention de l'étude.", href: "/expertises", corpus: "domaines competences" },
  { type: "Page", titre: "International", extrait: "Informations pratiques pour une clientèle étrangère ou non résidente.", href: "/international", corpus: "english deutsch chinois chinese 中文 etranger non resident expatrie" },
  { type: "Page", titre: "Publications", extrait: "Les articles publiés par l'étude.", href: "/blog", corpus: "blog articles actualites" },
  { type: "Page", titre: "Tarif", extrait: "Émoluments réglementés, débours, taxes et honoraires libres.", href: "/tarif", corpus: "prix frais cout emoluments honoraires debours taxes" },
  { type: "Page", titre: "Questions fréquentes", extrait: "Les réponses de l'étude, classées par thème.", href: "/faq", corpus: "faq aide" },
  { type: "Page", titre: "Contact et accès", extrait: "Coordonnées, plan d'accès et formulaire de contact.", href: "/contact", corpus: "adresse telephone email rendez-vous plan acces metro" },
];

function couper(texte: string, longueur = 150): string {
  const propre = texte.replace(/\s+/g, " ").trim();
  if (propre.length <= longueur) return propre;
  return `${propre.slice(0, longueur).replace(/\s+\S*$/, "")}…`;
}

/** Construit l'index au rendu serveur : les contenus vivent sur disque et
 *  ne changent qu'au déploiement, il n'y a donc rien à interroger ensuite. */
export function construireIndexRecherche(): EntreeRecherche[] {
  const expertises = EXPERTISE_SLUGS.map((slug): EntreeRecherche => {
    const { frontmatter: fm } = loadExpertise(slug);
    return {
      type: "Expertise",
      titre: fm.title,
      extrait: couper(fm.description),
      href: `/expertises/${slug}`,
      corpus: [
        ...(fm.problematiques ?? []),
        ...(fm.etapes ?? []),
        ...fm.faq.map((q) => q.question),
      ].join(" "),
    };
  });

  const publications = loadAllArticles().map(({ frontmatter: fm, body }): EntreeRecherche => {
    const intertitres = body.match(/^#{2,3} .+$/gm) ?? [];
    return {
      type: "Publication",
      titre: fm.title,
      extrait: couper(fm.description ?? CATEGORIE_LABELS[fm.categorie]),
      href: `/blog/${fm.categorie}/${fm.slug}`,
      corpus: `${CATEGORIE_LABELS[fm.categorie]} ${intertitres.join(" ")}`,
    };
  });

  // Ancres identiques à celles de src/app/faq/page.tsx.
  const questions = loadFaq().themes.flatMap((theme, t) =>
    theme.questions.map((q, i): EntreeRecherche => ({
      type: "Question",
      titre: q.question,
      extrait: couper(q.reponse),
      href: `/faq#faq-${t + 1}-${i + 1}`,
      corpus: `${theme.titre} ${q.reponse}`,
    })),
  );

  return [...PAGES, ...expertises, ...publications, ...questions];
}
