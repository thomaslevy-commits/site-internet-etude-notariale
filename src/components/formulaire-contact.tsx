"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Champs {
  nom: string;
  email: string;
  telephone: string;
  objet: string;
  message: string;
  consentement: boolean;
}

const CHAMPS_INITIAUX: Champs = {
  nom: "",
  email: "",
  telephone: "",
  objet: "",
  message: "",
  consentement: false,
};

/** Ordre d'affichage — sert à porter le focus sur le premier champ fautif. */
const ORDRE_CHAMPS: (keyof Champs)[] = [
  "nom",
  "email",
  "objet",
  "message",
  "consentement",
];

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

/**
 * Délai minimal, en millisecondes, entre l'affichage du formulaire et son
 * envoi. Un formulaire rempli en moins de trois secondes est le fait d'un
 * automate, pas d'un visiteur qui rédige un message.
 */
const DELAI_MINIMAL_MS = 3000;

/**
 * Formulaire de contact (§2) : nom, coordonnées, objet, message,
 * consentement RGPD explicite non pré-coché. Envoi en POST vers
 * NEXT_PUBLIC_CONTACT_ENDPOINT ; sans endpoint configuré, message
 * d'indisponibilité renvoyant aux coordonnées directes.
 *
 * Accessibilité (§10) : les erreurs sont annoncées par une région d'alerte,
 * le focus est porté sur le premier champ à corriger, et le message de
 * confirmation reçoit le focus pour ne pas laisser l'utilisateur de lecteur
 * d'écran dans le vide après l'envoi.
 *
 * Anti-automates : un champ leurre invisible aux visiteurs mais renseigné
 * par la plupart des robots, et un délai minimal de rédaction. Ces deux
 * gardes sont côté client et ne dispensent pas d'une vérification par le
 * service qui reçoit les envois. Elles servent à *marquer* une soumission,
 * jamais à la retenir : voir soumettre().
 */
export function FormulaireContact() {
  const [champs, setChamps] = useState<Champs>(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState<Partial<Record<keyof Champs, string>>>({});
  const [etat, setEtat] = useState<"repos" | "envoi" | "succes" | "echec">("repos");
  const [leurre, setLeurre] = useState("");

  const affichageLe = useRef<number>(Date.now());
  const formulaire = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  /** Champ sur lequel porter le focus au prochain rendu, après validation. */
  const focusAPorter = useRef<keyof Champs | null>(null);

  useEffect(() => {
    if (etat === "succes") confirmation.current?.focus();
  }, [etat]);

  useEffect(() => {
    const champ = focusAPorter.current;
    focusAPorter.current = null;
    if (!champ) return;
    formulaire.current
      ?.querySelector<HTMLElement>(`#${champ}`)
      ?.focus();
  });

  function valider(): boolean {
    const nouvelles: typeof erreurs = {};
    if (!champs.nom.trim()) nouvelles.nom = "Veuillez indiquer votre nom.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(champs.email))
      nouvelles.email = "Veuillez indiquer une adresse électronique valide.";
    if (!champs.objet.trim()) nouvelles.objet = "Veuillez indiquer l'objet de votre demande.";
    if (!champs.message.trim()) nouvelles.message = "Veuillez saisir votre message.";
    if (!champs.consentement)
      nouvelles.consentement = "Le consentement est nécessaire pour traiter votre demande.";
    setErreurs(nouvelles);
    const premier = ORDRE_CHAMPS.find((champ) => nouvelles[champ]);
    if (premier) focusAPorter.current = premier;
    return Object.keys(nouvelles).length === 0;
  }

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!valider()) return;
    // Le contrôle de l'endpoint passe en premier : sans lui, le sort d'une
    // soumission dépendait de la vitesse de frappe du visiteur — rapide,
    // elle annonçait un succès ; lente, un échec.
    if (!ENDPOINT) {
      setEtat("echec");
      return;
    }
    // Signaux d'automate : champ leurre renseigné, ou message soumis plus
    // vite qu'il n'est humainement possible de le rédiger. La soumission
    // part malgré tout, marquée « suspecte », à charge pour le service
    // destinataire de l'écarter ou de la mettre en quarantaine.
    //
    // Elle n'est jamais détruite en silence. Le code précédent affichait
    // « votre message a bien été transmis » sans rien envoyer : un
    // gestionnaire de mots de passe renseignant le champ caché suffisait à
    // déclencher ce comportement, et le client d'une étude croyait avoir
    // écrit à son notaire. Un message perdu coûte infiniment plus cher
    // qu'un message indésirable reçu.
    const suspect =
      leurre !== "" || Date.now() - affichageLe.current < DELAI_MINIMAL_MS;
    setEtat("envoi");
    try {
      const reponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...champs, suspect }),
      });
      setEtat(reponse.ok ? "succes" : "echec");
    } catch {
      setEtat("echec");
    }
  }

  if (etat === "succes") {
    return (
      <p
        ref={confirmation}
        role="status"
        tabIndex={-1}
        className="rounded-sm border border-line bg-paper px-6 py-6 text-sm text-anthracite"
      >
        Votre message a bien été transmis. L&apos;étude reviendra vers vous dans
        les meilleurs délais.
      </p>
    );
  }

  const classeChamp =
    "mt-2 w-full rounded-sm border border-line-strong bg-paper px-4 py-3 text-sm text-anthracite focus:border-night";

  const nombreErreurs = Object.keys(erreurs).length;

  return (
    <form ref={formulaire} onSubmit={soumettre} noValidate>
      {/* Récapitulatif annoncé : sans lui, la soumission d'un formulaire
          invalide ne produit aucun retour audible. */}
      <div aria-live="assertive" className="sr-only">
        {nombreErreurs > 0
          ? `${nombreErreurs} champ${nombreErreurs > 1 ? "s" : ""} à corriger avant l'envoi.`
          : ""}
      </div>

      {/* Champ leurre : hors flux visuel, hors ordre de tabulation, hors
          restitution vocale. Un visiteur ne le voit ni ne l'atteint. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="societe-reference">Ne pas remplir</label>
        <input
          id="societe-reference"
          name="societe-reference"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={leurre}
          onChange={(e) => setLeurre(e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="nom" className="text-sm text-night">
            Nom *
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            autoComplete="name"
            required
            className={classeChamp}
            value={champs.nom}
            onChange={(e) => setChamps({ ...champs, nom: e.target.value })}
            aria-describedby={erreurs.nom ? "erreur-nom" : undefined}
            aria-invalid={Boolean(erreurs.nom)}
          />
          {erreurs.nom ? (
            <p id="erreur-nom" className="mt-1 text-sm font-medium text-night">
              {erreurs.nom}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="email" className="text-sm text-night">
            Adresse électronique *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={classeChamp}
            value={champs.email}
            onChange={(e) => setChamps({ ...champs, email: e.target.value })}
            aria-describedby={erreurs.email ? "erreur-email" : undefined}
            aria-invalid={Boolean(erreurs.email)}
          />
          {erreurs.email ? (
            <p id="erreur-email" className="mt-1 text-sm font-medium text-night">
              {erreurs.email}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="telephone" className="text-sm text-night">
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            className={classeChamp}
            value={champs.telephone}
            onChange={(e) => setChamps({ ...champs, telephone: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="objet" className="text-sm text-night">
            Objet *
          </label>
          <input
            id="objet"
            name="objet"
            type="text"
            required
            className={classeChamp}
            value={champs.objet}
            onChange={(e) => setChamps({ ...champs, objet: e.target.value })}
            aria-describedby={erreurs.objet ? "erreur-objet" : undefined}
            aria-invalid={Boolean(erreurs.objet)}
          />
          {erreurs.objet ? (
            <p id="erreur-objet" className="mt-1 text-sm font-medium text-night">
              {erreurs.objet}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-6">
        <label htmlFor="message" className="text-sm text-night">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className={classeChamp}
          value={champs.message}
          onChange={(e) => setChamps({ ...champs, message: e.target.value })}
          aria-describedby={
            erreurs.message ? "erreur-message secret-professionnel" : "secret-professionnel"
          }
          aria-invalid={Boolean(erreurs.message)}
        />
        <p id="secret-professionnel" className="mt-2 text-sm text-slate-soft">
          Ce formulaire permet de prendre contact. Il n&apos;est pas destiné à
          la transmission de pièces : celles-ci sont remises à l&apos;étude par
          les voies convenues lors du premier rendez-vous.
        </p>
        {erreurs.message ? (
          <p id="erreur-message" className="mt-1 text-sm font-medium text-night">
            {erreurs.message}
          </p>
        ) : null}
      </div>
      <div className="mt-6">
        <div className="flex items-start gap-3">
          <input
            id="consentement"
            name="consentement"
            type="checkbox"
            required
            className="mt-1"
            checked={champs.consentement}
            onChange={(e) =>
              setChamps({ ...champs, consentement: e.target.checked })
            }
            aria-describedby={
              erreurs.consentement ? "erreur-consentement" : undefined
            }
            aria-invalid={Boolean(erreurs.consentement)}
          />
          <label htmlFor="consentement" className="text-sm text-slate-soft">
            J&apos;accepte que les informations saisies soient traitées par
            l&apos;étude pour répondre à ma demande, conformément à la{" "}
            <Link
              href="/politique-de-confidentialite"
              className="text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
            >
              politique de confidentialité
            </Link>
            . *
          </label>
        </div>
        {erreurs.consentement ? (
          <p id="erreur-consentement" className="mt-1 text-sm font-medium text-night">
            {erreurs.consentement}
          </p>
        ) : null}
      </div>
      <div className="mt-8">
        <button
          type="submit"
          disabled={etat === "envoi"}
          className="inline-block rounded-sm bg-night px-6 py-3 text-sm text-ivory transition-colors hover:bg-anthracite disabled:opacity-60"
        >
          {etat === "envoi" ? "Envoi en cours…" : "Envoyer"}
        </button>
        {etat === "echec" ? (
          <p role="alert" className="mt-4 text-sm text-anthracite">
            L&apos;envoi n&apos;a pas abouti. Vous pouvez joindre l&apos;étude
            directement par téléphone ou par courriel.
          </p>
        ) : null}
      </div>
    </form>
  );
}
