/**
 * Questions de qualification et règles d'évaluation, par motif.
 *
 * PROVENANCE DU CONTENU (CLAUDE.md §9)
 * Les questions des quatre motifs ci-dessous — achat immobilier, vente
 * immobilière, succession, donation — ont été dictées par le notaire dans sa
 * demande du 6 août 2026 : elles sont donc validées et publiables telles
 * quelles. Les huit autres motifs n'ont pas reçu de jeu de questions ; en
 * inventer reviendrait à rédiger du contenu juridique sans validation. Ils
 * sont déclarés dans motifs.ts avec `etatContenu: "à valider"` et le parcours
 * les oriente vers une demande de rappel (voir moteur.ts).
 *
 * NATURE DES RÈGLES
 * Les règles ne délivrent aucun conseil juridique : elles servent uniquement à
 * orienter le dossier en interne — durée du rendez-vous, interlocuteur,
 * pièces à réunir, ordre de traitement. Leurs intitulés sont écrits pour être
 * lus par l'étude, jamais affichés au demandeur.
 */
import type { Question, RegleEvaluation } from "../types";

/** Options réutilisées, pour éviter les divergences de libellé. */
const OUI_NON_INCERTAIN = [
  { valeur: "oui", libelle: "Oui" },
  { valeur: "non", libelle: "Non" },
  { valeur: "je-ne-sais-pas", libelle: "Je ne sais pas" },
] as const;

const DELAIS = [
  { valeur: "moins-1-mois", libelle: "Moins d'un mois" },
  { valeur: "1-a-3-mois", libelle: "D'un à trois mois" },
  { valeur: "3-a-6-mois", libelle: "De trois à six mois" },
  { valeur: "plus-6-mois", libelle: "Plus de six mois" },
  { valeur: "sans-delai", libelle: "Sans échéance particulière" },
] as const;

/* ------------------------------------------------------------------ */
/* Achat immobilier                                                    */
/* ------------------------------------------------------------------ */

export const QUESTIONS_ACHAT: readonly Question[] = [
  {
    id: "bien-identifie",
    libelle: "Le bien est-il déjà identifié ?",
    type: "oui-non",
    obligatoire: true,
  },
  {
    id: "avant-contrat",
    libelle: "Une promesse ou un compromis a-t-il été signé ?",
    type: "choix-unique",
    obligatoire: true,
    // Comparaison à `true` et non à « oui » : une question de type oui-non
    // stocke un booléen (voir ChampQuestion), afin que les règles et le CRM
    // manipulent une vraie valeur logique.
    afficherSi: [{ question: "bien-identifie", operateur: "égal", valeur: true }],
    options: [
      { valeur: "aucun", libelle: "Non, rien n'est signé" },
      { valeur: "promesse", libelle: "Une promesse de vente" },
      { valeur: "compromis", libelle: "Un compromis de vente" },
      { valeur: "je-ne-sais-pas", libelle: "Je ne sais pas" },
    ],
  },
  {
    id: "prix",
    libelle: "Quel est le prix approximatif du bien ?",
    type: "montant",
    unite: "€",
    aide: "Un ordre de grandeur suffit.",
    // Comparaison à `true` et non à « oui » : une question de type oui-non
    // stocke un booléen (voir ChampQuestion), afin que les règles et le CRM
    // manipulent une vraie valeur logique.
    afficherSi: [{ question: "bien-identifie", operateur: "égal", valeur: true }],
  },
  {
    id: "financement",
    libelle: "Le financement est-il obtenu ?",
    type: "choix-unique",
    obligatoire: true,
    options: [
      { valeur: "obtenu", libelle: "Oui, l'offre de prêt est obtenue" },
      { valeur: "en-cours", libelle: "Une demande est en cours" },
      { valeur: "pas-commence", libelle: "Pas encore engagé" },
      { valeur: "sans-emprunt", libelle: "Achat sans emprunt" },
    ],
  },
  {
    id: "plusieurs-acquereurs",
    libelle: "Y a-t-il plusieurs acquéreurs ?",
    type: "oui-non",
    obligatoire: true,
  },
  {
    id: "notaire-existant",
    libelle: "Avez-vous déjà un notaire ?",
    type: "oui-non",
    obligatoire: true,
  },
  {
    id: "delai",
    libelle: "Quel est le délai souhaité ?",
    type: "choix-unique",
    obligatoire: true,
    options: DELAIS,
  },
];

export const REGLES_ACHAT: readonly RegleEvaluation[] = [
  {
    intitule: "Compromis déjà signé — le calendrier de l'opération court",
    si: [{ question: "avant-contrat", operateur: "égal", valeur: "compromis" }],
    urgence: 3,
    documents: ["avant-contrat", "piece-identite"],
  },
  {
    intitule: "Promesse signée",
    si: [{ question: "avant-contrat", operateur: "égal", valeur: "promesse" }],
    urgence: 2,
    documents: ["avant-contrat", "piece-identite"],
  },
  {
    intitule: "Échéance rapprochée",
    si: [{ question: "delai", operateur: "égal", valeur: "moins-1-mois" }],
    urgence: 2,
  },
  {
    intitule: "Avant-contrat signé sans financement acquis",
    si: [
      { question: "avant-contrat", operateur: "parmi", valeur: ["promesse", "compromis"] },
      { question: "financement", operateur: "parmi", valeur: ["en-cours", "pas-commence"] },
    ],
    urgence: 1,
    complexite: 1,
    documents: ["justificatif-financement"],
  },
  {
    intitule: "Acquéreurs multiples — répartition des droits à organiser",
    si: [{ question: "plusieurs-acquereurs", operateur: "égal", valeur: true }],
    complexite: 2,
    documents: ["piece-identite-coacquereurs"],
  },
  {
    intitule: "Montant élevé",
    si: [{ question: "prix", operateur: "supérieur à", valeur: 1_000_000 }],
    complexite: 2,
    competence: "patrimoine",
  },
  {
    intitule: "Financement par emprunt",
    si: [{ question: "financement", operateur: "parmi", valeur: ["obtenu", "en-cours"] }],
    documents: ["justificatif-financement"],
  },
];

/* ------------------------------------------------------------------ */
/* Vente immobilière                                                   */
/* ------------------------------------------------------------------ */

export const QUESTIONS_VENTE: readonly Question[] = [
  {
    id: "proprietaire",
    libelle: "Êtes-vous propriétaire du bien ?",
    type: "choix-unique",
    obligatoire: true,
    options: [
      { valeur: "oui", libelle: "Oui, seul" },
      { valeur: "indivision", libelle: "Oui, avec d'autres personnes" },
      { valeur: "non", libelle: "Non" },
    ],
  },
  {
    id: "copropriete",
    libelle: "Le bien est-il en copropriété ?",
    type: "choix-unique",
    obligatoire: true,
    options: OUI_NON_INCERTAIN,
  },
  {
    id: "mandat",
    libelle: "Un mandat de vente est-il signé ?",
    type: "oui-non",
    obligatoire: true,
  },
  {
    id: "acquereur-identifie",
    libelle: "Un acquéreur est-il déjà identifié ?",
    type: "oui-non",
    obligatoire: true,
  },
  {
    id: "diagnostics",
    libelle: "Les diagnostics immobiliers sont-ils disponibles ?",
    type: "choix-unique",
    obligatoire: true,
    options: OUI_NON_INCERTAIN,
  },
  {
    id: "pret-en-cours",
    libelle: "Le bien fait-il l'objet d'un prêt en cours ?",
    type: "choix-unique",
    obligatoire: true,
    options: OUI_NON_INCERTAIN,
  },
];

export const REGLES_VENTE: readonly RegleEvaluation[] = [
  {
    intitule: "Acquéreur déjà identifié — l'avant-contrat peut être préparé",
    si: [{ question: "acquereur-identifie", operateur: "égal", valeur: true }],
    urgence: 2,
    documents: ["titre-propriete", "piece-identite"],
  },
  {
    intitule: "Bien détenu à plusieurs",
    si: [{ question: "proprietaire", operateur: "égal", valeur: "indivision" }],
    complexite: 2,
    documents: ["titre-propriete", "piece-identite-coproprietaires"],
  },
  {
    intitule: "Vendeur non propriétaire — qualité à vérifier avant tout acte",
    si: [{ question: "proprietaire", operateur: "égal", valeur: "non" }],
    complexite: 2,
    documents: ["justificatif-qualite"],
  },
  {
    intitule: "Bien en copropriété",
    si: [{ question: "copropriete", operateur: "égal", valeur: "oui" }],
    complexite: 1,
    documents: ["reglement-copropriete", "derniers-proces-verbaux"],
  },
  {
    intitule: "Diagnostics non disponibles",
    si: [{ question: "diagnostics", operateur: "parmi", valeur: ["non", "je-ne-sais-pas"] }],
    documents: ["diagnostics-techniques"],
  },
  {
    intitule: "Prêt en cours — remboursement à coordonner",
    si: [{ question: "pret-en-cours", operateur: "égal", valeur: "oui" }],
    complexite: 1,
    documents: ["tableau-amortissement"],
  },
];

/* ------------------------------------------------------------------ */
/* Succession                                                          */
/* ------------------------------------------------------------------ */

export const QUESTIONS_SUCCESSION: readonly Question[] = [
  {
    id: "date-deces",
    libelle: "Quelle est la date du décès ?",
    type: "date",
    obligatoire: true,
  },
  {
    id: "dernier-domicile",
    libelle: "Quel était le dernier domicile du défunt ?",
    type: "texte-court",
    obligatoire: true,
    aide: "Commune et pays suffisent.",
  },
  {
    id: "domicile-hors-france",
    libelle: "Ce domicile se situait-il hors de France ?",
    type: "oui-non",
    obligatoire: true,
  },
  {
    id: "testament",
    libelle: "Existe-t-il un testament ?",
    type: "choix-unique",
    obligatoire: true,
    options: OUI_NON_INCERTAIN,
  },
  {
    id: "bien-immobilier",
    libelle: "Existe-t-il un bien immobilier ?",
    type: "choix-unique",
    obligatoire: true,
    options: OUI_NON_INCERTAIN,
  },
  {
    id: "nombre-heritiers",
    libelle: "Combien d'héritiers sont concernés ?",
    type: "nombre",
    obligatoire: true,
  },
  {
    id: "autre-notaire",
    libelle: "Une démarche a-t-elle déjà été engagée auprès d'un autre notaire ?",
    type: "oui-non",
    obligatoire: true,
  },
];

export const REGLES_SUCCESSION: readonly RegleEvaluation[] = [
  {
    // `_joursDepuisDeces` est calculé par le moteur (voir moteur.ts).
    intitule: "Décès récent — échéances déclaratives à sécuriser rapidement",
    si: [{ question: "_joursDepuisDeces", operateur: "supérieur à", valeur: 120 }],
    urgence: 3,
  },
  {
    intitule: "Succession comportant un élément d'extranéité",
    si: [{ question: "domicile-hors-france", operateur: "égal", valeur: true }],
    complexite: 3,
    competence: "international",
    documents: ["justificatif-domicile-defunt"],
  },
  {
    intitule: "Testament à rechercher et à interpréter",
    si: [{ question: "testament", operateur: "parmi", valeur: ["oui", "je-ne-sais-pas"] }],
    complexite: 2,
  },
  {
    intitule: "Actif immobilier dans la succession",
    si: [{ question: "bien-immobilier", operateur: "égal", valeur: "oui" }],
    complexite: 1,
    documents: ["titre-propriete"],
  },
  {
    intitule: "Nombre d'héritiers élevé",
    si: [{ question: "nombre-heritiers", operateur: "supérieur à", valeur: 4 }],
    complexite: 2,
  },
  {
    intitule: "Dossier déjà ouvert chez un confrère — coordination nécessaire",
    si: [{ question: "autre-notaire", operateur: "égal", valeur: true }],
    complexite: 1,
  },
];

/* ------------------------------------------------------------------ */
/* Donation                                                            */
/* ------------------------------------------------------------------ */

export const QUESTIONS_DONATION: readonly Question[] = [
  {
    id: "type-bien",
    libelle: "Quel type de bien souhaitez-vous donner ?",
    type: "choix-unique",
    obligatoire: true,
    options: [
      { valeur: "immobilier", libelle: "Un bien immobilier" },
      { valeur: "somme", libelle: "Une somme d'argent" },
      { valeur: "titres", libelle: "Des titres ou valeurs mobilières" },
      { valeur: "entreprise", libelle: "Une entreprise ou des parts sociales" },
      { valeur: "autre", libelle: "Autre" },
    ],
  },
  {
    id: "valeur",
    libelle: "Quelle est la valeur approximative du bien ?",
    type: "montant",
    unite: "€",
    aide: "Un ordre de grandeur suffit.",
  },
  {
    id: "nombre-beneficiaires",
    libelle: "Combien de bénéficiaires sont concernés ?",
    type: "nombre",
    obligatoire: true,
  },
  {
    id: "donation-anterieure",
    libelle: "Une donation antérieure a-t-elle déjà été réalisée ?",
    type: "choix-unique",
    obligatoire: true,
    options: OUI_NON_INCERTAIN,
  },
  {
    id: "usufruit",
    libelle: "Souhaitez-vous conserver l'usufruit ?",
    type: "choix-unique",
    obligatoire: true,
    options: [
      { valeur: "oui", libelle: "Oui" },
      { valeur: "non", libelle: "Non" },
      { valeur: "a-etudier", libelle: "À étudier avec le notaire" },
    ],
  },
];

export const REGLES_DONATION: readonly RegleEvaluation[] = [
  {
    intitule: "Donation portant sur un bien immobilier",
    si: [{ question: "type-bien", operateur: "égal", valeur: "immobilier" }],
    complexite: 2,
    documents: ["titre-propriete"],
  },
  {
    intitule: "Donation portant sur une entreprise ou des parts",
    si: [{ question: "type-bien", operateur: "égal", valeur: "entreprise" }],
    complexite: 3,
    competence: "entreprise",
    documents: ["statuts-societe", "derniers-comptes"],
  },
  {
    intitule: "Montant élevé",
    si: [{ question: "valeur", operateur: "supérieur à", valeur: 500_000 }],
    complexite: 2,
    competence: "patrimoine",
  },
  {
    intitule: "Bénéficiaires multiples — équilibre entre eux à organiser",
    si: [{ question: "nombre-beneficiaires", operateur: "supérieur à", valeur: 1 }],
    complexite: 1,
  },
  {
    intitule: "Donation antérieure à reconstituer",
    si: [{ question: "donation-anterieure", operateur: "parmi", valeur: ["oui", "je-ne-sais-pas"] }],
    complexite: 2,
    documents: ["actes-donations-anterieures"],
  },
  {
    intitule: "Démembrement envisagé",
    si: [{ question: "usufruit", operateur: "parmi", valeur: ["oui", "a-etudier"] }],
    complexite: 1,
  },
];

/**
 * Questions communes posées quel que soit le motif, après les questions
 * spécifiques. Elles ne portent sur aucun point de droit.
 */
export const QUESTIONS_COMMUNES: readonly Question[] = [
  {
    id: "precisions",
    libelle: "Souhaitez-vous préciser quelque chose avant le rendez-vous ?",
    type: "texte-long",
    aide: "Facultatif. Ces éléments servent uniquement à préparer l'entretien.",
  },
];
