import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireContact } from "@/components/formulaire-contact";
import { JsonLd, schemaNotary } from "@/components/json-ld";
import { PageIntro } from "@/components/page-intro";
import { AccessMap } from "@/components/access-map";
import { CtaRendezVous } from "@/components/cta-rdv";
import { ACCES } from "@/config/acces";
import { etude } from "@/config/etude";

export const metadata: Metadata = {
  title: { absolute: "Contact et rendez-vous — Étude Thomas Lévy, Paris 16" },
  description:
    "Prendre rendez-vous avec l'étude notariale Thomas Lévy : 11 boulevard Flandrin, 75116 Paris — 01 40 75 05 55. L'étude reçoit du lundi au vendredi, sur rendez-vous.",
  alternates: { canonical: "/contact" },
};

export default async function PageContact({ searchParams }: { searchParams: Promise<{ sujet?: string | string[] }> }) {
  const params = await searchParams;
  // Le sujet n'est ni un destinataire ni du HTML : seulement une valeur éditable.
  const sujet = typeof params.sujet === "string" ? params.sujet.replace(/[\r\n]/g, " ").slice(0, 160) : "";
  const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT?.trim() || "/api/contact";
  const envoiDisponible = endpoint !== "/api/contact" || Boolean(process.env.RESEND_API_KEY?.trim());
  return (
    <main className="contact-page">
      <JsonLd data={schemaNotary()} />
      <PageIntro
        titre="Entrons en contact"
        rubrique="Étude Thomas Lévy · Paris XVI"
        description="Un rendez-vous, une question ou un dossier à nous confier : contactez l'étude par téléphone, par courriel ou à l'aide du formulaire."
      />
      <div className="site-container page-body grid items-start gap-12 lg:grid-cols-[.85fr,1.15fr] lg:gap-20">
        <div>
          <h2 className="section-title">L&apos;étude vous reçoit</h2>
          <address className="mt-7 text-lg not-italic text-slate-soft">
            {etude.adresse.ligne1}
            <br />
            {etude.adresse.codePostal} {etude.adresse.ville}
          </address>
          <a
            href={`tel:${etude.telephoneE164}`}
            className="mt-7 block w-fit font-serif text-3xl text-night hover:underline"
          >
            {etude.telephone}
          </a>
          <a
            href={`mailto:${etude.email}`}
            className="text-link mt-2 break-all"
          >
            {etude.email}
          </a>
          <div className="mt-7 border-t border-line pt-6">
            <h3 className="eyebrow">Horaires & langues</h3>
            <p className="mt-4 text-slate-soft">{etude.horaires}</p>
            <p className="mt-2 text-slate-soft">Français · English · Deutsch · <span lang="zh-Hans">中文</span> (avec interprète)</p>
            <Link href="/international#languages" className="text-link mt-2">
              Informations internationales ↗
            </Link>
          </div>
          {process.env.NEXT_PUBLIC_BOOKING_URL && (
            <div className="mt-6">
              <CtaRendezVous />
            </div>
          )}
          <div className="mt-7 border-t border-line pt-6">
            <h3 className="eyebrow">Vous avez déjà un dossier ?</h3>
            <a
              href={etude.liens.dataRoom}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link mt-3"
            >
              Espace documentaire sécurisé ↗
              <span className="sr-only"> (nouvelle fenêtre)</span>
            </a>
          </div>
        </div>
        <section id="ecrire" className="contact-form-surface">
          <h2 className="font-serif text-3xl">Écrire à l&apos;étude</h2>
          <p className="mb-7 mt-3 text-sm text-slate-soft">
            Pour demander un rendez-vous, indiquez l&apos;objet de votre projet
            et vos disponibilités.
          </p>
          <FormulaireContact key={sujet} sujetInitial={sujet} endpoint={envoiDisponible ? endpoint : undefined} />
        </section>
      </div>
      <section id="plan-acces" className="border-t border-line bg-white">
        <div className="site-container page-body">
          <p className="eyebrow">Préparer votre venue</p>
          <h2 className="section-title mt-4">Nous rejoindre</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-[.85fr,1.15fr]">
            <dl className="divide-y divide-line border-y border-line">
              {ACCES.map(({ cle, valeur }) => (
                <div key={cle} className="py-4">
                  <dt className="font-medium text-night">{cle}</dt>
                  <dd className="mt-1 text-base text-slate-soft">{valeur}</dd>
                </div>
              ))}
            </dl>
            <AccessMap />
          </div>
        </div>
      </section>
    </main>
  );
}
