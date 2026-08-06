/**
 * Adaptateur de secours : il n'appelle aucun CRM.
 *
 * C'est le comportement PAR DÉFAUT tant que le notaire n'a pas communiqué son
 * CRM. Chaque opération est journalisée telle qu'elle SERAIT transmise, puis
 * rend un succès porteur d'une référence simulée. Le parcours de prise de
 * rendez-vous fonctionne donc de bout en bout, sans dépendance externe, et
 * l'étude dispose déjà de la trace exacte de ce qui partira le jour du
 * branchement.
 *
 * Ce que cet adaptateur ne fait jamais :
 *   — aucun accès réseau, aucune lecture de fichier, aucun secret ;
 *   — aucune invention de doublon : `rechercherContact` rend toujours une
 *     liste vide, faute de base à interroger. L'appelant traite donc chaque
 *     demande comme un nouveau contact, ce qui est la position sûre ;
 *   — aucune donnée de dossier dans le journal : seuls des identifiants, des
 *     compteurs et des codes y figurent (CLAUDE.md §2, secret professionnel).
 *
 * Les références simulées sont préfixées `simule:` afin qu'aucune ne puisse
 * être confondue avec un identifiant réel dans une base ou un export.
 */
import {
  cleIdempotence,
  succes,
  type AdaptateurCrm,
  type AttributionEntrante,
  type ContactEntrant,
  type CritereRechercheContact,
  type DossierEntrant,
  type EtatConfigurationCrm,
  type OperationCrm,
  type OpportuniteEntrante,
  type QualificationEntrante,
  type ReferenceCrm,
  type ReferencesDocumentsEntrantes,
  type RendezVousEntrant,
  type ResultatCrm,
  type ResultatRechercheContact,
  type StatutEntrant,
  VARIABLES_ENVIRONNEMENT_CRM,
} from "./adaptateur";
import {
  cheminsIncomplets,
  CORRESPONDANCES_PAR_DEFAUT,
  resoudreStatut,
  type Correspondances,
} from "./correspondances";
import { creerJournalMemoire, entreeSimulee, resumerReponses, type Journal } from "./journal";

export const IDENTIFIANT_ADAPTATEUR_JOURNALISANT = "journal";

export interface OptionsAdaptateurJournalisant {
  /** Destination des entrées. Par défaut, un journal en mémoire. */
  readonly journal?: Journal;
  /** Table de correspondance, pour signaler ce qui reste à remplir. */
  readonly correspondances?: Correspondances;
  /** Horloge injectée : rend les entrées reproductibles en test. */
  readonly maintenant?: () => Date;
}

/**
 * Empreinte courte et stable d'une chaîne. Non cryptographique : elle ne sert
 * qu'à fabriquer des identifiants simulés lisibles et déterministes, jamais à
 * protéger quoi que ce soit.
 */
function empreinteCourte(valeur: string): string {
  let accumulateur = 2_166_136_261;
  for (let index = 0; index < valeur.length; index += 1) {
    accumulateur ^= valeur.charCodeAt(index);
    accumulateur = Math.imul(accumulateur, 16_777_619);
  }
  return (accumulateur >>> 0).toString(36).padStart(7, "0");
}

function referenceSimulee(type: string, graine: string): ReferenceCrm {
  return { id: `simule:${type}:${empreinteCourte(graine)}` };
}

/**
 * Crée l'adaptateur de secours.
 *
 * @param options Journal, correspondances et horloge. Tout est facultatif :
 *                `creerAdaptateurJournalisant()` suffit à faire tourner le
 *                parcours.
 */
export function creerAdaptateurJournalisant(
  options: OptionsAdaptateurJournalisant = {},
): AdaptateurCrm {
  const journal = options.journal ?? creerJournalMemoire();
  const correspondances = options.correspondances ?? CORRESPONDANCES_PAR_DEFAUT;
  const maintenant = options.maintenant ?? (() => new Date());

  /** Journalise une opération simulée et rend le résultat attendu. */
  function tracer(
    operation: OperationCrm,
    referenceDemande: string,
    details: {
      readonly referenceCrm?: string;
      readonly champsTransmis?: number;
      readonly message?: string;
    },
  ): void {
    journal.enregistrer(
      entreeSimulee(
        {
          adaptateur: IDENTIFIANT_ADAPTATEUR_JOURNALISANT,
          operation,
          referenceDemande,
          essai: 1,
          horodatage: maintenant().toISOString(),
        },
        details,
      ),
    );
  }

  return {
    identifiant: IDENTIFIANT_ADAPTATEUR_JOURNALISANT,
    libelle: "Journalisation locale (aucun CRM configuré)",

    async verifierConfiguration(): Promise<ResultatCrm<EtatConfigurationCrm>> {
      const manquantes = cheminsIncomplets(correspondances);
      tracer("verification-configuration", "-", {
        message: `${manquantes.length} correspondance(s) à remplir`,
      });
      // Volontairement `operationnel: false` : le tableau de bord doit montrer
      // que rien n'est réellement synchronisé, même si le parcours fonctionne.
      return succes({
        operationnel: false,
        variablesManquantes: [
          VARIABLES_ENVIRONNEMENT_CRM.fournisseur,
          VARIABLES_ENVIRONNEMENT_CRM.urlBase,
        ],
        correspondancesManquantes: manquantes,
        remarque:
          "Aucun CRM communiqué : les opérations sont journalisées, pas transmises.",
      });
    },

    async rechercherContact(
      critere: CritereRechercheContact,
    ): Promise<ResultatCrm<ResultatRechercheContact>> {
      const critereUtilise =
        critere.email !== undefined ? "email" : critere.telephone !== undefined ? "telephone" : "aucun";
      // Le critère est journalisé, sa VALEUR ne l'est pas : une adresse ou un
      // numéro est une donnée personnelle, pas une métadonnée.
      tracer("recherche-contact", "-", { message: `critère : ${critereUtilise}` });
      return succes({ correspondances: [], critere: critereUtilise });
    },

    async enregistrerContact(
      entrant: ContactEntrant,
    ): Promise<ResultatCrm<ReferenceCrm>> {
      const reference = entrant.existant ?? referenceSimulee("contact", entrant.referenceDemande);
      // On compte les champs renseignés ; aucun n'est recopié dans le journal.
      const champsTransmis = Object.values(entrant.coordonnees).filter(
        (valeur) => valeur !== undefined && valeur !== "",
      ).length;
      tracer("enregistrement-contact", entrant.referenceDemande, {
        referenceCrm: reference.id,
        champsTransmis,
        message: entrant.existant === undefined ? "création simulée" : "mise à jour simulée",
      });
      return succes(reference);
    },

    async creerDossier(
      entrant: DossierEntrant,
    ): Promise<ResultatCrm<ReferenceCrm>> {
      const reference = referenceSimulee("dossier", entrant.referenceDemande);
      tracer("creation-dossier", entrant.referenceDemande, {
        referenceCrm: reference.id,
        message: `motif ${entrant.motif}, urgence ${entrant.evaluation.urgence}, complexité ${entrant.evaluation.complexite}`,
      });
      return succes(reference);
    },

    async creerOpportunite(
      entrant: OpportuniteEntrante,
    ): Promise<ResultatCrm<ReferenceCrm>> {
      const reference = referenceSimulee("opportunite", entrant.referenceDemande);
      tracer("creation-opportunite", entrant.referenceDemande, {
        referenceCrm: reference.id,
        message: `motif ${entrant.motif}, ${entrant.dureeMinutes} min`,
      });
      return succes(reference);
    },

    async attribuer(
      entrant: AttributionEntrante,
    ): Promise<ResultatCrm<void>> {
      tracer("attribution", entrant.referenceDemande, {
        referenceCrm: entrant.cible.id,
        message: `professionnel ${entrant.professionnelId} → propriétaire « ${entrant.proprietaireCrm} »`,
      });
      return succes(undefined);
    },

    async envoyerQualification(
      entrant: QualificationEntrante,
    ): Promise<ResultatCrm<void>> {
      const resume = resumerReponses(entrant.reponses);
      // Seuls les identifiants de questions sont tracés ; les réponses du
      // demandeur ne figurent nulle part dans le journal.
      tracer("envoi-qualification", entrant.referenceDemande, {
        referenceCrm: entrant.cible.id,
        champsTransmis: resume.nombreChamps,
        message: `questions : ${resume.identifiants.join(", ") || "aucune"}`,
      });
      return succes(undefined);
    },

    async transmettreReferencesDocuments(
      entrant: ReferencesDocumentsEntrantes,
    ): Promise<ResultatCrm<void>> {
      const identifiants = entrant.documents.map((document) => document.documentId).join(", ");
      tracer("references-documents", entrant.referenceDemande, {
        referenceCrm: entrant.cible.id,
        champsTransmis: entrant.documents.length,
        message: `pièces déposées : ${identifiants || "aucune"} ; attendues : ${
          entrant.attendus.join(", ") || "aucune"
        }`,
      });
      return succes(undefined);
    },

    async synchroniserStatut(
      entrant: StatutEntrant,
    ): Promise<ResultatCrm<void>> {
      const cible = resoudreStatut(correspondances, entrant.statut) ?? "(correspondance à remplir)";
      tracer("synchronisation-statut", entrant.referenceDemande, {
        referenceCrm: entrant.cible.id,
        message: `statut ${entrant.statut} → ${cible}`,
      });
      return succes(undefined);
    },

    async synchroniserRendezVous(
      entrant: RendezVousEntrant,
    ): Promise<ResultatCrm<ReferenceCrm>> {
      const reference =
        entrant.evenementExistant ??
        referenceSimulee(
          "rendez-vous",
          cleIdempotence(entrant.referenceDemande, "synchronisation-rendez-vous"),
        );
      const action = entrant.annule === true ? "annulation" : "création ou report";
      tracer("synchronisation-rendez-vous", entrant.referenceDemande, {
        referenceCrm: reference.id,
        message: `${action} — ${entrant.debut} → ${entrant.fin}, format ${entrant.format}`,
      });
      return succes(reference);
    },
  };
}
