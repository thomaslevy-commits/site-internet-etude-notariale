import type { Metadata } from "next";
import { ContactTraduit } from "@/components/contact-traduit";
import { JsonLd, schemaNotary } from "@/components/json-ld";

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
  // Le site n'envoie aucun message lui-même (décision du notaire du
  // 12 novembre 2026 : suppression du formulaire). La page suit la langue
  // choisie au menu des langues (contact-traduit.tsx) ; le français reste la
  // version servie par défaut et indexée.
  return (
    <main className="contact-page">
      <JsonLd data={schemaNotary()} />
      <ContactTraduit sujet={sujet} />
    </main>
  );
}
