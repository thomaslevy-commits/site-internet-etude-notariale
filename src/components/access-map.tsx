"use client";

import { useEffect, useRef, useState } from "react";
import { etude } from "@/config/etude";

/** Adresse complète sur une ligne, dérivée du NAP unique (§7). */
const ADRESSE_COMPLETE = `${etude.adresse.ligne1}, ${etude.adresse.codePostal} ${etude.adresse.ville}`;

/** Données d'accès — transports autour du boulevard Flandrin. */
const ACCES = [
  ["Métro", "Ligne 2 — Porte Dauphine · Ligne 9 — Rue de la Pompe"],
  ["RER", "RER C — Avenue Foch"],
  ["Bus", "Lignes 52 et PC1 — arrêt Flandrin"],
  ["Voiture", "Stationnement Foch · accès périphérique Porte Dauphine"],
  ["Adresse", ADRESSE_COMPLETE],
] as const;

const REQUETE_CARTE = encodeURIComponent(
  `${etude.adresse.ligne1.split(" — ")[0]}, ${etude.adresse.codePostal} ${etude.adresse.ville}, France`,
);

/**
 * Plan d'accès du pied de page.
 *
 * La carte Google n'est chargée qu'après une action explicite du visiteur
 * (solution dite « au double clic ») : tant qu'il n'a pas cliqué, aucune
 * requête n'est adressée à Google, donc aucun cookie déposé et aucun
 * référent transmis. Le §8 de CLAUDE.md privilégie par défaut le lien
 * statique — c'est ce que propose l'état initial, l'iframe restant une
 * possibilité offerte plutôt qu'imposée.
 *
 * Le choix n'est délibérément pas mémorisé : rien n'est écrit dans le
 * navigateur, ce qui évite d'avoir à déclarer un stockage supplémentaire
 * et à ménager un mécanisme de retrait du consentement.
 */
export function AccessMap() {
  const [carteAffichee, setCarteAffichee] = useState(false);
  const cadre = useRef<HTMLIFrameElement>(null);

  // Le bouton disparaît avec le clic : sans cela le focus retomberait sur
  // le corps du document, désorientant la navigation au clavier.
  useEffect(() => {
    if (carteAffichee) cadre.current?.focus();
  }, [carteAffichee]);

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ivory">Nous rejoindre</h2>
      <p className="mb-5 text-[0.8rem] uppercase tracking-[0.12em] text-gold">
        Accès à l&rsquo;étude — Paris 16ᵉ
      </p>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="min-h-[320px] flex-[1.4] overflow-hidden rounded-[2px] border border-gold">
          {carteAffichee ? (
            <iframe
              ref={cadre}
              title={`Carte — ${ADRESSE_COMPLETE}`}
              src={`https://www.google.com/maps?q=${REQUETE_CARTE}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full min-h-[320px] w-full border-0"
            />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-start justify-center gap-5 p-6">
              <p className="max-w-[52ch] text-[0.85rem] leading-relaxed text-ivory/80">
                L&rsquo;affichage de la carte établit une connexion avec Google,
                qui peut déposer des cookies sur votre appareil et reçoit
                l&rsquo;adresse de la page que vous consultez. Elle ne se charge
                donc qu&rsquo;à votre demande.
              </p>
              <button
                type="button"
                onClick={() => setCarteAffichee(true)}
                className="rounded-[2px] border border-ivory px-4 py-2.5 text-[0.8rem] tracking-wide text-ivory transition-colors hover:bg-ivory hover:text-night"
              >
                Afficher la carte
              </button>
              <a
                href={etude.liens.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.8rem] text-ivory/80 decoration-gold underline underline-offset-4 hover:text-ivory"
              >
                Ou ouvrir le plan dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
        <div className="flex-1">
          {ACCES.map(([cle, valeur]) => (
            <div key={cle} className="border-b border-gold/25 py-2.5">
              <span className="block font-serif text-[1.05rem] text-gold">
                {cle}
              </span>
              <span className="mt-0.5 block text-[0.85rem] text-ivory/80">
                {valeur}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
