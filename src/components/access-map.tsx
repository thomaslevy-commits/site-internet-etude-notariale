"use client";

import { usePathname } from "next/navigation";
import { ACCES, ADRESSE_COMPLETE, REQUETE_CARTE } from "@/config/acces";
import { etude } from "@/config/etude";

/**
 * Plan d'accès du pied de page.
 *
 * La carte Google est chargée directement, sans écran de consentement
 * préalable (décision du notaire du 3 septembre 2026, qui a levé la règle
 * antérieure du chargement sur accord). En contrepartie, les pages
 * « Gestion des cookies » et « Politique de confidentialité » déclarent que
 * l'affichage de la page transmet à Google l'adresse IP et l'URL consultée
 * et que Google peut y déposer ses propres cookies. `loading="lazy"` évite
 * de charger l'iframe tant que le pied de page n'approche pas de l'écran.
 */
export function AccessMap() {
  /**
   * /contact affiche déjà la liste d'accès dans le corps de la page ; le
   * pied de page n'y répète que le plan, en pleine largeur.
   */
  const surPageContact = usePathname() === "/contact";

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ivory">Nous rejoindre</h2>
      <p className="mb-5 text-[0.8rem] uppercase tracking-[0.12em] text-gold">
        Accès à l&rsquo;étude — Paris 16ᵉ
      </p>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className={surPageContact ? "w-full" : "flex-[1.4]"}>
          <div className="min-h-[320px] overflow-hidden rounded-[2px] border border-gold">
            <iframe
              title={`Carte — ${ADRESSE_COMPLETE}`}
              src={`https://www.google.com/maps?q=${REQUETE_CARTE}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full min-h-[320px] w-full border-0"
            />
          </div>
          <a
            href={etude.liens.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-block text-[0.75rem] text-ivory/70 decoration-gold underline underline-offset-4 transition-colors hover:text-ivory"
          >
            Ouvrir l&rsquo;itinéraire dans Google Maps
          </a>
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
