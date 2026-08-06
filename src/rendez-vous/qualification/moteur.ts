/**
 * Moteur de qualification : embranchements, évaluation et orientation.
 *
 * Le moteur est une fonction pure — mêmes réponses, même résultat — ce qui le
 * rend testable sans base de données ni réseau, et permet de rejouer
 * l'évaluation d'un dossier ancien à l'identique.
 *
 * Il ne délivre aucun conseil : il classe un dossier pour l'étude (durée,
 * interlocuteur, pièces, ordre de traitement). Cette limite est structurelle,
 * pas seulement rédactionnelle (CLAUDE.md §3 et demande du notaire).
 */
import type {
  Condition,
  Evaluation,
  Motif,
  NiveauComplexite,
  NiveauUrgence,
  Question,
  Reponses,
  ReponseValeur,
} from "../types";

/**
 * Valeurs calculées par le moteur, utilisables dans les conditions comme des
 * réponses ordinaires. Leur identifiant commence par un tiret bas.
 * `_joursDepuisDeces` : nombre de jours écoulés depuis la date saisie.
 */
function valeursDerivees(reponses: Reponses, maintenant: Date): Reponses {
  const derivees: Reponses = {};
  const dateDeces = reponses["date-deces"];
  if (typeof dateDeces === "string" && dateDeces.length > 0) {
    const deces = new Date(dateDeces);
    if (!Number.isNaN(deces.getTime())) {
      const jours = Math.floor((maintenant.getTime() - deces.getTime()) / 86_400_000);
      derivees["_joursDepuisDeces"] = jours;
    }
  }
  return derivees;
}

/** Évalue une condition unique contre un jeu de réponses. */
function conditionSatisfaite(condition: Condition, reponses: Reponses): boolean {
  const valeur = reponses[condition.question];
  switch (condition.operateur) {
    case "renseigné":
      return valeur !== undefined && valeur !== null && valeur !== "";
    case "égal":
      return valeur === condition.valeur;
    case "différent":
      return valeur !== condition.valeur;
    case "parmi": {
      if (!Array.isArray(condition.valeur)) return false;
      const attendues = condition.valeur as readonly string[];
      if (Array.isArray(valeur)) {
        return (valeur as readonly string[]).some((v) => attendues.includes(v));
      }
      return typeof valeur === "string" && attendues.includes(valeur);
    }
    case "supérieur à":
      return typeof valeur === "number" && typeof condition.valeur === "number"
        ? valeur > condition.valeur
        : false;
    default:
      return false;
  }
}

/** Vrai si toutes les conditions sont satisfaites (liste vide = vrai). */
function toutesSatisfaites(
  conditions: readonly Condition[] | undefined,
  reponses: Reponses,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((condition) => conditionSatisfaite(condition, reponses));
}

/**
 * Questions effectivement affichées, compte tenu des réponses déjà données.
 * Une question masquée ne peut jamais être obligatoire : c'est ce qui rend
 * les embranchements sûrs — on ne bloque pas le parcours sur un champ absent.
 */
export function questionsVisibles(
  motif: Motif,
  reponses: Reponses,
  questionsCommunes: readonly Question[] = [],
): readonly Question[] {
  return [...motif.questions, ...questionsCommunes].filter((question) =>
    toutesSatisfaites(question.afficherSi, reponses),
  );
}

/** Une réponse est-elle considérée comme fournie ? */
function reponseFournie(valeur: ReponseValeur | undefined): boolean {
  if (valeur === undefined || valeur === null || valeur === "") return false;
  if (Array.isArray(valeur)) return valeur.length > 0;
  return true;
}

/**
 * Questions visibles, obligatoires et encore sans réponse. Le parcours s'en
 * sert pour n'autoriser l'étape suivante qu'une fois le nécessaire renseigné.
 */
export function questionsManquantes(
  motif: Motif,
  reponses: Reponses,
  questionsCommunes: readonly Question[] = [],
): readonly Question[] {
  return questionsVisibles(motif, reponses, questionsCommunes).filter(
    (question) => question.obligatoire === true && !reponseFournie(reponses[question.id]),
  );
}

/** Seuils de bascule des scores vers les niveaux affichés. */
const SEUIL_URGENCE = { prioritaire: 2, urgent: 4 } as const;
const SEUIL_COMPLEXITE = { intermediaire: 2, elevee: 4 } as const;

function niveauUrgence(score: number): NiveauUrgence {
  if (score >= SEUIL_URGENCE.urgent) return "urgent";
  if (score >= SEUIL_URGENCE.prioritaire) return "prioritaire";
  return "standard";
}

function niveauComplexite(score: number): NiveauComplexite {
  if (score >= SEUIL_COMPLEXITE.elevee) return "élevée";
  if (score >= SEUIL_COMPLEXITE.intermediaire) return "intermédiaire";
  return "simple";
}

/** Majoration de durée appliquée selon la complexité constatée. */
const MAJORATION_DUREE: Record<NiveauComplexite, number> = {
  simple: 0,
  intermédiaire: 15,
  élevée: 30,
};

/**
 * Évalue un dossier : urgence, complexité, compétence requise, durée de
 * rendez-vous et pièces à réunir.
 *
 * `maintenant` est injecté pour rendre l'évaluation déterministe et
 * reproductible ; sans lui, un même dossier changerait de score au fil du
 * temps et les tests seraient instables.
 */
export function evaluer(
  motif: Motif,
  reponses: Reponses,
  maintenant: Date = new Date(),
): Evaluation {
  const contexte: Reponses = { ...reponses, ...valeursDerivees(reponses, maintenant) };

  let scoreUrgence = 0;
  let scoreComplexite = 0;
  let competence = motif.competenceParDefaut;
  const documents = new Set<string>(motif.documentsSocle ?? []);
  const motifsDeclenches: string[] = [];

  for (const regle of motif.regles) {
    if (!toutesSatisfaites(regle.si, contexte)) continue;
    scoreUrgence += regle.urgence ?? 0;
    scoreComplexite += regle.complexite ?? 0;
    for (const document of regle.documents ?? []) documents.add(document);
    // La dernière compétence exigée l'emporte : les règles sont ordonnées du
    // général au particulier dans regles.ts.
    if (regle.competence) competence = regle.competence;
    motifsDeclenches.push(regle.intitule);
  }

  const complexite = niveauComplexite(scoreComplexite);

  return {
    motif: motif.id,
    urgence: niveauUrgence(scoreUrgence),
    complexite,
    scoreUrgence,
    scoreComplexite,
    competence,
    dureeMinutes: motif.dureeParDefaut + MAJORATION_DUREE[complexite],
    documents: [...documents],
    motifsDeclenches,
  };
}

/**
 * Le parcours complet n'est ouvert que pour les motifs dont les questions ont
 * été validées par le notaire. Pour les autres, la plateforme ne bricole pas
 * un questionnaire : elle propose une demande de rappel, où l'étude qualifie
 * elle-même le besoin (CLAUDE.md §9).
 */
export function parcoursDisponible(motif: Motif): boolean {
  return motif.etatContenu === "validé" && motif.questions.length > 0;
}
