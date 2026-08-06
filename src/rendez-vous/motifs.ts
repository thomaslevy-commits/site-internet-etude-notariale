/**
 * Catalogue des motifs de rendez-vous (étape 2 du parcours).
 *
 * Les quatre premiers motifs portent les questions dictées par le notaire :
 * ils sont complets et publiables. Les huit suivants sont déclarés — ils
 * apparaissent bien dans le choix — mais leur jeu de questions reste à
 * établir avec le notaire : `etatContenu: "à valider"`. Le parcours les
 * traite alors sans les inventer (voir moteur.ts, `parcoursDisponible`).
 *
 * Les descriptions sont volontairement factuelles et descriptives : elles
 * disent ce que couvre la catégorie, jamais ce que l'étude vaut (§3).
 */
import type { Motif } from "./types";
import {
  QUESTIONS_ACHAT,
  QUESTIONS_DONATION,
  QUESTIONS_SUCCESSION,
  QUESTIONS_VENTE,
  REGLES_ACHAT,
  REGLES_DONATION,
  REGLES_SUCCESSION,
  REGLES_VENTE,
} from "./qualification/regles";

export const MOTIFS: readonly Motif[] = [
  {
    id: "achat-immobilier",
    libelle: "Achat immobilier",
    description: "Vous achetez un logement, un terrain ou un local.",
    icone: "cle",
    etatContenu: "validé",
    competenceParDefaut: "immobilier",
    dureeParDefaut: 45,
    questions: QUESTIONS_ACHAT,
    regles: REGLES_ACHAT,
    documentsSocle: ["piece-identite"],
  },
  {
    id: "vente-immobiliere",
    libelle: "Vente immobilière",
    description: "Vous vendez un bien dont vous êtes propriétaire.",
    icone: "panneau",
    etatContenu: "validé",
    competenceParDefaut: "immobilier",
    dureeParDefaut: 45,
    questions: QUESTIONS_VENTE,
    regles: REGLES_VENTE,
    documentsSocle: ["piece-identite", "titre-propriete"],
  },
  {
    id: "succession",
    libelle: "Succession",
    description: "Un proche est décédé et sa succession doit être réglée.",
    icone: "feuille",
    etatContenu: "validé",
    competenceParDefaut: "succession",
    dureeParDefaut: 60,
    questions: QUESTIONS_SUCCESSION,
    regles: REGLES_SUCCESSION,
    documentsSocle: ["piece-identite", "acte-deces", "livret-famille"],
  },
  {
    id: "donation",
    libelle: "Donation",
    description: "Vous souhaitez transmettre un bien de votre vivant.",
    icone: "main",
    etatContenu: "validé",
    competenceParDefaut: "patrimoine",
    dureeParDefaut: 60,
    questions: QUESTIONS_DONATION,
    regles: REGLES_DONATION,
    documentsSocle: ["piece-identite", "livret-famille"],
  },

  /* --- Motifs déclarés, questions à établir avec le notaire (§9) --- */
  {
    id: "contrat-de-mariage",
    libelle: "Contrat de mariage",
    description: "Vous préparez votre mariage ou souhaitez changer de régime.",
    icone: "anneaux",
    etatContenu: "à valider",
    competenceParDefaut: "famille",
    dureeParDefaut: 45,
    questions: [],
    regles: [],
  },
  {
    id: "pacs",
    libelle: "PACS",
    description: "Vous concluez ou modifiez un pacte civil de solidarité.",
    icone: "lien",
    etatContenu: "à valider",
    competenceParDefaut: "famille",
    dureeParDefaut: 30,
    questions: [],
    regles: [],
  },
  {
    id: "divorce-separation",
    libelle: "Divorce ou séparation",
    description: "Votre union prend fin et le patrimoine doit être réparti.",
    icone: "separation",
    etatContenu: "à valider",
    competenceParDefaut: "famille",
    dureeParDefaut: 60,
    questions: [],
    regles: [],
  },
  {
    id: "entreprise",
    libelle: "Création ou transmission d'entreprise",
    description: "Vous créez, cédez ou transmettez une société.",
    icone: "immeuble",
    etatContenu: "à valider",
    competenceParDefaut: "entreprise",
    dureeParDefaut: 60,
    questions: [],
    regles: [],
  },
  {
    id: "procuration",
    libelle: "Procuration",
    description: "Vous donnez à quelqu'un le pouvoir d'agir en votre nom.",
    icone: "plume",
    etatContenu: "à valider",
    competenceParDefaut: "famille",
    dureeParDefaut: 30,
    questions: [],
    regles: [],
  },
  {
    id: "conseil-patrimonial",
    libelle: "Conseil patrimonial",
    description: "Vous souhaitez organiser ou anticiper la gestion de votre patrimoine.",
    icone: "balance",
    etatContenu: "à valider",
    competenceParDefaut: "patrimoine",
    dureeParDefaut: 60,
    questions: [],
    regles: [],
  },
  {
    id: "question-generale",
    libelle: "Question notariale générale",
    description: "Votre demande ne relève pas encore d'une opération précise.",
    icone: "point-interrogation",
    etatContenu: "à valider",
    competenceParDefaut: "patrimoine",
    dureeParDefaut: 30,
    questions: [],
    regles: [],
  },
  {
    id: "autre",
    libelle: "Autre demande",
    description: "Vous décrivez librement l'objet de votre venue.",
    icone: "trois-points",
    etatContenu: "à valider",
    competenceParDefaut: "patrimoine",
    dureeParDefaut: 30,
    questions: [],
    regles: [],
  },
];

/** Accès direct à un motif par son identifiant. */
export function motifParId(id: string): Motif | undefined {
  return MOTIFS.find((motif) => motif.id === id);
}
