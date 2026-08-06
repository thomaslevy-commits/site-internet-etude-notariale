/**
 * Table de correspondance entre la plateforme et le CRM.
 *
 * C'est une DONNÉE, pas du code : le jour où le notaire communiquera son CRM,
 * il devra être possible de brancher l'intégration en remplissant cette table
 * — au besoin par la variable d'environnement `CRM_CORRESPONDANCES_JSON` —
 * sans modifier une seule ligne de logique.
 *
 * Toutes les valeurs livrées ici valent `À REMPLIR` : ce sont des marques
 * volontairement invalides, jamais des noms de champs plausibles. Un champ
 * plausible mais faux se remarque en production ; une marque `À REMPLIR` se
 * remarque au premier contrôle (`cheminsIncomplets`, `verifierConfiguration`).
 *
 * Trois familles de correspondances :
 *   1. champs du formulaire  → champs CRM ;
 *   2. statuts de la plateforme → statuts CRM ;
 *   3. professionnels de l'étude → propriétaires de fiches CRM.
 */
import { z } from "zod";

import type {
  CompetenceId,
  FormatRendezVous,
  MotifId,
  NiveauComplexite,
  NiveauUrgence,
  StatutDemande,
} from "../types";
import { echec, erreurCrm, succes, type ResultatCrm } from "./adaptateur";

/** Marque d'une valeur non renseignée. Aucun appel CRM ne doit la transmettre. */
export const A_REMPLIR = "À REMPLIR" as const;

export function estARemplir(valeur: string): boolean {
  return valeur.trim().length === 0 || valeur === A_REMPLIR;
}

/** Description d'un champ côté CRM. */
export interface ChampCrm {
  /** Nom ou chemin du champ dans le CRM (« email », « properties.email »…). */
  readonly champ: string;
  /** Le CRM refuse la fiche si ce champ est vide. */
  readonly obligatoire?: boolean;
  /** Précision à l'usage de l'étude (format attendu, liste de valeurs…). */
  readonly note?: string;
}

/** Clés de coordonnées transmissibles (voir `Coordonnees` dans types.ts). */
export type CleContact =
  | "civilite"
  | "prenom"
  | "nom"
  | "email"
  | "telephone"
  | "adresse"
  | "codePostal"
  | "ville"
  | "dateNaissance"
  | "langue"
  | "moyenContactPrefere"
  | "consentement"
  | "referenceDemande"
  | "source";

/** Clés décrivant la demande elle-même, portées par le dossier ou l'opportunité. */
export type CleDossier =
  | "referenceDemande"
  | "motif"
  | "urgence"
  | "complexite"
  | "competence"
  | "format"
  | "dureeMinutes"
  | "statut"
  | "professionnel"
  | "documentsAttendus"
  | "documentsFournis"
  | "motifsDeclenches"
  | "creeLe"
  | "creneauDebut"
  | "creneauFin";

export interface Correspondances {
  /** Version de la table, incrémentée à chaque modification par l'étude. */
  readonly version: string;
  readonly crm: {
    /** Doit valoir l'`identifiant` de l'adaptateur activé. */
    readonly identifiant: string;
    readonly libelle: string;
    readonly note?: string;
  };
  readonly champsContact: Readonly<Record<CleContact, ChampCrm>>;
  readonly champsDossier: Readonly<Record<CleDossier, ChampCrm>>;
  /**
   * Réponses de qualification : clé = identifiant de question (voir
   * qualification/regles.ts). Table OUVERTE — l'étude y ajoute une ligne par
   * question qu'elle souhaite remonter. Une question absente n'est pas
   * transmise : c'est la position par défaut, la plus protectrice.
   */
  readonly champsQualification: Readonly<Record<string, ChampCrm>>;
  readonly statuts: Readonly<Record<StatutDemande, string>>;
  readonly motifs: Readonly<Record<MotifId, string>>;
  readonly competences: Readonly<Record<CompetenceId, string>>;
  readonly formats: Readonly<Record<FormatRendezVous, string>>;
  readonly urgences: Readonly<Record<NiveauUrgence, string>>;
  readonly complexites: Readonly<Record<NiveauComplexite, string>>;
  /** Professionnel de l'étude (professionnels.ts) → utilisateur propriétaire CRM. */
  readonly proprietaires: Readonly<Record<string, string>>;
  /** Propriétaire retenu lorsque le professionnel n'est pas encore désigné. */
  readonly proprietaireParDefaut: string;
}

/* ------------------------------------------------------------------ */
/* Valeurs par défaut — TOUTES À REMPLACER                             */
/* ------------------------------------------------------------------ */

function aRemplir(note?: string): ChampCrm {
  return note === undefined ? { champ: A_REMPLIR } : { champ: A_REMPLIR, note };
}

/**
 * Table livrée avec le projet. Elle est complète en STRUCTURE et vide en
 * VALEURS : la plateforme sait donc exactement quoi demander au notaire, et
 * refuse d'appeler un CRM tant que les valeurs ne sont pas fournies.
 */
export const CORRESPONDANCES_PAR_DEFAUT: Correspondances = {
  version: "0-non-configuree",
  crm: {
    identifiant: "journal",
    libelle: "Aucun CRM configuré",
    note: "Remplacer par l'identifiant de l'adaptateur une fois le CRM communiqué.",
  },

  champsContact: {
    civilite: aRemplir("Liste de valeurs côté CRM : madame / monsieur / non précisée."),
    prenom: aRemplir(),
    nom: aRemplir(),
    email: aRemplir("Clé de déduplication principale."),
    telephone: aRemplir("Clé de déduplication secondaire, au format E.164."),
    adresse: aRemplir(),
    codePostal: aRemplir(),
    ville: aRemplir(),
    dateNaissance: aRemplir("Vérifier le format attendu (ISO 8601 ou jj/mm/aaaa)."),
    langue: aRemplir("Code ISO 639-1."),
    moyenContactPrefere: aRemplir("email / telephone."),
    consentement: aRemplir("Preuve du consentement RGPD : booléen ou horodatage."),
    referenceDemande: aRemplir("Référence lisible « RDV-AAAA-NNNN » ; sert de clé de rapprochement."),
    source: aRemplir("Origine du contact, valeur fixe « site — prise de rendez-vous »."),
  },

  champsDossier: {
    referenceDemande: aRemplir(),
    motif: aRemplir(),
    urgence: aRemplir(),
    complexite: aRemplir(),
    competence: aRemplir(),
    format: aRemplir(),
    dureeMinutes: aRemplir(),
    statut: aRemplir(),
    professionnel: aRemplir(),
    documentsAttendus: aRemplir("Liste d'identifiants de pièces — jamais de contenu."),
    documentsFournis: aRemplir("Liste d'identifiants de pièces — jamais de contenu."),
    motifsDeclenches: aRemplir("Synthèse textuelle des règles déclenchées."),
    creeLe: aRemplir(),
    creneauDebut: aRemplir(),
    creneauFin: aRemplir(),
  },

  /**
   * Vide à dessein. Exemple de ligne à ajouter une fois le CRM connu :
   *   "budget": { champ: "À REMPLIR", note: "Champ numérique du CRM." }
   * Rappel : ne remonter que ce dont l'étude a réellement besoin dans le CRM.
   */
  champsQualification: {},

  statuts: {
    brouillon: A_REMPLIR,
    "qualification-en-cours": A_REMPLIR,
    "attente-documents": A_REMPLIR,
    "prete-a-planifier": A_REMPLIR,
    "rendez-vous-confirme": A_REMPLIR,
    "rendez-vous-a-valider": A_REMPLIR,
    "rendez-vous-realise": A_REMPLIR,
    annule: A_REMPLIR,
    "sans-suite": A_REMPLIR,
    "converti-en-dossier": A_REMPLIR,
  },

  motifs: {
    "achat-immobilier": A_REMPLIR,
    "vente-immobiliere": A_REMPLIR,
    succession: A_REMPLIR,
    donation: A_REMPLIR,
    "contrat-de-mariage": A_REMPLIR,
    pacs: A_REMPLIR,
    "divorce-separation": A_REMPLIR,
    entreprise: A_REMPLIR,
    procuration: A_REMPLIR,
    "conseil-patrimonial": A_REMPLIR,
    "question-generale": A_REMPLIR,
    autre: A_REMPLIR,
  },

  competences: {
    immobilier: A_REMPLIR,
    succession: A_REMPLIR,
    famille: A_REMPLIR,
    entreprise: A_REMPLIR,
    patrimoine: A_REMPLIR,
    international: A_REMPLIR,
  },

  formats: {
    etude: A_REMPLIR,
    visioconference: A_REMPLIR,
    telephone: A_REMPLIR,
    exterieur: A_REMPLIR,
  },

  urgences: {
    standard: A_REMPLIR,
    prioritaire: A_REMPLIR,
    urgent: A_REMPLIR,
  },

  complexites: {
    simple: A_REMPLIR,
    intermédiaire: A_REMPLIR,
    élevée: A_REMPLIR,
  },

  /** Clés = identifiants de professionnels.ts ; valeurs = utilisateurs CRM. */
  proprietaires: {
    "notaire-titulaire": A_REMPLIR,
    "notaire-assistant": A_REMPLIR,
    "clerc-immobilier": A_REMPLIR,
  },

  proprietaireParDefaut: A_REMPLIR,
};

/* ------------------------------------------------------------------ */
/* Résolution                                                          */
/* ------------------------------------------------------------------ */

/** Rend `undefined` plutôt qu'une marque `À REMPLIR` : rien n'est transmis à moitié. */
function valeurUtile(valeur: string | undefined): string | undefined {
  if (valeur === undefined || estARemplir(valeur)) return undefined;
  return valeur;
}

export function resoudreChampContact(
  correspondances: Correspondances,
  cle: CleContact,
): ChampCrm | undefined {
  const champ = correspondances.champsContact[cle];
  return valeurUtile(champ.champ) === undefined ? undefined : champ;
}

export function resoudreChampDossier(
  correspondances: Correspondances,
  cle: CleDossier,
): ChampCrm | undefined {
  const champ = correspondances.champsDossier[cle];
  return valeurUtile(champ.champ) === undefined ? undefined : champ;
}

export function resoudreChampQualification(
  correspondances: Correspondances,
  questionId: string,
): ChampCrm | undefined {
  const champ = correspondances.champsQualification[questionId];
  if (champ === undefined) return undefined;
  return valeurUtile(champ.champ) === undefined ? undefined : champ;
}

export function resoudreStatut(
  correspondances: Correspondances,
  statut: StatutDemande,
): string | undefined {
  return valeurUtile(correspondances.statuts[statut]);
}

export function resoudreMotif(
  correspondances: Correspondances,
  motif: MotifId,
): string | undefined {
  return valeurUtile(correspondances.motifs[motif]);
}

/**
 * Propriétaire CRM d'une fiche. Sans professionnel désigné — ou sans
 * correspondance pour lui — on retombe sur le propriétaire par défaut, qui
 * peut lui aussi être absent : c'est alors à l'appelant de conclure à une
 * erreur `correspondance-manquante`.
 */
export function resoudreProprietaire(
  correspondances: Correspondances,
  professionnelId: string | undefined,
): string | undefined {
  if (professionnelId !== undefined) {
    const propre = valeurUtile(correspondances.proprietaires[professionnelId]);
    if (propre !== undefined) return propre;
  }
  return valeurUtile(correspondances.proprietaireParDefaut);
}

/* ------------------------------------------------------------------ */
/* Contrôle de complétude                                              */
/* ------------------------------------------------------------------ */

function cheminsIncompletsTableTexte(
  prefixe: string,
  table: Readonly<Record<string, string>>,
): string[] {
  return Object.entries(table)
    .filter(([, valeur]) => estARemplir(valeur))
    .map(([cle]) => `${prefixe}.${cle}`);
}

function cheminsIncompletsTableChamps(
  prefixe: string,
  table: Readonly<Record<string, ChampCrm>>,
): string[] {
  return Object.entries(table)
    .filter(([, champ]) => estARemplir(champ.champ))
    .map(([cle]) => `${prefixe}.${cle}`);
}

/**
 * Chemins restés à remplir. Liste vide = table exploitable.
 *
 * `champsQualification` n'y figure pas : une table vide y est un choix
 * légitime (ne rien remonter), pas une omission.
 */
export function cheminsIncomplets(correspondances: Correspondances): readonly string[] {
  const chemins: string[] = [];
  if (estARemplir(correspondances.crm.identifiant)) chemins.push("crm.identifiant");
  chemins.push(...cheminsIncompletsTableChamps("champsContact", correspondances.champsContact));
  chemins.push(...cheminsIncompletsTableChamps("champsDossier", correspondances.champsDossier));
  chemins.push(
    ...cheminsIncompletsTableChamps("champsQualification", correspondances.champsQualification),
  );
  chemins.push(...cheminsIncompletsTableTexte("statuts", correspondances.statuts));
  chemins.push(...cheminsIncompletsTableTexte("motifs", correspondances.motifs));
  chemins.push(...cheminsIncompletsTableTexte("competences", correspondances.competences));
  chemins.push(...cheminsIncompletsTableTexte("formats", correspondances.formats));
  chemins.push(...cheminsIncompletsTableTexte("urgences", correspondances.urgences));
  chemins.push(...cheminsIncompletsTableTexte("complexites", correspondances.complexites));
  chemins.push(...cheminsIncompletsTableTexte("proprietaires", correspondances.proprietaires));
  if (estARemplir(correspondances.proprietaireParDefaut)) chemins.push("proprietaireParDefaut");
  return chemins;
}

export function correspondancesCompletes(correspondances: Correspondances): boolean {
  return cheminsIncomplets(correspondances).length === 0;
}

/* ------------------------------------------------------------------ */
/* Surcharge externe                                                   */
/* ------------------------------------------------------------------ */

const schemaChamp = z.object({
  champ: z.string().min(1),
  obligatoire: z.boolean().optional(),
  note: z.string().optional(),
});

const schemaTableChamps = z.record(z.string(), schemaChamp);
const schemaTableTexte = z.record(z.string(), z.string());

/**
 * Forme acceptée pour la surcharge : tout est facultatif, ce qui permet à
 * l'étude de ne renseigner que ce qu'elle utilise. `strict()` rejette les
 * sections inconnues, pour qu'une faute de frappe ne passe pas inaperçue.
 */
const schemaSurcharge = z
  .object({
    version: z.string().optional(),
    crm: z
      .object({
        identifiant: z.string().optional(),
        libelle: z.string().optional(),
        note: z.string().optional(),
      })
      .strict()
      .optional(),
    champsContact: schemaTableChamps.optional(),
    champsDossier: schemaTableChamps.optional(),
    champsQualification: schemaTableChamps.optional(),
    statuts: schemaTableTexte.optional(),
    motifs: schemaTableTexte.optional(),
    competences: schemaTableTexte.optional(),
    formats: schemaTableTexte.optional(),
    urgences: schemaTableTexte.optional(),
    complexites: schemaTableTexte.optional(),
    proprietaires: schemaTableTexte.optional(),
    proprietaireParDefaut: z.string().optional(),
  })
  .strict();

export type SurchargeCorrespondances = z.infer<typeof schemaSurcharge>;

/** Résultat d'une fusion : la table obtenue et les clés ignorées. */
export interface FusionCorrespondances {
  readonly correspondances: Correspondances;
  /**
   * Clés présentes dans la surcharge mais absentes du modèle (statut inconnu,
   * motif supprimé…). Elles sont ignorées et signalées, jamais appliquées en
   * silence.
   */
  readonly clesInconnues: readonly string[];
}

function fusionnerTableTexteFermee<C extends string>(
  prefixe: string,
  // Paramètre déclaré mutable pour que la copie locale le soit aussi ; les
  // tables passées par l'appelant sont en lecture seule et ne sont jamais
  // modifiées — seule la copie l'est.
  base: Record<C, string>,
  surcharge: Readonly<Record<string, string>> | undefined,
  clesInconnues: string[],
): Record<C, string> {
  // `for...in` sur une copie du modèle : le type des clés est conservé, là où
  // Object.keys et Object.entries le ramènent à `string` et imposeraient un
  // transtypage que TypeScript refuse sur un paramètre générique.
  const resultat: Record<C, string> = { ...base };
  for (const cle in resultat) {
    const remplacement = surcharge?.[cle];
    if (remplacement !== undefined) resultat[cle] = remplacement;
  }
  for (const cle of Object.keys(surcharge ?? {})) {
    if (!(cle in base)) clesInconnues.push(`${prefixe}.${cle}`);
  }
  return resultat;
}

function fusionnerTableChampsFermee<C extends string>(
  prefixe: string,
  base: Record<C, ChampCrm>,
  surcharge: Readonly<Record<string, ChampCrm>> | undefined,
  clesInconnues: string[],
): Record<C, ChampCrm> {
  const resultat: Record<C, ChampCrm> = { ...base };
  for (const cle in resultat) {
    const remplacement = surcharge?.[cle];
    if (remplacement !== undefined) resultat[cle] = { ...resultat[cle], ...remplacement };
  }
  for (const cle of Object.keys(surcharge ?? {})) {
    if (!(cle in base)) clesInconnues.push(`${prefixe}.${cle}`);
  }
  return resultat;
}

/**
 * Applique une surcharge à une table de base. Fonction pure : ni lecture de
 * fichier, ni accès réseau, ni mutation des arguments.
 */
export function fusionnerCorrespondances(
  base: Correspondances,
  surcharge: SurchargeCorrespondances,
): FusionCorrespondances {
  const clesInconnues: string[] = [];

  // Tables ouvertes : toute clé est acceptée (identifiants de questions,
  // identifiants de professionnels créés après la livraison).
  const champsQualification: Record<string, ChampCrm> = {
    ...base.champsQualification,
    ...(surcharge.champsQualification ?? {}),
  };
  const proprietaires: Record<string, string> = {
    ...base.proprietaires,
    ...(surcharge.proprietaires ?? {}),
  };

  const note = surcharge.crm?.note ?? base.crm.note;

  return {
    correspondances: {
      version: surcharge.version ?? base.version,
      crm: {
        identifiant: surcharge.crm?.identifiant ?? base.crm.identifiant,
        libelle: surcharge.crm?.libelle ?? base.crm.libelle,
        ...(note === undefined ? {} : { note }),
      },
      champsContact: fusionnerTableChampsFermee(
        "champsContact",
        base.champsContact,
        surcharge.champsContact,
        clesInconnues,
      ),
      champsDossier: fusionnerTableChampsFermee(
        "champsDossier",
        base.champsDossier,
        surcharge.champsDossier,
        clesInconnues,
      ),
      champsQualification,
      statuts: fusionnerTableTexteFermee(
        "statuts",
        base.statuts,
        surcharge.statuts,
        clesInconnues,
      ),
      motifs: fusionnerTableTexteFermee("motifs", base.motifs, surcharge.motifs, clesInconnues),
      competences: fusionnerTableTexteFermee(
        "competences",
        base.competences,
        surcharge.competences,
        clesInconnues,
      ),
      formats: fusionnerTableTexteFermee(
        "formats",
        base.formats,
        surcharge.formats,
        clesInconnues,
      ),
      urgences: fusionnerTableTexteFermee(
        "urgences",
        base.urgences,
        surcharge.urgences,
        clesInconnues,
      ),
      complexites: fusionnerTableTexteFermee(
        "complexites",
        base.complexites,
        surcharge.complexites,
        clesInconnues,
      ),
      proprietaires,
      proprietaireParDefaut: surcharge.proprietaireParDefaut ?? base.proprietaireParDefaut,
    },
    clesInconnues,
  };
}

/**
 * Analyse une surcharge au format JSON (contenu de `CRM_CORRESPONDANCES_JSON`
 * ou d'un fichier lu par l'appelant) et l'applique à la table par défaut.
 * Aucune entrée/sortie ici : la chaîne est fournie par l'appelant.
 */
export function analyserCorrespondances(
  json: string,
  base: Correspondances = CORRESPONDANCES_PAR_DEFAUT,
): ResultatCrm<FusionCorrespondances> {
  let brut: unknown;
  try {
    brut = JSON.parse(json);
  } catch {
    return echec(
      erreurCrm(
        "reponse-illisible",
        "chargement-correspondances",
        "La table de correspondance n'est pas un JSON valide.",
      ),
    );
  }
  const analyse = schemaSurcharge.safeParse(brut);
  if (!analyse.success) {
    const details = analyse.error.issues
      .map((probleme) => `${probleme.path.join(".") || "(racine)"} : ${probleme.message}`)
      .join(" ; ");
    return echec(
      erreurCrm(
        "validation",
        "chargement-correspondances",
        `Table de correspondance refusée — ${details}`,
      ),
    );
  }
  return succes(fusionnerCorrespondances(base, analyse.data));
}

/**
 * Charge la table depuis l'environnement. Sans variable renseignée, rend la
 * table par défaut : le module reste utilisable, l'adaptateur de secours prend
 * le relais et le parcours n'est jamais interrompu.
 *
 * L'environnement est passé en argument (et non lu via `process.env`) pour que
 * la fonction reste testable et exempte d'effet de bord.
 */
export function chargerCorrespondances(
  environnement: Readonly<Record<string, string | undefined>>,
  base: Correspondances = CORRESPONDANCES_PAR_DEFAUT,
): ResultatCrm<FusionCorrespondances> {
  const json = environnement["CRM_CORRESPONDANCES_JSON"];
  if (json === undefined || json.trim().length === 0) {
    return succes({ correspondances: base, clesInconnues: [] });
  }
  return analyserCorrespondances(json, base);
}
