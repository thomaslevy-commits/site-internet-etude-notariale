/**
 * Mise en page et utilitaires partagés des e-mails transactionnels du parcours
 * de rendez-vous.
 *
 * Ce fichier ne contient aucun message : il fournit la charpente (en-tête,
 * filet doré, pied de page), l'échappement, le formatage des dates au fuseau
 * de l'étude et la construction des liens porteurs du jeton. Les textes
 * vivent dans modeles.ts, où ils sont identifiables et soumis à la validation
 * du notaire (CLAUDE.md §9).
 *
 * CONTRAINTES DE RENDU (messagerie, pas navigateur)
 * - Tableaux de mise en page, styles exclusivement en ligne, aucune feuille
 *   de style externe, aucun `<style>`, aucun JavaScript.
 * - Aucune image : l'en-tête est purement typographique, donc rien à charger
 *   depuis un serveur distant et rien à débloquer côté client.
 * - Largeur maîtrisée à 600 px, fluide en dessous.
 * - Les polices du site (Cormorant Garamond, Inter) ne sont pas disponibles en
 *   messagerie : on retombe sur des piles système de même nature (serif pour
 *   les titres, sans-serif humaniste pour le texte).
 *
 * COULEURS : uniquement les tokens du §5. L'or (`gold`, `gold-ink`) sert aux
 * filets, aux accents et aux liens ; jamais en aplat de bouton.
 */
import { etude } from "@/config/etude";
import { SITE_URL } from "@/config/site";

/* -------------------------------------------------------------------------- */
/* Couleurs, typographie, gabarit                                             */
/* -------------------------------------------------------------------------- */

/** Tokens du design system (CLAUDE.md §5), en hexadécimal pour les styles en ligne. */
export const COULEURS = {
  ivory: "#FAF7F2",
  paper: "#FFFFFF",
  night: "#101C2C",
  anthracite: "#2B2E33",
  slateSoft: "#5A6472",
  gold: "#A98A4C",
  goldInk: "#77613A",
  line: "#E4DED4",
} as const;

/** Substituts de messagerie des polices du site. */
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Largeur du bloc de contenu, en pixels. */
export const LARGEUR_MAX = 600;

/** Espace insécable — typographie française (« 14 h 30 », « 45 minutes »). */
const INSEC = " ";

/* -------------------------------------------------------------------------- */
/* Échappement et sûreté des liens                                            */
/* -------------------------------------------------------------------------- */

/**
 * Échappe une valeur avant insertion dans du HTML (texte ou attribut).
 * Toute donnée venant du demandeur passe par ici : nom, référence, libellés.
 */
export function echapperHtml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Protocoles admis dans un `href`. `http:` n'est toléré qu'en préproduction locale. */
const PROTOCOLES_AUTORISES = new Set(["https:", "http:", "mailto:", "tel:"]);

/**
 * Valide une URL avant de la placer dans un `href`. Écarte notamment les
 * schémas exécutables (`javascript:`, `data:`) qu'un lien de visioconférence
 * mal contrôlé pourrait introduire.
 */
export function urlSure(url: string): string {
  let analysee: URL;
  try {
    analysee = new URL(url);
  } catch {
    throw new Error(`Lien invalide dans un e-mail de rendez-vous : ${url}`);
  }
  if (!PROTOCOLES_AUTORISES.has(analysee.protocol)) {
    throw new Error(`Protocole de lien non autorisé : ${analysee.protocol}`);
  }
  return analysee.toString();
}

/* -------------------------------------------------------------------------- */
/* Dates et durées, au fuseau de l'étude                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fuseau de référence. Les créneaux sont stockés en ISO 8601 avec décalage ;
 * l'affichage est toujours ramené à l'heure de Paris, celle du rendez-vous —
 * un client à l'étranger doit lire l'heure à laquelle l'étude l'attend.
 */
export const FUSEAU_ETUDE = "Europe/Paris";

function enDate(iso: string): Date {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Date ISO 8601 invalide : ${iso}`);
  }
  return date;
}

const FORMAT_DATE_LONGUE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: FUSEAU_ETUDE,
});

const FORMAT_DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: FUSEAU_ETUDE,
});

const FORMAT_HEURE = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: FUSEAU_ETUDE,
});

/** « mardi 6 août 2026 ». */
export function formaterDateLongue(iso: string): string {
  return FORMAT_DATE_LONGUE.format(enDate(iso));
}

/** « 6 août 2026 » — pour les sujets, plus courts. */
export function formaterDateCourte(iso: string): string {
  return FORMAT_DATE_COURTE.format(enDate(iso));
}

/** « 14 h 30 », et « 14 h » lorsque les minutes sont nulles (usage français). */
export function formaterHeure(iso: string): string {
  const [heures, minutes] = FORMAT_HEURE.format(enDate(iso)).split(":");
  const heureNette = heures.replace(/^0/, "");
  return minutes === "00"
    ? `${heureNette}${INSEC}h`
    : `${heureNette}${INSEC}h${INSEC}${minutes}`;
}

/** « mardi 6 août 2026 à 14 h 30 ». */
export function formaterDateHeure(iso: string): string {
  return `${formaterDateLongue(iso)} à ${formaterHeure(iso)}`;
}

/** « de 14 h 30 à 15 h 15 », ou « à partir de 14 h 30 » sans heure de fin. */
export function formaterPlageHoraire(debut: string, fin?: string): string {
  if (!fin) return `à partir de ${formaterHeure(debut)}`;
  return `de ${formaterHeure(debut)} à ${formaterHeure(fin)}`;
}

/** « 45 minutes », « 1 heure », « 1 heure et 15 minutes ». */
export function formaterDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) return `${minutes}${INSEC}minutes`;
  const libelleHeures = heures === 1 ? `1${INSEC}heure` : `${heures}${INSEC}heures`;
  if (reste === 0) return libelleHeures;
  return `${libelleHeures} et ${reste}${INSEC}minutes`;
}

/* -------------------------------------------------------------------------- */
/* Jeton opaque et liens du parcours                                          */
/* -------------------------------------------------------------------------- */

/**
 * Forme attendue du jeton : chaîne opaque en base64url, produite par la
 * couche de persistance. Elle ne porte aucune donnée personnelle, n'est pas
 * devinable et reste liée à une seule demande. Le format est vérifié ici pour
 * qu'une valeur mal formée échoue à la construction du message plutôt que de
 * partir dans un lien inopérant — ou d'injecter un chemin dans l'URL.
 */
const FORMAT_JETON = /^[A-Za-z0-9_-]{16,128}$/;

export function verifierJeton(jeton: string): string {
  if (!FORMAT_JETON.test(jeton)) {
    throw new Error(
      "Jeton de rendez-vous invalide : 16 à 128 caractères base64url attendus.",
    );
  }
  return jeton;
}

/** Racine du parcours public de gestion d'un rendez-vous. */
const BASE_PARCOURS = "/rendez-vous";

/** Lien de modification du créneau. */
export function lienModification(jeton: string): string {
  return `${SITE_URL}${BASE_PARCOURS}/modifier/${verifierJeton(jeton)}`;
}

/** Lien d'annulation. */
export function lienAnnulation(jeton: string): string {
  return `${SITE_URL}${BASE_PARCOURS}/annuler/${verifierJeton(jeton)}`;
}

/** Lien de dépôt des pièces demandées. */
export function lienDepotPieces(jeton: string): string {
  return `${SITE_URL}${BASE_PARCOURS}/pieces/${verifierJeton(jeton)}`;
}

/** Page publique de renvoi tarifaire (seule mention de coût admise, §3). */
export const LIEN_TARIF = `${SITE_URL}/tarif`;

/* -------------------------------------------------------------------------- */
/* Coordonnées de l'étude — jamais écrites en dur (§7)                        */
/* -------------------------------------------------------------------------- */

/** « 11, boulevard Flandrin — 2ᵉ étage, 75116 Paris ». */
export function adresseCourte(): string {
  const { ligne1, codePostal, ville } = etude.adresse;
  return `${ligne1}, ${codePostal} ${ville}`;
}

/** Adresse sur deux lignes, pour les blocs et le pied de page. */
export function adresseLignes(): readonly string[] {
  const { ligne1, codePostal, ville } = etude.adresse;
  return [ligne1, `${codePostal} ${ville}`];
}

/* -------------------------------------------------------------------------- */
/* Fragments HTML                                                             */
/* -------------------------------------------------------------------------- */

const STYLE_TEXTE = `margin:0 0 14px 0;font-family:${SANS};font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:${COULEURS.anthracite};`;

/** Titre principal du message (serif, sobre). */
export function titre(texte: string): string {
  return `<h1 style="margin:0 0 18px 0;font-family:${SERIF};font-size:24px;line-height:32px;font-weight:400;letter-spacing:-0.01em;color:${COULEURS.night};">${echapperHtml(texte)}</h1>`;
}

/** Intertitre de section. */
export function sousTitre(texte: string): string {
  return `<h2 style="margin:26px 0 12px 0;font-family:${SERIF};font-size:17px;line-height:24px;font-weight:600;color:${COULEURS.night};">${echapperHtml(texte)}</h2>`;
}

/** Paragraphe à partir de texte brut — le contenu est échappé. */
export function paragraphe(texte: string): string {
  return `<p style="${STYLE_TEXTE}">${echapperHtml(texte)}</p>`;
}

/**
 * Paragraphe composé de fragments HTML déjà produits par les helpers de ce
 * fichier (typiquement `lien`). L'appelant est responsable de l'échappement
 * des valeurs qu'il y insère.
 */
export function paragrapheAvecHtml(contenuHtml: string): string {
  return `<p style="${STYLE_TEXTE}">${contenuHtml}</p>`;
}

/** Note secondaire, plus discrète. */
export function note(texte: string): string {
  return `<p style="margin:0 0 14px 0;font-family:${SANS};font-size:13px;line-height:21px;color:${COULEURS.slateSoft};">${echapperHtml(texte)}</p>`;
}

/** Lien en or profond (`gold-ink`), souligné — contraste conforme sur fond clair. */
export function lien(url: string, libelle: string): string {
  return `<a href="${echapperHtml(urlSure(url))}" style="color:${COULEURS.goldInk};text-decoration:underline;">${echapperHtml(libelle)}</a>`;
}

/** Filet doré — l'accent signature de la charte, en 1 px. */
export function filetDore(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr><td style="height:1px;line-height:1px;font-size:0;background-color:${COULEURS.gold};">&nbsp;</td></tr></table>`;
}

/** Séparateur neutre. */
export function filetLeger(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr><td style="height:1px;line-height:1px;font-size:0;background-color:${COULEURS.line};">&nbsp;</td></tr></table>`;
}

/** Liste à puces sobre (puce dorée, texte anthracite). */
export function listePuces(elements: readonly string[]): string {
  const lignes = elements
    .map(
      (element) =>
        `<tr><td valign="top" style="width:16px;padding:0 0 8px 0;font-family:${SANS};font-size:15px;line-height:24px;color:${COULEURS.gold};">&bull;</td><td style="padding:0 0 8px 0;font-family:${SANS};font-size:15px;line-height:24px;color:${COULEURS.anthracite};">${element}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 14px 0;">${lignes}</table>`;
}

/** Une entrée du bloc récapitulatif. */
export interface LigneRecapitulatif {
  intitule: string;
  /** Valeur en texte brut — échappée à l'affichage et reprise en version texte. */
  valeur: string;
  /** Variante HTML facultative (lien cliquable) ; à défaut, `valeur` est échappée. */
  valeurHtml?: string;
}

/**
 * Bloc récapitulatif : fond ivoire, filet doré vertical, entrées empilées
 * (l'empilement tient mieux sur téléphone qu'un tableau à deux colonnes).
 */
export function blocRecapitulatifHtml(lignes: readonly LigneRecapitulatif[]): string {
  const entrees = lignes
    .map((ligne, index) => {
      const dernier = index === lignes.length - 1;
      const valeur = ligne.valeurHtml ?? echapperHtml(ligne.valeur);
      return (
        `<tr><td style="padding:0 0 4px 0;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:${COULEURS.slateSoft};">${echapperHtml(ligne.intitule)}</td></tr>` +
        `<tr><td style="padding:0 0 ${dernier ? "0" : "14px"} 0;font-family:${SANS};font-size:15px;line-height:23px;color:${COULEURS.anthracite};">${valeur}</td></tr>`
      );
    })
    .join("");
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 22px 0;background-color:${COULEURS.ivory};border-left:2px solid ${COULEURS.gold};">` +
    `<tr><td style="padding:20px 22px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${entrees}</table>` +
    `</td></tr></table>`
  );
}

/** Équivalent texte brut du bloc récapitulatif. */
export function blocRecapitulatifTexte(lignes: readonly LigneRecapitulatif[]): string {
  return lignes.map((ligne) => `${ligne.intitule} : ${ligne.valeur}`).join("\n");
}

/** Action proposée en bas de message. */
export interface ActionEmail {
  libelle: string;
  url: string;
  /**
   * `primaire` : fond `night`, texte `ivory`.
   * `secondaire` : filet 1 px `night` sur fond blanc.
   * Aucun bouton doré (§5).
   */
  variante: "primaire" | "secondaire";
}

function boutonHtml(action: ActionEmail): string {
  const url = echapperHtml(urlSure(action.url));
  const libelle = echapperHtml(action.libelle);
  const commun = `display:inline-block;font-family:${SANS};font-size:15px;line-height:20px;font-weight:600;text-decoration:none;border-radius:3px;`;
  if (action.variante === "primaire") {
    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td bgcolor="${COULEURS.night}" style="background-color:${COULEURS.night};border-radius:3px;">` +
      `<a href="${url}" style="${commun}padding:13px 24px;color:${COULEURS.ivory};">${libelle}</a>` +
      `</td></tr></table>`
    );
  }
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td bgcolor="${COULEURS.paper}" style="background-color:${COULEURS.paper};border:1px solid ${COULEURS.night};border-radius:3px;">` +
    `<a href="${url}" style="${commun}padding:12px 23px;color:${COULEURS.night};">${libelle}</a>` +
    `</td></tr></table>`
  );
}

/**
 * Boutons empilés : sans média-queries (interdites ici, tout est en ligne),
 * l'empilement est le seul comportement fiable sur petit écran.
 */
export function boutonsHtml(actions: readonly ActionEmail[]): string {
  if (actions.length === 0) return "";
  const lignes = actions
    .map(
      (action, index) =>
        `<tr><td style="padding:0 0 ${index === actions.length - 1 ? "0" : "10px"} 0;">${boutonHtml(action)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px 0;">${lignes}</table>`;
}

/** Équivalent texte brut des actions. */
export function boutonsTexte(actions: readonly ActionEmail[]): string {
  return actions.map((action) => `${action.libelle} : ${urlSure(action.url)}`).join("\n");
}

/* -------------------------------------------------------------------------- */
/* Pied de page                                                               */
/* -------------------------------------------------------------------------- */

/** Mention adaptée du §3, reprise du pied des pages de fond. */
export const MENTION_INFORMATION_GENERALE =
  "Les informations figurant dans ce message ont un caractère général et ne constituent pas une consultation juridique.";

/** Rappel de destination — le message ne concerne qu'un rendez-vous. */
export const MENTION_CONFIDENTIALITE =
  "Ce message est destiné à la personne qui a demandé ce rendez-vous. S'il vous est parvenu par erreur, merci de le supprimer et d'en informer l'étude.";

/** Mention portée par la copie interne, pour éviter les transferts. */
export const MENTION_INTERNE =
  "Copie interne. Ne pas transférer. Les réponses de qualification et les pièces déposées restent consultables dans le tableau de bord de l'étude.";

function piedClientHtml(): string {
  const styleLigne = `margin:0 0 4px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${COULEURS.slateSoft};`;
  const adresse = adresseLignes()
    .map((ligne) => `<p style="${styleLigne}">${echapperHtml(ligne)}</p>`)
    .join("");
  return (
    `<p style="margin:0 0 6px 0;font-family:${SERIF};font-size:15px;line-height:22px;color:${COULEURS.night};">${echapperHtml(etude.denominationComplete)}</p>` +
    adresse +
    `<p style="${styleLigne}"><a href="tel:${echapperHtml(etude.telephoneE164)}" style="color:${COULEURS.slateSoft};text-decoration:none;">${echapperHtml(etude.telephone)}</a> &nbsp;&middot;&nbsp; <a href="mailto:${echapperHtml(etude.email)}" style="color:${COULEURS.slateSoft};text-decoration:none;">${echapperHtml(etude.email)}</a></p>` +
    `<p style="${styleLigne}">${echapperHtml(etude.horaires)}</p>` +
    `<p style="margin:12px 0 0 0;font-family:${SANS};font-size:12px;line-height:19px;color:${COULEURS.slateSoft};">Émoluments, débours et honoraires : ${lien(LIEN_TARIF, "levy-notaires.fr/tarif")}</p>` +
    `<p style="margin:12px 0 0 0;font-family:${SANS};font-size:12px;line-height:19px;color:${COULEURS.slateSoft};">${echapperHtml(MENTION_INFORMATION_GENERALE)}</p>` +
    `<p style="margin:6px 0 0 0;font-family:${SANS};font-size:12px;line-height:19px;color:${COULEURS.slateSoft};">${echapperHtml(MENTION_CONFIDENTIALITE)}</p>`
  );
}

function piedInterneHtml(): string {
  return `<p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${COULEURS.slateSoft};">${echapperHtml(MENTION_INTERNE)}</p>`;
}

function piedClientTexte(): string {
  return [
    etude.denominationComplete,
    ...adresseLignes(),
    `${etude.telephone} — ${etude.email}`,
    etude.horaires,
    "",
    `Émoluments, débours et honoraires : ${LIEN_TARIF}`,
    "",
    MENTION_INFORMATION_GENERALE,
    MENTION_CONFIDENTIALITE,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Mise en page complète                                                      */
/* -------------------------------------------------------------------------- */

export interface MiseEnPageOptions {
  /** Titre du document, repris dans `<title>`. */
  titreDocument: string;
  /** Texte d'aperçu affiché par la messagerie à côté du sujet. */
  apercu: string;
  /** Corps déjà rendu en HTML (helpers ci-dessus). */
  corpsHtml: string;
  /** Copie interne : en-tête et pied allégés, sans mention destinée au client. */
  interne?: boolean;
}

/**
 * Enveloppe commune : fond ivoire, bloc blanc filet `line`, en-tête
 * typographique, filet doré, corps, pied de page.
 */
export function miseEnPage(options: MiseEnPageOptions): string {
  const surtitre = options.interne
    ? "Plateforme de rendez-vous — copie interne"
    : "Prise de rendez-vous";
  const pied = options.interne ? piedInterneHtml() : piedClientHtml();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${echapperHtml(options.titreDocument)}</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${COULEURS.ivory};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COULEURS.ivory};opacity:0;">${echapperHtml(options.apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COULEURS.ivory};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="${LARGEUR_MAX}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${LARGEUR_MAX}px;background-color:${COULEURS.paper};border:1px solid ${COULEURS.line};">
<tr><td style="padding:32px 32px 0 32px;">
<p style="margin:0 0 4px 0;font-family:${SERIF};font-size:19px;line-height:26px;letter-spacing:-0.01em;color:${COULEURS.night};">${echapperHtml(etude.nom)}</p>
<p style="margin:0;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:0.1em;text-transform:uppercase;color:${COULEURS.slateSoft};">${echapperHtml(surtitre)}</p>
</td></tr>
<tr><td style="padding:18px 32px 0 32px;">${filetDore()}</td></tr>
<tr><td style="padding:26px 32px 6px 32px;">${options.corpsHtml}</td></tr>
<tr><td style="padding:22px 32px 0 32px;">${filetLeger()}</td></tr>
<tr><td style="padding:18px 32px 32px 32px;">${pied}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Version texte brut : sections séparées par une ligne vide, pied de page
 * commun. Toujours produite — un e-mail transactionnel doit rester lisible
 * quand le HTML est bloqué ou lu par une synthèse vocale.
 */
export function miseEnPageTexte(
  sections: readonly string[],
  options: { interne?: boolean } = {},
): string {
  const corps = sections.filter((section) => section.trim().length > 0).join("\n\n");
  const pied = options.interne ? MENTION_INTERNE : piedClientTexte();
  const entete = options.interne
    ? `${etude.nom} — plateforme de rendez-vous, copie interne`
    : etude.nom;
  return `${entete}\n${"-".repeat(60)}\n\n${corps}\n\n${"-".repeat(60)}\n${pied}\n`;
}
