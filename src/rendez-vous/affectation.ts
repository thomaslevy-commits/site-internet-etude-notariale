/**
 * Affectation de l'interlocuteur (étape 6 du parcours).
 *
 * Deux modes coexistent, comme demandé : automatique, où la plateforme
 * propose l'interlocuteur le mieux placé, et manuel, où le demandeur choisit
 * lui-même parmi ceux qui peuvent traiter son dossier.
 *
 * L'affectation automatique est un CLASSEMENT explicite, pas une boîte noire :
 * chaque critère rapporte des points et la raison du choix est restituée. Une
 * affectation que l'étude ne peut pas expliquer serait ingérable au quotidien.
 *
 * Le critère de disponibilité réelle n'est pas traité ici : il dépend du
 * calendrier et intervient à l'étape 7, en filtrant les créneaux du
 * professionnel retenu.
 */
import type { Evaluation, FormatRendezVous, Professionnel } from "./types";
import { accepteComplexite, couvreCompetence, PROFESSIONNELS } from "./professionnels";

export interface CritereAffectation {
  /** Contexte du dossier, issu du moteur de qualification. */
  evaluation: Evaluation;
  format: FormatRendezVous;
  /** Langue souhaitée par le demandeur. */
  langue?: string;
  /** Vrai si le demandeur est déjà connu de l'étude (fiche CRM existante). */
  clientExistant?: boolean;
  /** Identifiant du professionnel ayant déjà suivi ce client, le cas échéant. */
  professionnelHabituelId?: string;
}

export interface PropositionAffectation {
  professionnel: Professionnel;
  score: number;
  /** Raisons du classement, affichables en interne. */
  raisons: readonly string[];
}

/**
 * Classe les professionnels aptes à recevoir ce rendez-vous.
 * Les inaptes sont écartés, jamais classés en dernier : proposer un créneau
 * chez quelqu'un qui ne peut pas traiter le dossier ferait perdre du temps
 * au demandeur comme à l'étude.
 */
export function classerProfessionnels(
  criteres: CritereAffectation,
  candidats: readonly Professionnel[] = PROFESSIONNELS,
): readonly PropositionAffectation[] {
  const propositions: PropositionAffectation[] = [];

  for (const professionnel of candidats) {
    // Conditions éliminatoires.
    if (!professionnel.formats.includes(criteres.format)) continue;
    if (!accepteComplexite(professionnel, criteres.evaluation.complexite)) continue;

    let score = 0;
    const raisons: string[] = [];

    if (couvreCompetence(professionnel, criteres.evaluation.competence)) {
      score += 5;
      raisons.push(`Compétence « ${criteres.evaluation.competence} » couverte`);
    } else {
      // Sans la compétence requise, le professionnel reste possible mais
      // n'est proposé qu'à défaut d'un autre.
      score -= 3;
      raisons.push("Compétence requise non déclarée");
    }

    if (criteres.langue && professionnel.langues.includes(criteres.langue)) {
      score += 2;
      raisons.push(`Langue « ${criteres.langue} » parlée`);
    }

    if (
      criteres.professionnelHabituelId &&
      professionnel.id === criteres.professionnelHabituelId
    ) {
      score += 4;
      raisons.push("Interlocuteur habituel du client");
    }

    // Un dossier urgent ou complexe va au profil le plus qualifié ; un dossier
    // simple est au contraire orienté vers le moins chargé en compétences,
    // afin de ne pas mobiliser inutilement le notaire.
    if (criteres.evaluation.urgence === "urgent" || criteres.evaluation.complexite === "élevée") {
      if (professionnel.complexiteMaximale === "élevée") {
        score += 3;
        raisons.push("Dossier urgent ou complexe — profil le plus qualifié");
      }
    } else if (criteres.evaluation.complexite === "simple") {
      if (professionnel.complexiteMaximale === "simple") {
        score += 2;
        raisons.push("Dossier simple — traitement par le pôle concerné");
      }
    }

    propositions.push({ professionnel, score, raisons });
  }

  return propositions.sort((a, b) => b.score - a.score);
}

/** Interlocuteur retenu en mode automatique, ou `undefined` si aucun n'est apte. */
export function affecterAutomatiquement(
  criteres: CritereAffectation,
  candidats: readonly Professionnel[] = PROFESSIONNELS,
): PropositionAffectation | undefined {
  return classerProfessionnels(criteres, candidats)[0];
}
