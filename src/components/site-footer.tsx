import Link from "next/link";
import { Marque } from "@/components/marque";
import { etude } from "@/config/etude";
import { NAVIGATION } from "@/config/navigation";

const liensLegaux = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-de-confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/accessibilite", label: "Accessibilité" },
];

/** Le plan est désormais sur Contact : le pied de page reste un repère court. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-signature" aria-hidden="true">LÉVY<span>NOTAIRES · PARIS</span></div>
        <div className="grid gap-12 md:grid-cols-[1.3fr,1fr,1fr]">
          <div>
            <Link href="/" aria-label="Thomas Lévy, notaire — accueil">
              <Marque sombre />
            </Link>
            <address className="mt-6 not-italic">
              {etude.adresse.ligne1}
              <br />
              {etude.adresse.codePostal} {etude.adresse.ville}
            </address>
            <a className="mt-5 block" href={`tel:${etude.telephoneE164}`}>
              {etude.telephone}
            </a>
            <a
              className="mt-1 block break-words"
              href={`mailto:${etude.email}`}
            >
              {etude.email}
            </a>
          </div>
          <nav aria-label="Navigation du pied de page">
            <p className="eyebrow">L&apos;étude</p>
            <ul className="footer-links">
              {[
                ...NAVIGATION,
                { href: "/faq", label: "Questions fréquentes" },
                { href: "/contact", label: "Contact & accès" },
              ].map((lien) => (
                <li key={lien.href}>
                  <Link href={lien.href}>{lien.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="eyebrow">Informations pratiques</p>
            <p className="mt-5">{etude.horaires}</p>
            <p className="mt-3">Français · English · Deutsch · <span lang="zh-Hans">中文（配有口译）</span></p>
            <a
              href={etude.liens.dataRoom}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block underline underline-offset-4"
            >
              Espace documentaire sécurisé <span aria-hidden="true">↗</span>
              <span className="sr-only"> (nouvelle fenêtre)</span>
            </a>
            <Link
              href="/contact#plan-acces"
              className="mt-3 block underline underline-offset-4"
            >
              Préparer votre venue
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {liensLegaux.map((lien) => (
                <li key={lien.href}>
                  <Link href={lien.href}>{lien.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-6 max-w-3xl">
            Les informations publiées sur ce site ont un caractère général et ne
            constituent pas une consultation juridique.
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} {etude.nom}
          </p>
        </div>
      </div>
    </footer>
  );
}
