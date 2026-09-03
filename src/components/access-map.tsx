"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACCES, ADRESSE_COMPLETE, REQUETE_CARTE } from "@/config/acces";
import { etude } from "@/config/etude";

/**
 * Clé de sessionStorage portant l'accord du visiteur. sessionStorage et non
 * localStorage : l'accord expire à la fermeture de l'onglet, ce qui borne sa
 * durée sans avoir à gérer d'échéance. À déclarer dans la politique de
 * confidentialité au titre des traceurs déposés (§9).
 */
const CLE_CONSENTEMENT = "etude-consentement-carte";

/** Lecture et écriture tolérantes : le stockage peut être refusé (navigation privée, réglages). */
function lireConsentement(): boolean {
  try {
    return window.sessionStorage.getItem(CLE_CONSENTEMENT) === "accorde";
  } catch {
    return false;
  }
}

function ecrireConsentement(accorde: boolean): void {
  try {
    if (accorde) window.sessionStorage.setItem(CLE_CONSENTEMENT, "accorde");
    else window.sessionStorage.removeItem(CLE_CONSENTEMENT);
  } catch {
    // Stockage indisponible : l'accord ne vaudra que pour la page en cours.
  }
}

/**
 * Plan d'accès du pied de page.
 *
 * La carte Google n'est chargée qu'après un accord explicite du visiteur
 * (solution dite « au double clic ») : sans cet accord, aucune requête
 * n'est adressée à Google, donc aucun cookie déposé et aucun référent
 * transmis. Le §8 privilégie par défaut le lien statique — c'est ce que
 * propose l'état initial, l'iframe restant offerte plutôt qu'imposée.
 *
 * L'accord vaut pour la durée de la visite et se retire d'un clic, le
 * RGPD exigeant que le retrait soit aussi simple que le recueil.
 */
export function AccessMap() {
  /**
   * /contact affiche déjà la liste d'accès dans le corps de la page, où elle
   * a sa place : le pied de page l'y répétait à quelques centaines de pixels
   * d'écart, si bien que « Porte Dauphine » figurait six fois sur cette seule
   * page. La carte, elle, reste servie partout — c'est ce qui donne au pied
   * de page son intérêt. Seule la colonne redondante est retirée, et le plan
   * occupe alors toute la largeur.
   */
  const surPageContact = usePathname() === "/contact";
  const [carteAffichee, setCarteAffichee] = useState(false);
  const cadre = useRef<HTMLIFrameElement>(null);
  const boutonAfficher = useRef<HTMLButtonElement>(null);
  /**
   * Où porter le focus au prochain rendu. Reste nul lors de la restauration
   * au montage : déplacer le focus au chargement d'une page désorienterait
   * la navigation, alors qu'après un clic c'est le comportement attendu.
   */
  const focusAPorter = useRef<"carte" | "bouton" | null>(null);

  // Restauration de l'accord après montage : sessionStorage n'existe pas au
  // rendu serveur, le lire pendant le rendu romprait l'hydratation.
  useEffect(() => {
    if (lireConsentement()) setCarteAffichee(true);
  }, []);

  useEffect(() => {
    if (focusAPorter.current === "carte") cadre.current?.focus();
    else if (focusAPorter.current === "bouton") boutonAfficher.current?.focus();
    focusAPorter.current = null;
  });

  function accorder() {
    focusAPorter.current = "carte";
    ecrireConsentement(true);
    setCarteAffichee(true);
  }

  function retirer() {
    focusAPorter.current = "bouton";
    ecrireConsentement(false);
    setCarteAffichee(false);
  }

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ivory">Nous rejoindre</h2>
      <p className="mb-5 text-[0.8rem] uppercase tracking-[0.12em] text-gold">
        Accès à l&rsquo;étude — Paris 16ᵉ
      </p>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className={surPageContact ? "w-full" : "flex-[1.4]"}>
          <div className="min-h-[320px] overflow-hidden rounded-[2px] border border-gold">
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
                  L&rsquo;affichage de la carte établit une connexion avec
                  Google, qui peut déposer des cookies sur votre appareil et
                  reçoit l&rsquo;adresse de la page que vous consultez. Votre
                  accord vaut pour la durée de votre visite et se retire à tout
                  moment.
                </p>
                <button
                  ref={boutonAfficher}
                  type="button"
                  onClick={accorder}
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
          {carteAffichee && (
            <button
              type="button"
              onClick={retirer}
              className="mt-2.5 text-[0.75rem] text-ivory/70 decoration-gold underline underline-offset-4 transition-colors hover:text-ivory"
            >
              Masquer la carte et retirer mon accord
            </button>
          )}
        </div>
        {surPageContact ? null : (
          <div className="flex-1">
            {ACCES.map(({ cle, valeur }) => (
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
        )}
      </div>
    </section>
  );
}
