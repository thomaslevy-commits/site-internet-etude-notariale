/**
 * Modèles d'e-mails transactionnels du parcours de rendez-vous.
 *
 * Chaque modèle est une fonction pure : mêmes données, même message. Elle rend
 * un objet `{ sujet, html, texte }` — la version texte brut est systématique.
 * L'envoi, la planification et les journaux sont hors de ce fichier.
 *
 * SECRET PROFESSIONNEL — RÈGLE STRUCTURELLE
 * Les modèles ne reçoivent jamais un objet `Demande` complet : ils travaillent
 * sur `ContexteRendezVous`, un type qui ne comporte NI les réponses de
 * qualification, NI les scores, NI aucun élément de dossier. La garantie tient
 * donc à la forme du type, et non à la seule vigilance du rédacteur. La copie
 * interne reçoit en plus l'évaluation (niveaux et intitulés de règles), qui
 * reste factuelle ; les réponses libres, elles, ne quittent pas le tableau de
 * bord de l'étude.
 *
 * TON (CLAUDE.md §3)
 * Sobre, factuel, descriptif. Aucun superlatif, aucune promesse de résultat,
 * aucune comparaison, aucun compte à rebours ni urgence artificielle. Les
 * relances constatent, elles ne pressent pas. Aucun montant n'est mentionné :
 * seul le renvoi à la page /tarif est admis, et il vit dans le pied de page.
 */
import { etude } from "@/config/etude";
import { documentsRequis, type DefinitionDocument } from "../documents";
import { motifParId } from "../motifs";
import type {
  Civilite,
  Demande,
  Evaluation,
  FormatRendezVous,
  Professionnel,
  StatutDemande,
} from "../types";
import {
  adresseCourte,
  blocRecapitulatifHtml,
  blocRecapitulatifTexte,
  boutonsHtml,
  boutonsTexte,
  echapperHtml,
  formaterDateCourte,
  formaterDateLongue,
  formaterDuree,
  formaterHeure,
  formaterPlageHoraire,
  lien,
  lienAnnulation,
  lienDepotPieces,
  lienModification,
  listePuces,
  miseEnPage,
  miseEnPageTexte,
  note,
  paragraphe,
  paragrapheAvecHtml,
  sousTitre,
  titre,
  urlSure,
  type ActionEmail,
  type LigneRecapitulatif,
} from "./rendu";

/* -------------------------------------------------------------------------- */
/* Contrat de sortie et données d'entrée                                      */
/* -------------------------------------------------------------------------- */

/** Message rendu, prêt à être remis à la couche d'envoi. */
export interface EmailRendu {
  sujet: string;
  html: string;
  texte: string;
}

/** Interlocuteur affiché au demandeur — nom et fonction, rien de plus. */
export interface InterlocuteurEmail {
  nom: string;
  fonction: string;
}

/**
 * Données strictement nécessaires à la tenue du rendez-vous.
 *
 * Toute évolution de ce type doit être pesée : ce qui y entre finit dans une
 * boîte aux lettres, canal non maîtrisé par l'étude.
 */
export interface ContexteRendezVous {
  /** Référence lisible communiquée au client (« RDV-2026-0042 »). */
  reference: string;
  civilite: Civilite;
  prenom: string;
  nom: string;
  /** Libellé public du motif — jamais le détail des réponses. */
  motifLibelle: string;
  format: FormatRendezVous;
  /** Début en ISO 8601 ; absent tant que le créneau n'est pas arrêté. */
  debut?: string;
  fin?: string;
  dureeMinutes: number;
  interlocuteur?: InterlocuteurEmail;
  /** Pièces attendues, résolues depuis documents.ts. */
  documentsAttendus: readonly DefinitionDocument[];
  /** Jeton opaque portant les liens de gestion. */
  jeton: string;
  /** Lien de visioconférence, fourni par l'étude au moment de l'envoi. */
  lienVisioconference?: string;
  /** Précision de lieu pour le format « exterieur ». */
  lieuComplement?: string;
}

/** Coordonnées reprises dans la copie interne, réduites à l'utile. */
export interface ContactDemandeur {
  email: string;
  telephone: string;
  moyenContactPrefere: "email" | "telephone";
  langue: string;
}

/**
 * Construit le contexte d'e-mail à partir d'une demande, en ne retenant que
 * les champs publiables. `reponses` et les scores sont volontairement laissés
 * de côté : c'est ici que se joue la minimisation.
 */
export function contexteDepuisDemande(
  demande: Demande,
  options: {
    jeton: string;
    professionnel?: Professionnel;
    lienVisioconference?: string;
    lieuComplement?: string;
    /** Surcharge du libellé de motif ; à défaut, celui du catalogue. */
    motifLibelle?: string;
  },
): ContexteRendezVous {
  return {
    reference: demande.reference,
    civilite: demande.coordonnees.civilite,
    prenom: demande.coordonnees.prenom,
    nom: demande.coordonnees.nom,
    motifLibelle:
      options.motifLibelle ?? motifParId(demande.motif)?.libelle ?? demande.motif,
    format: demande.format,
    debut: demande.creneauDebut,
    fin: demande.creneauFin,
    dureeMinutes: demande.evaluation.dureeMinutes,
    interlocuteur: options.professionnel
      ? { nom: options.professionnel.nom, fonction: options.professionnel.fonction }
      : undefined,
    documentsAttendus: documentsRequis(demande.evaluation.documents),
    jeton: options.jeton,
    lienVisioconference: options.lienVisioconference,
    lieuComplement: options.lieuComplement,
  };
}

/* -------------------------------------------------------------------------- */
/* Fragments communs aux modèles                                              */
/* -------------------------------------------------------------------------- */

/** Adresse d'appel : « Madame Dupont, » — neutre si la civilité n'est pas précisée. */
function appel(contexte: ContexteRendezVous): string {
  const civilites: Record<Civilite, string> = {
    madame: `Madame ${contexte.nom}`,
    monsieur: `Monsieur ${contexte.nom}`,
    "non-precisee": "Madame, Monsieur",
  };
  return `${civilites[contexte.civilite]},`;
}

const LIBELLES_FORMAT: Record<FormatRendezVous, string> = {
  etude: "À l'étude",
  visioconference: "En visioconférence",
  telephone: "Par téléphone",
  exterieur: "En dehors de l'étude",
};

/** Un créneau est indispensable à la plupart des modèles : on échoue tôt. */
function exigerCreneau(contexte: ContexteRendezVous, modele: string): string {
  if (!contexte.debut) {
    throw new Error(
      `Le modèle « ${modele} » exige un créneau : la demande ${contexte.reference} n'en a pas.`,
    );
  }
  return contexte.debut;
}

/** Le rappel à 2 heures ne concerne que la visioconférence. */
export function rappel2hApplicable(contexte: ContexteRendezVous): boolean {
  return contexte.format === "visioconference";
}

/**
 * Lieu ou modalité de connexion, en texte et en HTML.
 * Le lien de visioconférence n'est affiché que s'il est déjà connu ; sinon le
 * message annonce son envoi, ce qui est le fonctionnement nominal (le lien
 * part avec le rappel à 2 heures).
 */
function modalite(contexte: ContexteRendezVous): { texte: string; html?: string } {
  switch (contexte.format) {
    case "etude":
      return { texte: adresseCourte() };
    case "visioconference":
      if (contexte.lienVisioconference) {
        const url = urlSure(contexte.lienVisioconference);
        return {
          texte: `Lien de connexion : ${url}`,
          html: lien(url, "Rejoindre la visioconférence"),
        };
      }
      return {
        texte: "Le lien de connexion vous est adressé avant le rendez-vous.",
      };
    case "telephone":
      return { texte: "L'étude vous appelle au numéro que vous avez communiqué." };
    case "exterieur":
      return {
        texte: contexte.lieuComplement ?? "Le lieu vous est précisé par l'étude.",
      };
  }
}

/** Récapitulatif du rendez-vous. Le motif n'y figure que si on le demande. */
function recapitulatif(
  contexte: ContexteRendezVous,
  options: { avecMotif?: boolean } = {},
): readonly LigneRecapitulatif[] {
  const lignes: LigneRecapitulatif[] = [
    { intitule: "Référence", valeur: contexte.reference },
  ];
  if (options.avecMotif) {
    lignes.push({ intitule: "Objet", valeur: contexte.motifLibelle });
  }
  if (contexte.debut) {
    lignes.push({ intitule: "Date", valeur: formaterDateLongue(contexte.debut) });
    lignes.push({
      intitule: "Heure",
      valeur: `${formaterPlageHoraire(contexte.debut, contexte.fin)} (heure de Paris)`,
    });
  } else {
    lignes.push({ intitule: "Date", valeur: "à fixer" });
  }
  lignes.push({ intitule: "Durée prévue", valeur: formaterDuree(contexte.dureeMinutes) });

  const lieu = modalite(contexte);
  lignes.push({
    intitule: "Format",
    valeur: `${LIBELLES_FORMAT[contexte.format]} — ${lieu.texte}`,
    valeurHtml: lieu.html
      ? `${echapperHtml(LIBELLES_FORMAT[contexte.format])} — ${lieu.html}`
      : undefined,
  });

  if (contexte.interlocuteur) {
    lignes.push({
      intitule: "Interlocuteur",
      valeur: `${contexte.interlocuteur.nom}, ${contexte.interlocuteur.fonction}`,
    });
  }
  return lignes;
}

/**
 * Précisions attachées à une pièce : aide de saisie, rappel « copie suffit »
 * (documents.ts, limite du §2), caractère facultatif.
 */
function precisionsPiece(document: DefinitionDocument): string {
  const precisions: string[] = [];
  if (document.aide) precisions.push(document.aide);
  if (document.copieUniquement) precisions.push("Une copie suffit.");
  if (!document.obligatoire) precisions.push("Facultatif.");
  return precisions.join(" ");
}

function piecesHtml(documents: readonly DefinitionDocument[]): string {
  return listePuces(
    documents.map((document) => {
      const precisions = precisionsPiece(document);
      return (
        `<strong style="font-weight:600;">${echapperHtml(document.libelle)}</strong>` +
        (precisions.length > 0 ? `<br />${echapperHtml(precisions)}` : "")
      );
    }),
  );
}

function piecesTexte(documents: readonly DefinitionDocument[]): string {
  return documents
    .map((document) => {
      const precisions = precisionsPiece(document);
      return precisions.length > 0
        ? `- ${document.libelle} — ${precisions}`
        : `- ${document.libelle}`;
    })
    .join("\n");
}

/** Actions de gestion proposées au client. */
function actionsGestion(contexte: ContexteRendezVous): readonly ActionEmail[] {
  return [
    {
      libelle: "Modifier le rendez-vous",
      url: lienModification(contexte.jeton),
      variante: "primaire",
    },
    {
      libelle: "Annuler le rendez-vous",
      url: lienAnnulation(contexte.jeton),
      variante: "secondaire",
    },
  ];
}

/** Rappel de contact direct, utile quand les liens ne fonctionnent pas. */
function contactDirect(): string {
  return `En cas d'empêchement, vous pouvez prévenir l'étude au ${etude.telephone} ou à l'adresse ${etude.email}.`;
}

/* -------------------------------------------------------------------------- */
/* 1. Confirmation de rendez-vous                                             */
/* -------------------------------------------------------------------------- */

/**
 * Envoyée immédiatement après la réservation d'un créneau.
 * Seul modèle à porter le libellé du motif : il est nécessaire pour que le
 * client vérifie que la demande a bien été comprise. Le sujet, lui, n'en dit
 * rien — il s'affiche sur un écran verrouillé.
 */
export function emailConfirmation(contexte: ContexteRendezVous): EmailRendu {
  const debut = exigerCreneau(contexte, "confirmation");
  const sujet = `Confirmation de votre rendez-vous — ${formaterDateCourte(debut)}, ${formaterHeure(debut)}`;
  const apercu = `${contexte.reference} — ${formaterDateLongue(debut)} à ${formaterHeure(debut)}.`;
  const actions = actionsGestion(contexte);
  const pieces = contexte.documentsAttendus;

  const corpsHtml =
    titre("Votre rendez-vous est confirmé") +
    paragraphe(appel(contexte)) +
    paragraphe(
      `Le rendez-vous que vous avez demandé auprès de l'étude est enregistré. Vous en trouverez le détail ci-dessous.`,
    ) +
    blocRecapitulatifHtml(recapitulatif(contexte, { avecMotif: true })) +
    (pieces.length > 0
      ? sousTitre("Pièces à préparer") +
        paragraphe(
          "Ces pièces permettent de préparer l'entretien. Vous pouvez les déposer à l'avance ou les apporter le jour du rendez-vous.",
        ) +
        piecesHtml(pieces) +
        paragrapheAvecHtml(
          lien(lienDepotPieces(contexte.jeton), "Déposer les pièces en ligne"),
        )
      : "") +
    sousTitre("Modifier ou annuler") +
    paragraphe(
      "Si ce créneau ne convient plus, vous pouvez le modifier ou l'annuler à tout moment.",
    ) +
    boutonsHtml(actions) +
    note(contactDirect());

  const texte = miseEnPageTexte([
    "VOTRE RENDEZ-VOUS EST CONFIRMÉ",
    appel(contexte),
    "Le rendez-vous que vous avez demandé auprès de l'étude est enregistré. Vous en trouverez le détail ci-dessous.",
    blocRecapitulatifTexte(recapitulatif(contexte, { avecMotif: true })),
    ...(pieces.length > 0
      ? [
          "PIÈCES À PRÉPARER",
          "Ces pièces permettent de préparer l'entretien. Vous pouvez les déposer à l'avance ou les apporter le jour du rendez-vous.",
          piecesTexte(pieces),
          `Dépôt en ligne : ${lienDepotPieces(contexte.jeton)}`,
        ]
      : []),
    "MODIFIER OU ANNULER",
    boutonsTexte(actions),
    contactDirect(),
  ]);

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml }),
    texte,
  };
}

/* -------------------------------------------------------------------------- */
/* 2. Rappel à 48 heures                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Envoyé 48 heures avant le créneau. Constat, pas relance : il rappelle la
 * date et laisse ouverte la possibilité de déplacer le rendez-vous, ce qui
 * est précisément l'intérêt d'un rappel à cette échéance.
 */
export function emailRappel48h(contexte: ContexteRendezVous): EmailRendu {
  const debut = exigerCreneau(contexte, "rappel 48 h");
  const sujet = `Votre rendez-vous du ${formaterDateCourte(debut)} à ${formaterHeure(debut)}`;
  const apercu = `Rappel — ${formaterDateLongue(debut)} à ${formaterHeure(debut)}.`;
  const actions = actionsGestion(contexte);
  const piecesManquantes = contexte.documentsAttendus.filter(
    (document) => document.obligatoire,
  );

  const corpsHtml =
    titre("Rappel de votre rendez-vous") +
    paragraphe(appel(contexte)) +
    paragraphe(
      `Votre rendez-vous est prévu dans deux jours. Nous vous en rappelons les éléments.`,
    ) +
    blocRecapitulatifHtml(recapitulatif(contexte)) +
    (piecesManquantes.length > 0
      ? paragrapheAvecHtml(
          `Si vous ne l'avez pas encore fait, vous pouvez ${lien(lienDepotPieces(contexte.jeton), "déposer les pièces demandées")}. À défaut, apportez-les le jour du rendez-vous.`,
        )
      : "") +
    boutonsHtml(actions) +
    note(contactDirect());

  const texte = miseEnPageTexte([
    "RAPPEL DE VOTRE RENDEZ-VOUS",
    appel(contexte),
    "Votre rendez-vous est prévu dans deux jours. Nous vous en rappelons les éléments.",
    blocRecapitulatifTexte(recapitulatif(contexte)),
    ...(piecesManquantes.length > 0
      ? [
          `Si vous ne l'avez pas encore fait, vous pouvez déposer les pièces demandées : ${lienDepotPieces(contexte.jeton)}. À défaut, apportez-les le jour du rendez-vous.`,
        ]
      : []),
    boutonsTexte(actions),
    contactDirect(),
  ]);

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml }),
    texte,
  };
}

/* -------------------------------------------------------------------------- */
/* 3. Rappel à 24 heures                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Envoyé la veille. Plus court que le précédent : à cette échéance, l'utile
 * est l'heure, le lieu et la personne attendue.
 */
export function emailRappel24h(contexte: ContexteRendezVous): EmailRendu {
  const debut = exigerCreneau(contexte, "rappel 24 h");
  const sujet = `Rappel : votre rendez-vous du ${formaterDateCourte(debut)} à ${formaterHeure(debut)}`;
  const apercu = `${formaterDateLongue(debut)} à ${formaterHeure(debut)} — ${LIBELLES_FORMAT[contexte.format].toLowerCase()}.`;
  const actions = actionsGestion(contexte);

  const corpsHtml =
    titre("Votre rendez-vous a lieu demain") +
    paragraphe(appel(contexte)) +
    paragraphe("Voici les éléments de votre rendez-vous.") +
    blocRecapitulatifHtml(recapitulatif(contexte)) +
    (contexte.format === "etude"
      ? note(
          "L'accueil se fait à l'adresse indiquée ci-dessus. Merci de vous munir d'une pièce d'identité.",
        )
      : "") +
    boutonsHtml(actions) +
    note(contactDirect());

  const texte = miseEnPageTexte([
    "VOTRE RENDEZ-VOUS A LIEU DEMAIN",
    appel(contexte),
    "Voici les éléments de votre rendez-vous.",
    blocRecapitulatifTexte(recapitulatif(contexte)),
    ...(contexte.format === "etude"
      ? [
          "L'accueil se fait à l'adresse indiquée ci-dessus. Merci de vous munir d'une pièce d'identité.",
        ]
      : []),
    boutonsTexte(actions),
    contactDirect(),
  ]);

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml }),
    texte,
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Rappel à 2 heures — visioconférence uniquement                          */
/* -------------------------------------------------------------------------- */

/**
 * Envoyé deux heures avant, exclusivement pour les rendez-vous en
 * visioconférence : c'est le message qui porte le lien de connexion. Il n'a
 * pas d'objet pour les autres formats et refuse d'être rendu — mieux vaut une
 * erreur à la construction qu'un message sans contenu utile.
 */
export function emailRappel2hVisioconference(contexte: ContexteRendezVous): EmailRendu {
  const debut = exigerCreneau(contexte, "rappel 2 h");
  if (!rappel2hApplicable(contexte)) {
    throw new Error(
      `Le rappel à 2 heures est réservé à la visioconférence ; format reçu : ${contexte.format}.`,
    );
  }
  if (!contexte.lienVisioconference) {
    throw new Error(
      `Le rappel à 2 heures exige un lien de visioconférence (demande ${contexte.reference}).`,
    );
  }
  const url = urlSure(contexte.lienVisioconference);
  const sujet = `Lien de connexion — votre rendez-vous à ${formaterHeure(debut)}`;
  const apercu = `Visioconférence à ${formaterHeure(debut)} (heure de Paris).`;
  const actions: readonly ActionEmail[] = [
    { libelle: "Rejoindre la visioconférence", url, variante: "primaire" },
  ];

  const corpsHtml =
    titre("Lien de connexion à votre rendez-vous") +
    paragraphe(appel(contexte)) +
    paragraphe(
      `Votre rendez-vous en visioconférence a lieu aujourd'hui à ${formaterHeure(debut)}, heure de Paris. Le lien de connexion figure ci-dessous.`,
    ) +
    blocRecapitulatifHtml(recapitulatif(contexte)) +
    boutonsHtml(actions) +
    note(
      "Le lien est personnel : il vous est réservé et n'a pas vocation à être transféré.",
    ) +
    note(contactDirect());

  const texte = miseEnPageTexte([
    "LIEN DE CONNEXION À VOTRE RENDEZ-VOUS",
    appel(contexte),
    `Votre rendez-vous en visioconférence a lieu aujourd'hui à ${formaterHeure(debut)}, heure de Paris. Le lien de connexion figure ci-dessous.`,
    blocRecapitulatifTexte(recapitulatif(contexte)),
    boutonsTexte(actions),
    "Le lien est personnel : il vous est réservé et n'a pas vocation à être transféré.",
    contactDirect(),
  ]);

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml }),
    texte,
  };
}

/* -------------------------------------------------------------------------- */
/* 5. Relance — pièces manquantes                                             */
/* -------------------------------------------------------------------------- */

/**
 * Envoyée lorsque des pièces demandées n'ont pas été reçues. Elle constate
 * l'absence, indique où déposer, et précise que le rendez-vous se tient de
 * toute façon : aucune pression, aucune conséquence brandie (§3).
 *
 * `piecesManquantes` est calculée par l'appelant (documents attendus moins
 * documents fournis) : le modèle ne devine rien.
 */
export function emailPiecesManquantes(
  contexte: ContexteRendezVous,
  piecesManquantes: readonly DefinitionDocument[],
): EmailRendu {
  if (piecesManquantes.length === 0) {
    throw new Error(
      `Relance « pièces manquantes » demandée sans pièce manquante (demande ${contexte.reference}).`,
    );
  }
  const sujet = contexte.debut
    ? `Pièces à transmettre avant votre rendez-vous du ${formaterDateCourte(contexte.debut)}`
    : "Pièces à transmettre pour votre rendez-vous";
  const apercu = `${piecesManquantes.length} pièce(s) restant à transmettre — référence ${contexte.reference}.`;
  const actions: readonly ActionEmail[] = [
    {
      libelle: "Déposer les pièces",
      url: lienDepotPieces(contexte.jeton),
      variante: "primaire",
    },
    {
      libelle: "Modifier le rendez-vous",
      url: lienModification(contexte.jeton),
      variante: "secondaire",
    },
  ];

  const corpsHtml =
    titre("Pièces restant à transmettre") +
    paragraphe(appel(contexte)) +
    paragraphe(
      contexte.debut
        ? `En vue de votre rendez-vous du ${formaterDateLongue(contexte.debut)}, l'étude n'a pas encore reçu les pièces suivantes.`
        : "En vue de votre rendez-vous, l'étude n'a pas encore reçu les pièces suivantes.",
    ) +
    piecesHtml(piecesManquantes) +
    paragraphe(
      "Vous pouvez les déposer en ligne ou les apporter le jour du rendez-vous. L'entretien se tient dans tous les cas ; les pièces sont alors examinées ensuite.",
    ) +
    boutonsHtml(actions) +
    note(
      "Les pièces déposées sont des copies, conservées le temps de préparer le rendez-vous.",
    ) +
    note(contactDirect());

  const texte = miseEnPageTexte([
    "PIÈCES RESTANT À TRANSMETTRE",
    appel(contexte),
    contexte.debut
      ? `En vue de votre rendez-vous du ${formaterDateLongue(contexte.debut)}, l'étude n'a pas encore reçu les pièces suivantes.`
      : "En vue de votre rendez-vous, l'étude n'a pas encore reçu les pièces suivantes.",
    piecesTexte(piecesManquantes),
    "Vous pouvez les déposer en ligne ou les apporter le jour du rendez-vous. L'entretien se tient dans tous les cas ; les pièces sont alors examinées ensuite.",
    boutonsTexte(actions),
    "Les pièces déposées sont des copies, conservées le temps de préparer le rendez-vous.",
    contactDirect(),
  ]);

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml }),
    texte,
  };
}

/* -------------------------------------------------------------------------- */
/* 6. Copie interne à l'étude                                                 */
/* -------------------------------------------------------------------------- */

/** Destinataire par défaut de la copie interne — issu du NAP (§7). */
export const DESTINATAIRE_INTERNE = etude.email;

const LIBELLES_STATUT: Record<StatutDemande, string> = {
  brouillon: "Brouillon",
  "qualification-en-cours": "Qualification en cours",
  "attente-documents": "En attente de pièces",
  "prete-a-planifier": "Prête à planifier",
  "rendez-vous-confirme": "Rendez-vous confirmé",
  "rendez-vous-a-valider": "Rendez-vous à valider",
  "rendez-vous-realise": "Rendez-vous réalisé",
  annule: "Annulé",
  "sans-suite": "Sans suite",
  "converti-en-dossier": "Converti en dossier",
};

export interface OptionsCopieInterne {
  evaluation: Evaluation;
  contact: ContactDemandeur;
  statut: StatutDemande;
  /** Pièces déjà déposées, pour éviter une vérification manuelle. */
  piecesFournies?: readonly DefinitionDocument[];
  /** Lien vers la fiche du tableau de bord interne. */
  lienFicheInterne?: string;
}

/**
 * Copie adressée à l'étude. Plus détaillée que les messages au client —
 * niveaux d'urgence et de complexité, compétence retenue, règles déclenchées,
 * coordonnées — mais toujours factuelle et sans commentaire.
 *
 * Ce qu'elle ne contient pas, volontairement : les réponses au questionnaire
 * et le contenu des pièces. Une boîte aux lettres n'est pas le bon support ;
 * le message renvoie au tableau de bord, où les accès sont journalisés.
 */
export function emailCopieInterne(
  contexte: ContexteRendezVous,
  options: OptionsCopieInterne,
): EmailRendu {
  const { evaluation, contact, statut } = options;
  const sujet = contexte.debut
    ? `[${contexte.reference}] ${contexte.motifLibelle} — ${formaterDateCourte(contexte.debut)}, ${formaterHeure(contexte.debut)}`
    : `[${contexte.reference}] ${contexte.motifLibelle} — créneau à fixer`;
  const apercu = `${LIBELLES_STATUT[statut]} — urgence ${evaluation.urgence}, complexité ${evaluation.complexite}.`;

  const lignesDossier: readonly LigneRecapitulatif[] = [
    ...recapitulatif(contexte, { avecMotif: true }),
    { intitule: "Statut", valeur: LIBELLES_STATUT[statut] },
    { intitule: "Urgence", valeur: `${evaluation.urgence} (score ${evaluation.scoreUrgence})` },
    {
      intitule: "Complexité",
      valeur: `${evaluation.complexite} (score ${evaluation.scoreComplexite})`,
    },
    { intitule: "Compétence retenue", valeur: evaluation.competence },
  ];

  const lignesContact: readonly LigneRecapitulatif[] = [
    { intitule: "Demandeur", valeur: `${contexte.prenom} ${contexte.nom}` },
    { intitule: "Courriel", valeur: contact.email },
    { intitule: "Téléphone", valeur: contact.telephone },
    { intitule: "Contact préféré", valeur: contact.moyenContactPrefere },
    { intitule: "Langue", valeur: contact.langue },
  ];

  const attendues = contexte.documentsAttendus;
  const fournies = options.piecesFournies ?? [];
  const idsFournies = new Set(fournies.map((document) => document.id));
  const manquantes = attendues.filter((document) => !idsFournies.has(document.id));

  const actions: readonly ActionEmail[] = options.lienFicheInterne
    ? [
        {
          libelle: "Ouvrir la fiche",
          url: options.lienFicheInterne,
          variante: "primaire",
        },
      ]
    : [];

  const corpsHtml =
    titre(`Demande ${contexte.reference}`) +
    blocRecapitulatifHtml(lignesDossier) +
    sousTitre("Demandeur") +
    blocRecapitulatifHtml(lignesContact) +
    sousTitre("Éléments déclenchés par la qualification") +
    (evaluation.motifsDeclenches.length > 0
      ? listePuces(evaluation.motifsDeclenches.map((intitule) => echapperHtml(intitule)))
      : paragraphe("Aucune règle déclenchée.")) +
    sousTitre("Pièces") +
    (attendues.length > 0
      ? listePuces(
          attendues.map(
            (document) =>
              `${echapperHtml(document.libelle)} — ${idsFournies.has(document.id) ? "reçue" : "non reçue"}${document.obligatoire ? "" : " (facultative)"}`,
          ),
        )
      : paragraphe("Aucune pièce demandée.")) +
    (manquantes.length > 0
      ? note(`${manquantes.length} pièce(s) attendue(s) non reçue(s).`)
      : "") +
    boutonsHtml(actions) +
    note(
      "Les réponses au questionnaire de qualification ne sont pas reprises ici : elles restent consultables dans le tableau de bord de l'étude.",
    );

  const texte = miseEnPageTexte(
    [
      `DEMANDE ${contexte.reference}`,
      blocRecapitulatifTexte(lignesDossier),
      "DEMANDEUR",
      blocRecapitulatifTexte(lignesContact),
      "ÉLÉMENTS DÉCLENCHÉS PAR LA QUALIFICATION",
      evaluation.motifsDeclenches.length > 0
        ? evaluation.motifsDeclenches.map((intitule) => `- ${intitule}`).join("\n")
        : "Aucune règle déclenchée.",
      "PIÈCES",
      attendues.length > 0
        ? attendues
            .map(
              (document) =>
                `- ${document.libelle} — ${idsFournies.has(document.id) ? "reçue" : "non reçue"}${document.obligatoire ? "" : " (facultative)"}`,
            )
            .join("\n")
        : "Aucune pièce demandée.",
      ...(actions.length > 0 ? [boutonsTexte(actions)] : []),
      "Les réponses au questionnaire de qualification ne sont pas reprises ici : elles restent consultables dans le tableau de bord de l'étude.",
    ],
    { interne: true },
  );

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml, interne: true }),
    texte,
  };
}

/* -------------------------------------------------------------------------- */
/* 7. Remerciement après rendez-vous                                          */
/* -------------------------------------------------------------------------- */

export interface OptionsRemerciement {
  /**
   * Prochaines étapes, rédigées par l'étude après l'entretien.
   *
   * Elles ne sont jamais générées automatiquement : elles décrivent la suite
   * d'un dossier, donc du contenu de fond (CLAUDE.md §9). La liste vide donne
   * une formulation neutre d'attente.
   */
  prochainesEtapes?: readonly string[];
}

/**
 * Envoyé après la tenue du rendez-vous. Il remercie, rappelle la date de
 * l'entretien et énonce les suites annoncées — rien de plus : le compte rendu
 * de l'entretien ne circule pas par e-mail.
 */
export function emailRemerciement(
  contexte: ContexteRendezVous,
  options: OptionsRemerciement = {},
): EmailRendu {
  const debut = exigerCreneau(contexte, "remerciement");
  const sujet = `Suite à votre rendez-vous du ${formaterDateCourte(debut)}`;
  const apercu = `Référence ${contexte.reference} — prochaines étapes.`;
  const etapes = options.prochainesEtapes ?? [];

  const corpsHtml =
    titre("Suite à votre rendez-vous") +
    paragraphe(appel(contexte)) +
    paragraphe(
      `Nous vous remercions du temps que vous avez consacré à cet entretien du ${formaterDateLongue(debut)}${contexte.interlocuteur ? `, avec ${contexte.interlocuteur.nom}` : ""}.`,
    ) +
    sousTitre("Prochaines étapes") +
    (etapes.length > 0
      ? listePuces(etapes.map((etape) => echapperHtml(etape)))
      : paragraphe(
          "L'étude revient vers vous pour vous indiquer les suites à donner à votre dossier.",
        )) +
    paragraphe(
      "Pour toute question sur ces éléments, vous pouvez répondre à ce message ou appeler l'étude.",
    ) +
    note(
      `Référence de votre demande : ${contexte.reference}. Les échanges relatifs à votre dossier se poursuivent avec l'étude, qui reste seule destinataire des pièces.`,
    );

  const texte = miseEnPageTexte([
    "SUITE À VOTRE RENDEZ-VOUS",
    appel(contexte),
    `Nous vous remercions du temps que vous avez consacré à cet entretien du ${formaterDateLongue(debut)}${contexte.interlocuteur ? `, avec ${contexte.interlocuteur.nom}` : ""}.`,
    "PROCHAINES ÉTAPES",
    etapes.length > 0
      ? etapes.map((etape) => `- ${etape}`).join("\n")
      : "L'étude revient vers vous pour vous indiquer les suites à donner à votre dossier.",
    "Pour toute question sur ces éléments, vous pouvez répondre à ce message ou appeler l'étude.",
    `Référence de votre demande : ${contexte.reference}.`,
  ]);

  return {
    sujet,
    html: miseEnPage({ titreDocument: sujet, apercu, corpsHtml }),
    texte,
  };
}
