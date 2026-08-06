/**
 * Port d'intégration CRM — contrat que tout adaptateur devra respecter.
 *
 * Le CRM cible n'est pas connu à ce jour : le notaire fournira le produit, le
 * lien et les accès. Ce fichier ne décrit donc AUCUN produit particulier. Il
 * fixe le vocabulaire et les opérations dont la plateforme a besoin ; chaque
 * adaptateur concret (Salesforce, HubSpot, Pipedrive, API métier notariale…)
 * traduira ces opérations dans son propre protocole, sans que le reste du
 * module de rendez-vous ait à changer.
 *
 * Trois principes structurent ce contrat :
 *
 * 1. Aucune exception n'est levée pour un échec attendu. Chaque méthode rend
 *    un `ResultatCrm` : soit une valeur, soit une `ErreurCrm` qui distingue
 *    l'échec TRANSITOIRE (à réessayer, voir journal.ts) de l'échec DÉFINITIF
 *    (à porter à la connaissance de l'étude). Un échec de synchronisation ne
 *    doit jamais faire échouer la prise de rendez-vous côté client.
 *
 * 2. SECRET PROFESSIONNEL (CLAUDE.md §2). Aucun contenu de dossier ne sort de
 *    l'étude : les pièces déposées sont transmises au CRM sous forme de
 *    RÉFÉRENCES (identifiant de stockage, type, taille, empreinte), jamais de
 *    contenu ni d'URL téléchargeable. De même, aucune notification émise par
 *    la plateforme ne contient d'élément de dossier — seulement une invitation
 *    à se connecter. Les messages d'erreur de ce module sont techniques et
 *    destinés au journal interne ; ils ne sont jamais affichés au demandeur.
 *
 * 3. Aucun secret en dur. Les accès proviennent exclusivement des variables
 *    d'environnement listées dans `VARIABLES_ENVIRONNEMENT_CRM`, à documenter
 *    dans `.env.example` le jour où le CRM sera connu.
 */
import type {
  CompetenceId,
  Coordonnees,
  Evaluation,
  FormatRendezVous,
  MotifId,
  Reponses,
  StatutDemande,
} from "../types";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

/**
 * Noms des variables d'environnement attendues. Elles ne sont lues qu'au sein
 * d'un adaptateur concret, côté serveur ; aucune ne doit être préfixée
 * `NEXT_PUBLIC_` — un jeton exposé au navigateur serait un incident.
 *
 * Tant que `CRM_FOURNISSEUR` est absent ou vaut « journal », la plateforme
 * utilise l'adaptateur de secours (adaptateur-journalisant.ts) et le parcours
 * fonctionne de bout en bout sans dépendance externe.
 */
export const VARIABLES_ENVIRONNEMENT_CRM = {
  /** Identifiant de l'adaptateur à activer (« journal » par défaut). */
  fournisseur: "CRM_FOURNISSEUR",
  /** Racine de l'API du CRM, sans barre oblique finale. */
  urlBase: "CRM_URL_BASE",
  /** Jeton d'API, pour les CRM à authentification par jeton statique. */
  jeton: "CRM_JETON_API",
  /** Identifiant client OAuth 2.0, pour les CRM à flux client_credentials. */
  clientId: "CRM_CLIENT_ID",
  /** Secret client OAuth 2.0. */
  clientSecret: "CRM_CLIENT_SECRET",
  /** Identifiant d'espace, d'organisation ou de compte, si le CRM en exige un. */
  espace: "CRM_ESPACE",
  /** Table de correspondance au format JSON (voir correspondances.ts). */
  correspondances: "CRM_CORRESPONDANCES_JSON",
} as const;

/** État de configuration renvoyé par `verifierConfiguration`. */
export interface EtatConfigurationCrm {
  /** Faux tant qu'aucun CRM n'est réellement branché. */
  readonly operationnel: boolean;
  /** Variables d'environnement attendues et absentes. */
  readonly variablesManquantes: readonly string[];
  /** Chemins de correspondance restés à remplir (voir correspondances.ts). */
  readonly correspondancesManquantes: readonly string[];
  /** Précision destinée au tableau de bord interne. */
  readonly remarque?: string;
}

/* ------------------------------------------------------------------ */
/* Opérations, erreurs et résultats                                    */
/* ------------------------------------------------------------------ */

/** Opérations du port. Sert de clé de journalisation et de politique de reprise. */
export type OperationCrm =
  | "verification-configuration"
  | "chargement-correspondances"
  | "recherche-contact"
  | "enregistrement-contact"
  | "creation-dossier"
  | "creation-opportunite"
  | "attribution"
  | "envoi-qualification"
  | "references-documents"
  | "synchronisation-statut"
  | "synchronisation-rendez-vous";

/**
 * Nature de l'erreur.
 * - `transitoire` : la même requête a des chances d'aboutir plus tard
 *   (réseau, quota, indisponibilité). Elle est réessayée avec temporisation.
 * - `definitive`  : réessayer ne changerait rien (données refusées, droits
 *   insuffisants, correspondance absente). L'entrée est signalée à l'étude
 *   pour reprise manuelle.
 */
export type NatureErreurCrm = "transitoire" | "definitive";

export type CodeErreurCrm =
  /** Aucun CRM configuré — situation nominale tant que le notaire n'a rien fourni. */
  | "non-configure"
  | "reseau"
  | "delai-depasse"
  | "limite-de-debit"
  | "service-indisponible"
  /** Écriture concurrente : à rejouer après relecture de la fiche. */
  | "conflit"
  | "authentification"
  | "autorisation"
  | "validation"
  | "introuvable"
  | "correspondance-manquante"
  | "reponse-illisible"
  | "inconnue";

/**
 * Nature associée à chaque code. Table explicite plutôt que règle implicite :
 * la frontière entre « à réessayer » et « à traiter à la main » doit rester
 * lisible par un tiers qui reprendrait le module.
 */
export const NATURE_PAR_CODE: Readonly<Record<CodeErreurCrm, NatureErreurCrm>> = {
  "non-configure": "definitive",
  reseau: "transitoire",
  "delai-depasse": "transitoire",
  "limite-de-debit": "transitoire",
  "service-indisponible": "transitoire",
  conflit: "transitoire",
  // Un jeton expiré peut être renouvelé par l'adaptateur ; l'échec reste
  // définitif ici pour éviter de marteler le CRM avec des accès invalides.
  authentification: "definitive",
  autorisation: "definitive",
  validation: "definitive",
  introuvable: "definitive",
  "correspondance-manquante": "definitive",
  "reponse-illisible": "definitive",
  inconnue: "definitive",
};

export interface ErreurCrm {
  readonly code: CodeErreurCrm;
  readonly nature: NatureErreurCrm;
  readonly operation: OperationCrm;
  /**
   * Message technique destiné au journal interne. Il ne doit contenir ni
   * réponse de qualification, ni pièce, ni élément de dossier — au plus des
   * identifiants et des noms de champs.
   */
  readonly message: string;
  /** Code de statut HTTP, lorsque le transport en fournit un. */
  readonly statutHttp?: number;
  /** Délai minimal imposé par le CRM avant nouvelle tentative (ms, en-tête Retry-After). */
  readonly attendreMs?: number;
}

export type ResultatCrm<T> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly erreur: ErreurCrm };

export function succes<T>(valeur: T): ResultatCrm<T> {
  return { ok: true, valeur };
}

export function echec<T>(erreur: ErreurCrm): ResultatCrm<T> {
  return { ok: false, erreur };
}

/** Construit une erreur en déduisant sa nature du code — jamais l'inverse. */
export function erreurCrm(
  code: CodeErreurCrm,
  operation: OperationCrm,
  message: string,
  details?: { statutHttp?: number; attendreMs?: number },
): ErreurCrm {
  return {
    code,
    nature: NATURE_PAR_CODE[code],
    operation,
    message,
    ...(details?.statutHttp === undefined ? {} : { statutHttp: details.statutHttp }),
    ...(details?.attendreMs === undefined ? {} : { attendreMs: details.attendreMs }),
  };
}

export function estReessayable(erreur: ErreurCrm): boolean {
  return erreur.nature === "transitoire";
}

/**
 * Traduction d'un statut HTTP en code d'erreur. Les adaptateurs REST peuvent
 * s'en servir tels quels ; ceux qui exposent des codes métier plus précis
 * doivent les préférer.
 */
export function codeDepuisStatutHttp(statut: number): CodeErreurCrm {
  if (statut === 401) return "authentification";
  if (statut === 403) return "autorisation";
  if (statut === 404) return "introuvable";
  if (statut === 409) return "conflit";
  if (statut === 422 || statut === 400) return "validation";
  if (statut === 429) return "limite-de-debit";
  if (statut === 408) return "delai-depasse";
  if (statut >= 500) return "service-indisponible";
  return "inconnue";
}

/* ------------------------------------------------------------------ */
/* Charges utiles                                                      */
/* ------------------------------------------------------------------ */

/** Référence d'un objet côté CRM. */
export interface ReferenceCrm {
  readonly id: string;
  /** URL de la fiche, si le CRM en fournit une — pour le tableau de bord interne. */
  readonly url?: string;
}

/** Options communes à tous les appels. */
export interface OptionsAppel {
  /** Permet d'abandonner un appel trop long sans bloquer la requête entrante. */
  readonly signal?: AbortSignal;
  /**
   * Clé d'idempotence. Elle vaut par convention `<référence demande>:<opération>`
   * afin qu'une nouvelle tentative ne crée pas de doublon côté CRM.
   */
  readonly cleIdempotence?: string;
}

/** Critère de recherche de doublon. Au moins un des deux champs est renseigné. */
export interface CritereRechercheContact {
  readonly email?: string;
  /** Normalisé au format E.164 avant appel ; sinon la recherche est illusoire. */
  readonly telephone?: string;
}

/** Fiche contact telle que restituée par le CRM. */
export interface ContactCrm {
  readonly reference: ReferenceCrm;
  readonly email?: string;
  readonly telephone?: string;
  readonly nomComplet?: string;
  /** Propriétaire actuel de la fiche côté CRM, si le CRM l'expose. */
  readonly proprietaireCrm?: string;
  /** Date de dernière modification (ISO 8601), utile pour départager deux doublons. */
  readonly modifieLe?: string;
}

export interface ResultatRechercheContact {
  /** Correspondances trouvées, de la plus probable à la moins probable. */
  readonly correspondances: readonly ContactCrm[];
  /** Critère ayant produit les correspondances — trace de la règle appliquée. */
  readonly critere: "email" | "telephone" | "aucun";
}

/**
 * Contact à créer ou à mettre à jour. Lorsque `existant` est fourni, la fiche
 * est mise à jour : la règle de doublon est décidée en amont (voir
 * docs/rendez-vous/03-integration-crm.md), jamais dans l'adaptateur.
 */
export interface ContactEntrant {
  readonly referenceDemande: string;
  readonly coordonnees: Coordonnees;
  readonly existant?: ReferenceCrm;
  /** Origine à inscrire côté CRM (« site — prise de rendez-vous »). */
  readonly source: string;
}

/** Dossier (ou « affaire ») ouvert dans le CRM à partir d'une demande qualifiée. */
export interface DossierEntrant {
  readonly referenceDemande: string;
  readonly contact: ReferenceCrm;
  readonly motif: MotifId;
  readonly evaluation: Evaluation;
  readonly format: FormatRendezVous;
  readonly statut: StatutDemande;
  readonly creeLe: string;
}

/**
 * Opportunité — seuls les CRM commerciaux en ont une notion. Un adaptateur
 * dont le CRM n'en a pas rend `succes` avec une référence vide plutôt qu'une
 * erreur : l'absence d'objet n'est pas un échec.
 */
export interface OpportuniteEntrante {
  readonly referenceDemande: string;
  readonly contact: ReferenceCrm;
  readonly dossier?: ReferenceCrm;
  readonly motif: MotifId;
  readonly dureeMinutes: number;
  /**
   * Aucune valorisation financière n'est transmise : le tarif notarial est
   * réglementé et la plateforme ne chiffre rien (CLAUDE.md §3).
   */
  readonly libelle: string;
}

/** Attribution d'une fiche à un collaborateur de l'étude. */
export interface AttributionEntrante {
  readonly referenceDemande: string;
  /** Fiche à attribuer (contact, dossier ou opportunité selon le CRM). */
  readonly cible: ReferenceCrm;
  /** Identifiant interne du professionnel (voir professionnels.ts). */
  readonly professionnelId: string;
  /** Identifiant du propriétaire côté CRM, résolu via correspondances.ts. */
  readonly proprietaireCrm: string;
}

/**
 * Réponses de qualification. Elles décrivent un besoin, pas un dossier
 * constitué ; leur transmission au CRM suppose que le contrat de
 * sous-traitance RGPD (art. 28) le prévoie et que l'hébergement soit dans
 * l'Union européenne. À défaut, l'étude s'en tient au résumé structuré
 * (`motifsDeclenches`) et consulte le détail dans la plateforme.
 */
export interface QualificationEntrante {
  readonly referenceDemande: string;
  readonly cible: ReferenceCrm;
  readonly motif: MotifId;
  readonly reponses: Reponses;
  /** Intitulés des règles déclenchées — synthèse lisible pour l'étude. */
  readonly motifsDeclenches: readonly string[];
  readonly competence: CompetenceId;
}

/**
 * Référence d'une pièce déposée. Volontairement dépourvue de tout contenu :
 * ni fichier, ni extrait, ni URL téléchargeable. Le CRM sait qu'une pièce
 * existe ; pour la consulter, un collaborateur se connecte à la plateforme.
 */
export interface ReferenceDocument {
  /** Identifiant du catalogue (documents.ts). */
  readonly documentId: string;
  /** Identifiant du fichier dans le stockage de l'étude — jamais un lien public. */
  readonly stockageId: string;
  /** Empreinte SHA-256 en hexadécimal : contrôle d'intégrité sans contenu. */
  readonly empreinte?: string;
  readonly tailleOctets: number;
  readonly typeMime: string;
  readonly deposeLe: string;
}

export interface ReferencesDocumentsEntrantes {
  readonly referenceDemande: string;
  readonly cible: ReferenceCrm;
  readonly documents: readonly ReferenceDocument[];
  /** Pièces encore attendues, par identifiant de catalogue. */
  readonly attendus: readonly string[];
}

export interface StatutEntrant {
  readonly referenceDemande: string;
  readonly cible: ReferenceCrm;
  readonly statut: StatutDemande;
  /** Valeur du statut côté CRM, résolue via correspondances.ts. */
  readonly statutCrm: string;
  readonly modifieLe: string;
}

export interface RendezVousEntrant {
  readonly referenceDemande: string;
  readonly cible: ReferenceCrm;
  /** Début et fin en ISO 8601 avec fuseau. */
  readonly debut: string;
  readonly fin: string;
  readonly format: FormatRendezVous;
  readonly professionnelId: string;
  readonly proprietaireCrm: string;
  /** Référence de l'événement déjà créé, lors d'un report. */
  readonly evenementExistant?: ReferenceCrm;
  /** Annulation : l'événement est supprimé ou marqué annulé selon le CRM. */
  readonly annule?: boolean;
  /**
   * Objet de l'événement. Libellé neutre (motif et référence de demande) :
   * l'agenda d'un CRM est souvent largement partagé.
   */
  readonly objet: string;
}

/* ------------------------------------------------------------------ */
/* Le port                                                             */
/* ------------------------------------------------------------------ */

/**
 * Contrat d'adaptateur CRM.
 *
 * Toutes les méthodes sont asynchrones et rendent un `ResultatCrm` ; aucune ne
 * lève d'exception pour un échec attendu. Une implémentation qui ne sait pas
 * réaliser une opération (CRM sans notion d'opportunité, par exemple) rend un
 * succès neutre plutôt qu'une erreur.
 */
export interface AdaptateurCrm {
  /** Identifiant technique, repris dans le journal (« journal », « exemple-crm »…). */
  readonly identifiant: string;
  /** Libellé affiché dans le tableau de bord interne. */
  readonly libelle: string;

  /** Contrôle de configuration, sans effet de bord ni écriture côté CRM. */
  verifierConfiguration(): Promise<ResultatCrm<EtatConfigurationCrm>>;

  /** Recherche de doublon par e-mail puis, à défaut, par téléphone. */
  rechercherContact(
    critere: CritereRechercheContact,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<ResultatRechercheContact>>;

  /** Création si `existant` est absent, mise à jour sinon. */
  enregistrerContact(
    entrant: ContactEntrant,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<ReferenceCrm>>;

  creerDossier(
    entrant: DossierEntrant,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<ReferenceCrm>>;

  creerOpportunite(
    entrant: OpportuniteEntrante,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<ReferenceCrm>>;

  attribuer(
    entrant: AttributionEntrante,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<void>>;

  envoyerQualification(
    entrant: QualificationEntrante,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<void>>;

  /** Transmet des références de pièces — jamais leur contenu. */
  transmettreReferencesDocuments(
    entrant: ReferencesDocumentsEntrantes,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<void>>;

  synchroniserStatut(
    entrant: StatutEntrant,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<void>>;

  /** Rend la référence de l'événement créé, mis à jour ou annulé. */
  synchroniserRendezVous(
    entrant: RendezVousEntrant,
    options?: OptionsAppel,
  ): Promise<ResultatCrm<ReferenceCrm>>;
}

/** Clé d'idempotence conventionnelle, à passer dans `OptionsAppel`. */
export function cleIdempotence(referenceDemande: string, operation: OperationCrm): string {
  return `${referenceDemande}:${operation}`;
}
