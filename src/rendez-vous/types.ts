/**
 * Modèle de domaine de la plateforme de prise de rendez-vous.
 *
 * Ce fichier est la source de vérité des types partagés par le moteur de
 * qualification, le parcours client, le tableau de bord interne et la couche
 * d'intégration CRM. Le schéma Prisma (prisma/schema.prisma) le reflète :
 * toute évolution doit être portée aux deux endroits.
 *
 * Aucun texte destiné au visiteur ne figure ici — les libellés vivent dans
 * motifs.ts et qualification/regles.ts, où ils sont identifiables et
 * soumis à la validation du notaire (CLAUDE.md §9).
 */

/** Motif de rendez-vous. Les douze catégories demandées par le notaire. */
export type MotifId =
  | "achat-immobilier"
  | "vente-immobiliere"
  | "succession"
  | "donation"
  | "contrat-de-mariage"
  | "pacs"
  | "divorce-separation"
  | "entreprise"
  | "procuration"
  | "conseil-patrimonial"
  | "question-generale"
  | "autre";

/**
 * État de validation du contenu d'un motif (CLAUDE.md §9 : aucun contenu de
 * fond n'est publié sans validation du notaire).
 * - `validé`   : questions fournies par le notaire, publiables.
 * - `à valider`: structure en place, libellés non validés — le parcours
 *                bascule vers une demande de rappel plutôt que d'afficher
 *                des questions inventées.
 */
export type EtatContenu = "validé" | "à valider";

/** Types de champs du formulaire dynamique. */
export type TypeQuestion =
  | "choix-unique"
  | "choix-multiple"
  | "oui-non"
  | "texte-court"
  | "texte-long"
  | "nombre"
  | "montant"
  | "date"
  | "code-postal";

/** Option d'une question à choix. */
export interface OptionQuestion {
  valeur: string;
  libelle: string;
  /** Précision facultative affichée sous l'option. */
  aide?: string;
}

/**
 * Condition d'affichage d'une question : elle n'apparaît que si la réponse
 * à `question` satisfait l'opérateur. Permet les embranchements dynamiques
 * sans code spécifique par motif.
 */
export interface Condition {
  question: string;
  operateur: "égal" | "différent" | "parmi" | "renseigné" | "supérieur à";
  /** Booléen accepté : les questions « oui / non » produisent true ou false. */
  valeur?: string | number | boolean | readonly string[];
}

/** Une question du formulaire de qualification. */
export interface Question {
  /** Identifiant stable — sert de clé de réponse et de correspondance CRM. */
  id: string;
  libelle: string;
  type: TypeQuestion;
  options?: readonly OptionQuestion[];
  /** Texte d'aide contextuelle, affiché sous le champ. */
  aide?: string;
  obligatoire?: boolean;
  /** N'afficher que si toutes ces conditions sont vraies. */
  afficherSi?: readonly Condition[];
  /** Unité affichée en suffixe (« € », « ans »…). */
  unite?: string;
}

/** Réponses saisies, indexées par identifiant de question. */
export type Reponses = Record<string, ReponseValeur>;
export type ReponseValeur = string | number | boolean | readonly string[] | null;

/**
 * Règle d'évaluation : lorsque toutes les conditions sont satisfaites, la
 * règle ajoute des points d'urgence ou de complexité, réclame des documents
 * et peut imposer une compétence particulière à l'interlocuteur.
 */
export interface RegleEvaluation {
  /** Motif de la règle, repris tel quel dans la synthèse interne. */
  intitule: string;
  si: readonly Condition[];
  urgence?: number;
  complexite?: number;
  /** Identifiants de documents à réclamer (voir documents.ts). */
  documents?: readonly string[];
  /** Compétence requise chez l'interlocuteur (voir affectation). */
  competence?: CompetenceId;
}

/** Compétences déclarées par les professionnels de l'étude. */
export type CompetenceId =
  | "immobilier"
  | "succession"
  | "famille"
  | "entreprise"
  | "patrimoine"
  | "international";

/** Définition complète d'un motif : présentation, questions, règles. */
export interface Motif {
  id: MotifId;
  libelle: string;
  /** Description courte affichée sur la carte de choix. */
  description: string;
  /** Nom d'icône (voir composant Icone du module). */
  icone: string;
  etatContenu: EtatContenu;
  /** Compétence par défaut, avant application des règles. */
  competenceParDefaut: CompetenceId;
  /** Durée de rendez-vous par défaut, en minutes. */
  dureeParDefaut: number;
  questions: readonly Question[];
  regles: readonly RegleEvaluation[];
  /** Documents demandés quel que soit le détail des réponses. */
  documentsSocle?: readonly string[];
}

/** Niveaux restitués par le moteur, volontairement peu nombreux. */
export type NiveauUrgence = "standard" | "prioritaire" | "urgent";
export type NiveauComplexite = "simple" | "intermédiaire" | "élevée";

/** Résultat de l'évaluation d'un dossier par le moteur de qualification. */
export interface Evaluation {
  motif: MotifId;
  urgence: NiveauUrgence;
  complexite: NiveauComplexite;
  /** Score brut, conservé pour le tri du tableau de bord interne. */
  scoreUrgence: number;
  scoreComplexite: number;
  /** Compétence retenue pour l'affectation. */
  competence: CompetenceId;
  /** Durée de rendez-vous proposée, en minutes. */
  dureeMinutes: number;
  /** Documents à fournir, dédupliqués. */
  documents: readonly string[];
  /** Intitulés des règles déclenchées — trace lisible pour l'étude. */
  motifsDeclenches: readonly string[];
}

/** Formats de rendez-vous proposés. */
export type FormatRendezVous = "etude" | "visioconference" | "telephone" | "exterieur";

/** Civilités proposées. */
export type Civilite = "madame" | "monsieur" | "non-precisee";

/** Coordonnées du demandeur. */
export interface Coordonnees {
  civilite: Civilite;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  dateNaissance?: string;
  langue: string;
  moyenContactPrefere: "email" | "telephone";
  consentement: boolean;
}

/** Professionnel de l'étude pouvant recevoir un rendez-vous. */
export interface Professionnel {
  id: string;
  nom: string;
  fonction: string;
  competences: readonly CompetenceId[];
  langues: readonly string[];
  /** Chemin d'une photo dans /public, facultatif. */
  photo?: string;
  /** Formats de rendez-vous acceptés. */
  formats: readonly FormatRendezVous[];
  /** Complexité maximale traitée — un clerc ne prend pas un dossier élevé. */
  complexiteMaximale: NiveauComplexite;
}

/** Créneau proposé au client. */
export interface Creneau {
  /** Début en ISO 8601 avec fuseau. */
  debut: string;
  fin: string;
  professionnelId: string;
  formats: readonly FormatRendezVous[];
}

/**
 * Statuts du parcours (spécification du notaire). Ils pilotent le tableau de
 * bord interne et sont mis en correspondance avec ceux du CRM
 * (crm/correspondances.ts).
 */
export type StatutDemande =
  | "brouillon"
  | "qualification-en-cours"
  | "attente-documents"
  | "prete-a-planifier"
  | "rendez-vous-confirme"
  | "rendez-vous-a-valider"
  | "rendez-vous-realise"
  | "annule"
  | "sans-suite"
  | "converti-en-dossier";

/** Une demande de rendez-vous, du brouillon à la conversion. */
export interface Demande {
  id: string;
  /** Référence lisible communiquée au client (ex. « RDV-2026-0042 »). */
  reference: string;
  statut: StatutDemande;
  motif: MotifId;
  reponses: Reponses;
  evaluation: Evaluation;
  coordonnees: Coordonnees;
  format: FormatRendezVous;
  professionnelId?: string;
  /** Début du rendez-vous en ISO 8601, absent tant qu'il n'est pas réservé. */
  creneauDebut?: string;
  creneauFin?: string;
  documentsFournis: readonly string[];
  creeLe: string;
  modifieLe: string;
}
