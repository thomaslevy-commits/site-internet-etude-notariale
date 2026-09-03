import Link from "next/link";
import { AccessMap } from "@/components/access-map";
import { etude } from "@/config/etude";

const liensLegaux = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
  { href: "/cookies", label: "Gestion des cookies" },
  { href: "/accessibilite", label: "Déclaration d'accessibilité" },
] as const;

const navigation = [
  { href: "/etude", label: "L'étude" },
  { href: "/expertises", label: "Nos expertises" },
  { href: "/tarif", label: "Tarif" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-night text-ivory">
      <div className="mx-auto w-full max-w-grid px-6 pt-16 pb-10">
        <AccessMap />

        {/* Grille principale du footer */}
        <div className="mt-2 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Colonne 1 : identité */}
          <div>
            <p className="font-serif text-xl tracking-tight">{etude.nom}</p>
            <p className="mt-4 text-sm leading-relaxed text-ivory/80">
              {etude.adresse.ligne1}
              <br />
              {etude.adresse.codePostal} {etude.adresse.ville}
            </p>
            <div className="mt-5 space-y-2">
              <a
                href={`tel:${etude.telephoneE164}`}
                className="block text-sm font-medium text-ivory no-underline transition-colors hover:text-gold"
              >
                {etude.telephone}
              </a>
              <a
                href={`mailto:${etude.email}`}
                className="block text-sm text-ivory/80 no-underline transition-colors hover:text-ivory"
              >
                {etude.email}
              </a>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ivory/60">
              {etude.horaires}
            </p>
          </div>

          {/* Colonne 2 : navigation */}
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              Navigation
            </p>
            <nav aria-label="Navigation du pied de page" className="mt-4">
              <ul className="flex flex-col gap-3">
                {navigation.map((lien) => (
                  <li key={lien.href}>
                    <Link
                      href={lien.href}
                      className="text-sm text-ivory/80 no-underline transition-colors hover:text-ivory"
                    >
                      {lien.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Colonne 3 : liens légaux */}
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              Informations légales
            </p>
            <nav aria-label="Liens légaux" className="mt-4">
              <ul className="flex flex-col gap-3">
                {liensLegaux.map((lien) => (
                  <li key={lien.href}>
                    <Link
                      href={lien.href}
                      className="text-sm text-ivory/80 no-underline transition-colors hover:text-ivory"
                    >
                      {lien.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Colonne 4 : accès rapide */}
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              Accès rapide
            </p>
            <div className="mt-4 flex flex-col gap-4">
              <Link
                href="/contact"
                className="inline-flex w-fit items-center border border-ivory/40 px-5 py-2.5 text-[0.75rem] uppercase tracking-[0.12em] text-ivory no-underline transition-all duration-300 hover:border-ivory hover:bg-ivory hover:text-night"
              >
                Prendre rendez-vous
              </Link>
              <a
                href={etude.liens.dataRoom}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ivory/80 no-underline transition-colors hover:text-ivory"
              >
                Espace documentaire sécurisé
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
              <a
                href={etude.liens.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ivory/80 no-underline transition-colors hover:text-ivory"
              >
                Itinéraire Google Maps
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Séparateur et mention légale */}
        <div className="mt-12 border-t border-ivory/15 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-ivory/50">
            &copy; {new Date().getFullYear()} {etude.nom}
          </p>
          <p className="text-xs leading-relaxed text-ivory/50">
            Les informations publiées sur ce site ont un caractère général et ne
            constituent pas une consultation juridique.
          </p>
        </div>
      </div>
    </footer>
  );
}
