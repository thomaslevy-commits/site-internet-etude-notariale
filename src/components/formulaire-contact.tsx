"use client";

import { useState } from "react";

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

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

/**
 * Formulaire de contact (§2) : nom, coordonnées, objet, message,
 * consentement RGPD explicite non pré-coché. Envoi en POST vers
 * NEXT_PUBLIC_CONTACT_ENDPOINT ; sans endpoint configuré, message
 * d'indisponibilité renvoyant aux coordonnées directes.
 */
export function FormulaireContact() {
  const [champs, setChamps] = useState<Champs>(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState<Partial<Record<keyof Champs, string>>>({});
  const [etat, setEtat] = useState<"repos" | "envoi" | "succes" | "echec">("repos");

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
    return Object.keys(nouvelles).length === 0;
  }

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!valider()) return;
    if (!ENDPOINT) {
      setEtat("echec");
      return;
    }
    setEtat("envoi");
    try {
      const reponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(champs),
      });
      setEtat(reponse.ok ? "succes" : "echec");
    } catch {
      setEtat("echec");
    }
  }

  if (etat === "succes") {
    return (
      <p role="status" className="rounded-sm border border-line bg-paper px-6 py-6 text-sm text-anthracite">
        Votre message a bien été transmis. L&apos;étude reviendra vers vous dans
        les meilleurs délais.
      </p>
    );
  }

  const classeChamp =
    "mt-2 w-full rounded-sm border border-line bg-paper px-4 py-3 text-sm text-anthracite focus:border-night focus:outline-none focus:ring-1 focus:ring-night";

  return (
    <form onSubmit={soumettre} noValidate>
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
            <p id="erreur-nom" className="mt-1 text-sm text-night">
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
            <p id="erreur-email" className="mt-1 text-sm text-night">
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
            <p id="erreur-objet" className="mt-1 text-sm text-night">
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
          aria-describedby={erreurs.message ? "erreur-message" : undefined}
          aria-invalid={Boolean(erreurs.message)}
        />
        {erreurs.message ? (
          <p id="erreur-message" className="mt-1 text-sm text-night">
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
            J&apos;accepte que les informations saisies soient traitées pour
            répondre à ma demande, conformément à la politique de
            confidentialité. *
          </label>
        </div>
        {erreurs.consentement ? (
          <p id="erreur-consentement" className="mt-1 text-sm text-night">
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
