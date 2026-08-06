/**
 * Génération des créneaux proposés (étape 7 du parcours).
 *
 * PORTÉE DE CE FICHIER
 * Il produit les créneaux théoriques de l'étude : jours ouvrés, horaires
 * d'ouverture, durée du rendez-vous issue de la qualification, temps tampon
 * entre deux rendez-vous, jours fériés et indisponibilités déclarées.
 *
 * Il ne consulte AUCUN agenda réel : la disponibilité effective viendra de la
 * synchronisation calendrier (Google, Microsoft 365 ou agenda interne), qui
 * retranchera les occupations. La prévention des doubles réservations ne peut
 * pas reposer sur ce calcul : elle exige un verrou en base au moment de la
 * réservation (voir docs/rendez-vous/01-architecture.md).
 *
 * Fonctions pures : la date de référence est injectée, jamais lue de
 * l'horloge en interne, afin que les tests soient stables.
 */
import { etude } from "@/config/etude";
import type { Creneau, FormatRendezVous } from "./types";

export const FUSEAU = "Europe/Paris";

/** Temps tampon laissé entre deux rendez-vous, en minutes. */
export const TAMPON_MINUTES = 15;

/** Délai minimal entre la réservation et le rendez-vous, en heures. */
export const PREAVIS_HEURES = 24;

/**
 * Décalage horaire de Paris à un instant donné, en minutes.
 * Calculé via Intl plutôt que codé en dur : le passage heure d'été / heure
 * d'hiver ferait autrement dériver tous les créneaux d'une heure.
 */
function decalageParisMinutes(instant: Date): number {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parties = Object.fromEntries(
    format.formatToParts(instant).map((partie) => [partie.type, partie.value]),
  );
  const commeUtc = Date.UTC(
    Number(parties.year),
    Number(parties.month) - 1,
    Number(parties.day),
    Number(parties.hour) === 24 ? 0 : Number(parties.hour),
    Number(parties.minute),
    Number(parties.second),
  );
  return (commeUtc - instant.getTime()) / 60_000;
}

/** Instant correspondant à une heure locale parisienne donnée. */
function instantParis(annee: number, mois: number, jour: number, heure: number, minute: number): Date {
  const approximation = new Date(Date.UTC(annee, mois - 1, jour, heure, minute));
  const decalage = decalageParisMinutes(approximation);
  return new Date(approximation.getTime() - decalage * 60_000);
}

/** Dimanche de Pâques (algorithme de Meeus), pour les fêtes mobiles. */
function paques(annee: number): { mois: number; jour: number } {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return { mois, jour };
}

/** Jours fériés français d'une année, au format « MM-JJ ». */
export function joursFeries(annee: number): ReadonlySet<string> {
  const cle = (mois: number, jour: number) =>
    `${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;

  const fixes = [
    cle(1, 1), // Jour de l'an
    cle(5, 1), // Fête du travail
    cle(5, 8), // Victoire 1945
    cle(7, 14), // Fête nationale
    cle(8, 15), // Assomption
    cle(11, 1), // Toussaint
    cle(11, 11), // Armistice 1918
    cle(12, 25), // Noël
  ];

  const { mois, jour } = paques(annee);
  const dimanchePaques = Date.UTC(annee, mois - 1, jour);
  const ajouter = (jours: number) => {
    const d = new Date(dimanchePaques + jours * 86_400_000);
    return cle(d.getUTCMonth() + 1, d.getUTCDate());
  };

  return new Set([
    ...fixes,
    ajouter(1), // Lundi de Pâques
    ajouter(39), // Ascension
    ajouter(50), // Lundi de Pentecôte
  ]);
}

/** Correspondance entre les jours de horairesSchema et les indices JavaScript. */
const INDICE_JOUR: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/** Indisponibilité déclarée : plage pendant laquelle rien n'est proposé. */
export interface Indisponibilite {
  professionnelId: string;
  debut: string;
  fin: string;
  motif?: string;
}

export interface OptionsCreneaux {
  professionnelId: string;
  /** Durée du rendez-vous en minutes, issue de l'évaluation. */
  dureeMinutes: number;
  formats: readonly FormatRendezVous[];
  /** Nombre de jours explorés à partir de la date de référence. */
  horizonJours?: number;
  indisponibilites?: readonly Indisponibilite[];
}

/**
 * Créneaux théoriquement proposables sur l'horizon demandé.
 * Le pas de départ des rendez-vous est la durée majorée du tampon : deux
 * rendez-vous consécutifs ne peuvent donc jamais se toucher.
 */
export function genererCreneaux(
  options: OptionsCreneaux,
  maintenant: Date = new Date(),
): readonly Creneau[] {
  const {
    professionnelId,
    dureeMinutes,
    formats,
    horizonJours = 21,
    indisponibilites = [],
  } = options;

  const ouverture = etude.horairesSchema.ouverture.split(":").map(Number);
  const fermeture = etude.horairesSchema.fermeture.split(":").map(Number);
  const joursOuvres = new Set(
    etude.horairesSchema.jours.map((jour) => INDICE_JOUR[jour]).filter((i) => i !== undefined),
  );

  const pasMinutes = dureeMinutes + TAMPON_MINUTES;
  const premierPossible = new Date(maintenant.getTime() + PREAVIS_HEURES * 3_600_000);
  const creneaux: Creneau[] = [];

  for (let decalageJour = 0; decalageJour <= horizonJours; decalageJour++) {
    const jourRef = new Date(maintenant.getTime() + decalageJour * 86_400_000);
    // Composantes du jour telles qu'observées à Paris.
    const partiesJour = new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSEAU,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(jourRef);
    const [annee, mois, jour] = partiesJour.split("-").map(Number);

    // Midi : à l'abri des bascules d'heure d'été, qui surviennent la nuit.
    const reference = instantParis(annee, mois, jour, 12, 0);
    const jourCourt = new Intl.DateTimeFormat("en-US", {
      timeZone: FUSEAU,
      weekday: "short",
    }).format(reference);
    const indiceJour = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(jourCourt);

    if (!joursOuvres.has(indiceJour)) continue;
    const cleFerie = `${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
    if (joursFeries(annee).has(cleFerie)) continue;

    const debutJournee = instantParis(annee, mois, jour, ouverture[0], ouverture[1] ?? 0);
    const finJournee = instantParis(annee, mois, jour, fermeture[0], fermeture[1] ?? 0);

    for (
      let depart = debutJournee.getTime();
      depart + dureeMinutes * 60_000 <= finJournee.getTime();
      depart += pasMinutes * 60_000
    ) {
      const debut = new Date(depart);
      const fin = new Date(depart + dureeMinutes * 60_000);
      if (debut < premierPossible) continue;

      const chevauche = indisponibilites.some(
        (indispo) =>
          indispo.professionnelId === professionnelId &&
          debut < new Date(indispo.fin) &&
          fin > new Date(indispo.debut),
      );
      if (chevauche) continue;

      creneaux.push({
        debut: debut.toISOString(),
        fin: fin.toISOString(),
        professionnelId,
        formats,
      });
    }
  }

  return creneaux;
}

/** Regroupe les créneaux par journée, pour l'affichage du calendrier. */
export function grouperParJour(
  creneaux: readonly Creneau[],
): readonly { jour: string; creneaux: readonly Creneau[] }[] {
  const groupes = new Map<string, Creneau[]>();
  for (const creneau of creneaux) {
    const jour = new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSEAU,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(creneau.debut));
    const liste = groupes.get(jour) ?? [];
    liste.push(creneau);
    groupes.set(jour, liste);
  }
  return [...groupes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([jour, liste]) => ({ jour, creneaux: liste }));
}

/** Heure locale parisienne d'un créneau, au format « 14 h 30 ». */
export function heureLocale(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(":", " h ");
}

/** Jour en toutes lettres, par exemple « mardi 12 août 2026 ». */
export function jourLocal(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
