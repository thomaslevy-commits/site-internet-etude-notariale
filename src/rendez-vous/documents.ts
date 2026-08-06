/**
 * Catalogue des pièces pouvant être demandées (étape 5 du parcours).
 *
 * Les identifiants sont référencés par les règles de qualification
 * (qualification/regles.ts) : le moteur en déduit la liste propre à chaque
 * dossier, plutôt que d'afficher une liste figée où le demandeur devrait
 * trier lui-même ce qui le concerne.
 *
 * LIMITE POSÉE PAR LE CAHIER DES CHARGES (CLAUDE.md §2)
 * L'étude ne conserve aucun acte authentique en ligne : le minutier reste
 * dans les systèmes agréés de la profession. Le dépôt sert exclusivement à
 * préparer un rendez-vous, porte sur des copies, et chaque pièce a une durée
 * de conservation courte (voir docs/rendez-vous/04-conformite-et-securite.md).
 * `copieUniquement` marque les pièces où ce point doit être rappelé au
 * demandeur au moment du dépôt.
 */

/** Formats acceptés au dépôt, demandés par le notaire. */
export const FORMATS_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const EXTENSIONS_ACCEPTEES = ".pdf,.jpg,.jpeg,.png,.docx";

/** Taille maximale par fichier, en octets (10 Mo). */
export const TAILLE_MAXIMALE_OCTETS = 10 * 1024 * 1024;

export interface DefinitionDocument {
  id: string;
  libelle: string;
  /** Précision affichée sous le libellé. */
  aide?: string;
  /** Une pièce facultative ne bloque jamais la prise de rendez-vous. */
  obligatoire: boolean;
  /** Rappeler explicitement qu'une copie suffit. */
  copieUniquement?: boolean;
}

export const DOCUMENTS: readonly DefinitionDocument[] = [
  {
    id: "piece-identite",
    libelle: "Pièce d'identité",
    aide: "Carte nationale d'identité ou passeport, en cours de validité.",
    obligatoire: true,
    copieUniquement: true,
  },
  {
    id: "piece-identite-coacquereurs",
    libelle: "Pièce d'identité des autres acquéreurs",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "piece-identite-coproprietaires",
    libelle: "Pièce d'identité des autres propriétaires",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "livret-famille",
    libelle: "Livret de famille",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "avant-contrat",
    libelle: "Promesse ou compromis de vente",
    aide: "Le document signé, même incomplet de ses annexes.",
    obligatoire: true,
    copieUniquement: true,
  },
  {
    id: "titre-propriete",
    libelle: "Titre de propriété",
    aide: "L'acte reçu lors de l'acquisition du bien.",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "justificatif-financement",
    libelle: "Justificatif de financement",
    aide: "Offre de prêt, accord de principe ou attestation de fonds.",
    obligatoire: false,
  },
  {
    id: "justificatif-qualite",
    libelle: "Justificatif de votre qualité pour vendre",
    aide: "Mandat, décision de justice ou tout document équivalent.",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "reglement-copropriete",
    libelle: "Règlement de copropriété",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "derniers-proces-verbaux",
    libelle: "Derniers procès-verbaux d'assemblée générale",
    aide: "Les trois derniers, si vous en disposez.",
    obligatoire: false,
  },
  {
    id: "diagnostics-techniques",
    libelle: "Diagnostics techniques",
    obligatoire: false,
  },
  {
    id: "tableau-amortissement",
    libelle: "Tableau d'amortissement du prêt en cours",
    obligatoire: false,
  },
  {
    id: "acte-deces",
    libelle: "Acte de décès",
    obligatoire: true,
    copieUniquement: true,
  },
  {
    id: "justificatif-domicile-defunt",
    libelle: "Justificatif du dernier domicile",
    obligatoire: false,
  },
  {
    id: "actes-donations-anterieures",
    libelle: "Actes des donations antérieures",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "statuts-societe",
    libelle: "Statuts de la société",
    obligatoire: false,
    copieUniquement: true,
  },
  {
    id: "derniers-comptes",
    libelle: "Derniers comptes annuels",
    obligatoire: false,
  },
];

export function documentParId(id: string): DefinitionDocument | undefined {
  return DOCUMENTS.find((document) => document.id === id);
}

/** Définitions correspondant aux identifiants retenus par le moteur. */
export function documentsRequis(ids: readonly string[]): readonly DefinitionDocument[] {
  return ids
    .map((id) => documentParId(id))
    .filter((document): document is DefinitionDocument => document !== undefined);
}
