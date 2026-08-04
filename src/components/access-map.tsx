import { etude } from "@/config/etude";

/** Données d'accès — transports autour du boulevard Flandrin. */
const ACCES = [
  ["Métro", "Ligne 2 — Porte Dauphine · Ligne 9 — Rue de la Pompe"],
  ["RER", "RER C — Avenue Foch"],
  ["Bus", "Lignes 52 et PC1 — arrêt Flandrin"],
  ["Voiture", "Stationnement Foch · accès périphérique Porte Dauphine"],
  [
    "Adresse",
    `${etude.adresse.ligne1}, ${etude.adresse.codePostal} ${etude.adresse.ville}`,
  ],
] as const;

const REQUETE_CARTE = encodeURIComponent(
  `${etude.adresse.ligne1.split(" — ")[0]}, ${etude.adresse.codePostal} ${etude.adresse.ville}, France`,
);

/**
 * Plan d'accès du pied de page : carte Google Maps embarquée et accès
 * transports. L'iframe suppose la directive CSP frame-src (vercel.json) ;
 * le conditionnement au consentement cookies reste à brancher avant la
 * mise en ligne (CLAUDE.md §8).
 */
export function AccessMap() {
  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ivory">Nous rejoindre</h2>
      <p className="mb-5 text-[0.8rem] uppercase tracking-[0.12em] text-gold">
        Accès à l&rsquo;étude — Paris 16ᵉ
      </p>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="min-h-[320px] flex-[1.4] overflow-hidden rounded-[2px] border border-gold">
          <iframe
            title="Carte — 11 boulevard Flandrin, 75116 Paris"
            src={`https://www.google.com/maps?q=${REQUETE_CARTE}&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="h-full min-h-[320px] w-full border-0"
          />
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
