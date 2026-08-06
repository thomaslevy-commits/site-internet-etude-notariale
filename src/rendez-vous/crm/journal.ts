/**
 * Journal des synchronisations CRM et politique de nouvelle tentative.
 *
 * Deux besoins, tenus séparés :
 *   — savoir ce qui a été tenté, quand, avec quel résultat (trace exploitable
 *     par l'étude et par un audit) ;
 *   — décider s'il faut réessayer et après combien de temps.
 *
 * Tout ce qui décide est PUR : `delaiAvantNouvelleTentative` et
 * `planifierTentatives` ne lisent ni horloge, ni environnement, ni réseau.
 * L'horloge et l'aléa sont injectés, ce qui rend la politique reproductible
 * en test et rejouable à l'identique lors d'une analyse d'incident.
 *
 * SECRET PROFESSIONNEL (CLAUDE.md §2). Le journal enregistre des métadonnées :
 * opération, référence de demande, nombre de champs, identifiants de champs et
 * de pièces, code d'erreur. Jamais de valeur de réponse, jamais de nom de
 * client, jamais de contenu de pièce. `resumerReponses` est l'unique porte
 * d'entrée pour décrire des réponses : elle ne laisse passer que les clés.
 */
import {
  estReessayable,
  type CodeErreurCrm,
  type ErreurCrm,
  type OperationCrm,
} from "./adaptateur";
import type { Reponses } from "../types";

/* ------------------------------------------------------------------ */
/* Entrées de journal                                                  */
/* ------------------------------------------------------------------ */

export type IssueTentative =
  | "succes"
  /** Échec réessayable : une nouvelle tentative est programmée. */
  | "echec-transitoire"
  /** Échec définitif ou dernier essai épuisé : reprise manuelle par l'étude. */
  | "echec-definitif"
  /** Aucun CRM configuré : l'appel a été journalisé, pas exécuté. */
  | "simulee";

export interface EntreeJournal {
  /** Horodatage ISO 8601 avec fuseau. */
  readonly horodatage: string;
  /** Adaptateur ayant produit l'entrée (« journal », « exemple-crm »…). */
  readonly adaptateur: string;
  readonly operation: OperationCrm;
  /** Référence lisible de la demande — jamais le nom du demandeur. */
  readonly referenceDemande: string;
  /** Numéro d'essai, à partir de 1. */
  readonly essai: number;
  readonly issue: IssueTentative;
  readonly dureeMs?: number;
  readonly code?: CodeErreurCrm;
  /** Message technique, sans donnée de dossier. */
  readonly message?: string;
  /** Identifiant de l'objet CRM créé ou visé. */
  readonly referenceCrm?: string;
  /** Nombre de champs transmis — le contenu, lui, ne l'est jamais. */
  readonly champsTransmis?: number;
  /** Délai avant la prochaine tentative, en millisecondes. */
  readonly prochaineTentativeMs?: number;
}

/** Destination des entrées. Une implémentation en mémoire est fournie plus bas. */
export interface Journal {
  enregistrer(entree: EntreeJournal): void;
}

export interface JournalMemoire extends Journal {
  entrees(): readonly EntreeJournal[];
  /** Entrées d'une demande, dans l'ordre chronologique d'enregistrement. */
  parDemande(referenceDemande: string): readonly EntreeJournal[];
  vider(): void;
}

/**
 * Journal en mémoire, borné. Convient au développement et aux tests ; en
 * production, l'étude branchera un journal persistant (table PostgreSQL
 * hébergée en UE, avec purge conforme à la politique de rétention).
 */
export function creerJournalMemoire(capacite = 500): JournalMemoire {
  const entrees: EntreeJournal[] = [];
  return {
    enregistrer(entree) {
      entrees.push(entree);
      if (entrees.length > capacite) entrees.splice(0, entrees.length - capacite);
    },
    entrees() {
      return [...entrees];
    },
    parDemande(referenceDemande) {
      return entrees.filter((entree) => entree.referenceDemande === referenceDemande);
    },
    vider() {
      entrees.length = 0;
    },
  };
}

/**
 * Journal composite : diffuse chaque entrée à plusieurs destinations (mémoire
 * pour le tableau de bord, base pour la trace durable).
 */
export function composerJournaux(...journaux: readonly Journal[]): Journal {
  return {
    enregistrer(entree) {
      for (const journal of journaux) journal.enregistrer(entree);
    },
  };
}

/** Journal ne conservant rien — utile pour désactiver la trace en test. */
export const JOURNAL_INERTE: Journal = {
  enregistrer() {
    // Volontairement vide.
  },
};

/* ------------------------------------------------------------------ */
/* Construction d'entrées (fonctions pures)                            */
/* ------------------------------------------------------------------ */

/** Éléments communs à toutes les entrées. */
export interface ContexteEntree {
  readonly adaptateur: string;
  readonly operation: OperationCrm;
  readonly referenceDemande: string;
  readonly essai: number;
  readonly horodatage: string;
}

export function entreeSucces(
  contexte: ContexteEntree,
  details?: { dureeMs?: number; referenceCrm?: string; champsTransmis?: number },
): EntreeJournal {
  return { ...contexte, issue: "succes", ...retirerIndefinis(details ?? {}) };
}

export function entreeSimulee(
  contexte: ContexteEntree,
  details?: { referenceCrm?: string; champsTransmis?: number; message?: string },
): EntreeJournal {
  return { ...contexte, issue: "simulee", ...retirerIndefinis(details ?? {}) };
}

/**
 * Entrée d'échec. L'issue découle de la nature de l'erreur et de l'existence
 * d'une nouvelle tentative : un échec transitoire dont les essais sont épuisés
 * devient définitif, et doit être traité à la main.
 */
export function entreeEchec(
  contexte: ContexteEntree,
  erreur: ErreurCrm,
  details?: { dureeMs?: number; prochaineTentativeMs?: number | null },
): EntreeJournal {
  const prochaine = details?.prochaineTentativeMs ?? null;
  return {
    ...contexte,
    issue: prochaine === null ? "echec-definitif" : "echec-transitoire",
    code: erreur.code,
    message: erreur.message,
    ...retirerIndefinis({ dureeMs: details?.dureeMs }),
    ...(prochaine === null ? {} : { prochaineTentativeMs: prochaine }),
  };
}

/** Retire les clés à `undefined` pour ne pas polluer les entrées sérialisées. */
function retirerIndefinis<T extends Record<string, unknown>>(objet: T): Partial<T> {
  const resultat: Partial<T> = {};
  for (const [cle, valeur] of Object.entries(objet)) {
    if (valeur !== undefined) resultat[cle as keyof T] = valeur as T[keyof T];
  }
  return resultat;
}

/**
 * Description journalisable d'un jeu de réponses : le nombre de champs et
 * leurs IDENTIFIANTS de question. Les valeurs saisies — montants, dates,
 * situations familiales — ne sortent jamais d'ici.
 */
export function resumerReponses(reponses: Reponses): {
  readonly nombreChamps: number;
  readonly identifiants: readonly string[];
} {
  const identifiants = Object.keys(reponses).filter((cle) => {
    const valeur = reponses[cle];
    if (valeur === null || valeur === undefined || valeur === "") return false;
    if (Array.isArray(valeur)) return valeur.length > 0;
    return true;
  });
  return { nombreChamps: identifiants.length, identifiants: identifiants.sort() };
}

/* ------------------------------------------------------------------ */
/* Politique de nouvelle tentative                                     */
/* ------------------------------------------------------------------ */

export interface PolitiqueNouvelleTentative {
  /** Nombre total d'essais, première tentative comprise. */
  readonly essaisMaximum: number;
  /** Délai après le premier échec, en millisecondes. */
  readonly delaiInitialMs: number;
  /** Facteur multiplicatif d'un essai au suivant. */
  readonly facteur: number;
  /** Plafond du délai : la progression exponentielle s'y arrête. */
  readonly delaiMaximumMs: number;
  /**
   * Gigue, en fraction du délai (0 à 1). Elle désynchronise les reprises
   * lorsque plusieurs demandes échouent en même temps — typiquement après une
   * indisponibilité du CRM, où toutes reprendraient sinon à la même seconde.
   */
  readonly gigueRelative: number;
}

/**
 * Réglage par défaut : cinq essais, de 1 s à 60 s, sur environ deux minutes.
 * Au-delà, un CRM toujours muet relève de l'incident, pas de la reprise
 * automatique — l'entrée est signalée à l'étude.
 */
export const POLITIQUE_PAR_DEFAUT: PolitiqueNouvelleTentative = {
  essaisMaximum: 5,
  delaiInitialMs: 1_000,
  facteur: 2,
  delaiMaximumMs: 60_000,
  gigueRelative: 0.2,
};

/**
 * Délai avant nouvelle tentative, en millisecondes, ou `null` s'il faut
 * abandonner (erreur définitive ou essais épuisés).
 *
 * Fonction pure : `aleatoire` est injecté ; avec `() => 0.5`, le résultat est
 * entièrement déterministe.
 *
 * Un délai imposé par le CRM (`attendreMs`, en-tête Retry-After) l'emporte
 * toujours s'il est plus long : le respecter évite d'aggraver un dépassement
 * de quota.
 */
export function delaiAvantNouvelleTentative(
  politique: PolitiqueNouvelleTentative,
  essai: number,
  erreur: ErreurCrm,
  aleatoire: () => number = Math.random,
): number | null {
  if (!estReessayable(erreur)) return null;
  if (essai >= politique.essaisMaximum) return null;

  const brut = politique.delaiInitialMs * Math.pow(politique.facteur, Math.max(0, essai - 1));
  const plafonne = Math.min(brut, politique.delaiMaximumMs);
  const gigue = plafonne * politique.gigueRelative * (aleatoire() * 2 - 1);
  const avecGigue = Math.max(0, Math.round(plafonne + gigue));

  return erreur.attendreMs === undefined ? avecGigue : Math.max(avecGigue, erreur.attendreMs);
}

/**
 * Suite des délais appliqués à une erreur transitoire persistante. Sert à
 * documenter et à vérifier la politique — par exemple pour montrer au notaire
 * combien de temps une panne du CRM peut rester invisible pour l'étude.
 */
export function planifierTentatives(
  politique: PolitiqueNouvelleTentative,
  erreur: ErreurCrm,
  aleatoire: () => number = () => 0.5,
): readonly number[] {
  const delais: number[] = [];
  for (let essai = 1; essai < politique.essaisMaximum; essai += 1) {
    const delai = delaiAvantNouvelleTentative(politique, essai, erreur, aleatoire);
    if (delai === null) break;
    delais.push(delai);
  }
  return delais;
}

/** Durée totale, en millisecondes, avant abandon d'une opération. */
export function dureeTotaleAvantAbandon(
  politique: PolitiqueNouvelleTentative,
  erreur: ErreurCrm,
): number {
  return planifierTentatives(politique, erreur).reduce((somme, delai) => somme + delai, 0);
}

/* ------------------------------------------------------------------ */
/* Lecture du journal                                                  */
/* ------------------------------------------------------------------ */

export interface SyntheseJournal {
  readonly total: number;
  readonly succes: number;
  readonly simulees: number;
  readonly echecsTransitoires: number;
  readonly echecsDefinitifs: number;
  /** Opérations ayant fini en échec définitif : à reprendre manuellement. */
  readonly aReprendre: readonly { readonly referenceDemande: string; readonly operation: OperationCrm }[];
}

/** Synthèse d'un ensemble d'entrées, pour le tableau de bord interne. */
export function synthetiser(entrees: readonly EntreeJournal[]): SyntheseJournal {
  const aReprendre: { referenceDemande: string; operation: OperationCrm }[] = [];
  let succes = 0;
  let simulees = 0;
  let echecsTransitoires = 0;
  let echecsDefinitifs = 0;

  for (const entree of entrees) {
    switch (entree.issue) {
      case "succes":
        succes += 1;
        break;
      case "simulee":
        simulees += 1;
        break;
      case "echec-transitoire":
        echecsTransitoires += 1;
        break;
      case "echec-definitif":
        echecsDefinitifs += 1;
        aReprendre.push({
          referenceDemande: entree.referenceDemande,
          operation: entree.operation,
        });
        break;
    }
  }

  return {
    total: entrees.length,
    succes,
    simulees,
    echecsTransitoires,
    echecsDefinitifs,
    aReprendre,
  };
}
