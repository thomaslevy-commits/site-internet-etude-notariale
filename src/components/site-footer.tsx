import Link from "next/link";
import { etude } from "@/config/etude";

const liensLegaux = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
  { href: "/cookies", label: "Gestion des cookies" },
  { href: "/accessibilite", label: "Déclaration d'accessibilité" },
] as const;

/**
 * Pied de page global : fond night, rappel NAP depuis etude.ts,
 * liens légaux et mention obligatoire du §3 de CLAUDE.md.
 */
export function SiteFooter() {
  return (
    <footer className="bg-night text-ivory">
      <div className="mx-auto w-full max-w-grid px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-serif text-lg">{etude.nom}</p>
            <p className="mt-3 text-sm text-ivory/80">
              {etude.adresse.ligne1}
              <br />
              {etude.adresse.codePostal} {etude.adresse.ville}
            </p>
            <p className="mt-3 text-sm text-ivory/80">{etude.telephone}</p>
          </div>
          <nav aria-label="Liens légaux">
            <ul className="flex flex-col gap-2">
              {liensLegaux.map((lien) => (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    className="text-sm text-ivory/80 decoration-gold underline-offset-4 hover:text-ivory hover:underline"
                  >
                    {lien.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <hr className="my-10 border-ivory/20" />
        <p className="text-xs leading-relaxed text-ivory/70">
          Les informations publiées sur ce site ont un caractère général et ne
          constituent pas une consultation juridique.
        </p>
      </div>
    </footer>
  );
}
