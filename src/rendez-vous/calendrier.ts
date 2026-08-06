/**
 * Ajout du rendez-vous à l'agenda du demandeur (étape 9).
 *
 * Trois chemins sont proposés : un fichier .ics — lu par Apple Calendar,
 * Outlook et la plupart des agendas — et deux liens web pour Google Agenda et
 * Outlook en ligne.
 *
 * CONFIDENTIALITÉ : le contenu de l'événement se limite au nécessaire. Ni le
 * motif détaillé, ni les réponses de qualification n'y figurent : un titre
 * d'agenda est visible par toute personne ayant accès au calendrier, et parfois
 * synchronisé chez des tiers.
 */
import { etude } from "@/config/etude";

export interface EvenementAgenda {
  reference: string;
  debut: string;
  fin: string;
  /** Nom de l'interlocuteur, sans mention du dossier. */
  interlocuteur: string;
  /** Lieu déjà formaté, ou mention du format à distance. */
  lieu: string;
}

/** Format de date exigé par la norme iCalendar : AAAAMMJJTHHMMSSZ. */
function horodatageUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function titre(): string {
  return `Rendez-vous notarial — ${etude.nom}`;
}

function descriptionCourte(evenement: EvenementAgenda): string {
  return [
    `Interlocuteur : ${evenement.interlocuteur}`,
    `Référence : ${evenement.reference}`,
    `Téléphone de l'étude : ${etude.telephone}`,
  ].join("\n");
}

/** Échappement des caractères spéciaux de la norme iCalendar. */
function echapperIcs(texte: string): string {
  return texte.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Contenu d'un fichier .ics, à proposer en téléchargement. */
export function construireIcs(evenement: EvenementAgenda): string {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Etude notariale//Prise de rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evenement.reference}@${etude.siteUrl.replace(/^https?:\/\//, "")}`,
    `DTSTAMP:${horodatageUtc(new Date().toISOString())}`,
    `DTSTART:${horodatageUtc(evenement.debut)}`,
    `DTEND:${horodatageUtc(evenement.fin)}`,
    `SUMMARY:${echapperIcs(titre())}`,
    `LOCATION:${echapperIcs(evenement.lieu)}`,
    `DESCRIPTION:${echapperIcs(descriptionCourte(evenement))}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${echapperIcs(titre())}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // La norme impose des fins de ligne CRLF.
  return lignes.join("\r\n");
}

/** Lien d'ajout à Google Agenda. */
export function lienGoogleAgenda(evenement: EvenementAgenda): string {
  const parametres = new URLSearchParams({
    action: "TEMPLATE",
    text: titre(),
    dates: `${horodatageUtc(evenement.debut)}/${horodatageUtc(evenement.fin)}`,
    details: descriptionCourte(evenement),
    location: evenement.lieu,
  });
  return `https://calendar.google.com/calendar/render?${parametres.toString()}`;
}

/** Lien d'ajout à Outlook en ligne. */
export function lienOutlook(evenement: EvenementAgenda): string {
  const parametres = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: titre(),
    startdt: new Date(evenement.debut).toISOString(),
    enddt: new Date(evenement.fin).toISOString(),
    body: descriptionCourte(evenement),
    location: evenement.lieu,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${parametres.toString()}`;
}
