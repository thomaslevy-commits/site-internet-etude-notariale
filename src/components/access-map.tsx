import { ADRESSE_COMPLETE, REQUETE_CARTE } from "@/config/acces";
import { etude } from "@/config/etude";

/**
 * Plan d'accès, limité à la page Contact depuis la refonte.
 *
 * La carte Google est chargée directement, sans écran de consentement
 * préalable (décision du notaire du 3 septembre 2026, qui a levé la règle
 * antérieure du chargement sur accord). En contrepartie, les pages
 * « Gestion des cookies » et « Politique de confidentialité » déclarent que
 * l'affichage de la page transmet à Google l'adresse IP et l'URL consultée
 * et que Google peut y déposer ses propres cookies. `loading="lazy"` évite
 * de charger l'iframe tant que la section d'accès n'approche pas de l'écran.
 */
/** Libellés par défaut en français ; la page Contact les traduit selon la
 *  langue choisie (contact-traduit.tsx). */
export function AccessMap({
  libelleLien = "Ouvrir l'itinéraire dans Google Maps",
  nouvelleFenetre = "(nouvelle fenêtre)",
  titreCarte = "Carte",
}: { libelleLien?: string; nouvelleFenetre?: string; titreCarte?: string } = {}) {
  return (
    <div>
      <div className="overflow-hidden border border-line">
        <iframe
          title={`${titreCarte} — ${ADRESSE_COMPLETE}`}
          src={`https://www.google.com/maps?q=${REQUETE_CARTE}&z=16&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-[380px] w-full border-0"
        />
      </div>
      <a
        href={etude.liens.googleMaps}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link mt-4"
      >
        {libelleLien} ↗
        <span className="sr-only"> {nouvelleFenetre}</span>
      </a>
    </div>
  );
}
