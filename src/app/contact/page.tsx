import type { Metadata } from "next";
import { FormulaireContact } from "@/components/formulaire-contact";
import { JsonLd, schemaNotary } from "@/components/json-ld";
import { PLACEHOLDER } from "@/lib/content";
import { etude } from "@/config/etude";

export const metadata: Metadata = {
  title: { absolute: "Contact et rendez-vous — Étude Thomas Lévy, Paris 16" },
  description:
    "Prendre rendez-vous avec l'étude notariale Thomas Lévy : 11 boulevard Flandrin, 75116 Paris — 01 40 75 05 55. L'étude reçoit du lundi au vendredi, sur rendez-vous.",
  alternates: { canonical: "/contact" },
};

export default function PageContact() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <JsonLd data={schemaNotary()} />
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Contact
      </h1>
      <div className="mt-14 grid gap-14 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-night">Coordonnées</h2>
          <p className="mt-4 text-sm text-slate-soft">
            {etude.adresse.ligne1}
            <br />
            {etude.adresse.codePostal} {etude.adresse.ville}
          </p>
          <p className="mt-3 text-sm text-slate-soft">{etude.telephone}</p>
          <p className="mt-3 text-sm text-slate-soft">{etude.email}</p>

          <h2 className="mt-10 font-serif text-2xl text-night">Horaires</h2>
          <p className="mt-4 text-sm text-slate-soft">{etude.horaires}</p>

          <h2 className="mt-10 font-serif text-2xl text-night">Accès</h2>
          <p className="mt-4 text-sm text-slate-soft">{PLACEHOLDER}</p>
          {etude.liens.googleMaps ? (
            <p className="mt-4">
              <a
                href={etude.liens.googleMaps}
                rel="noopener noreferrer"
                target="_blank"
                className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
              >
                Voir le plan d&apos;accès (Google Maps)
              </a>
            </p>
          ) : null}
        </div>
        <div>
          <h2 className="font-serif text-2xl text-night">Écrire à l&apos;étude</h2>
          <div className="mt-6">
            <FormulaireContact />
          </div>
        </div>
      </div>
    </main>
  );
}
