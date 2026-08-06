import type { Metadata } from "next";
import { Parcours } from "@/rendez-vous/composants/parcours";

/**
 * Page dédiée de prise de rendez-vous.
 *
 * Ce fichier est volontairement le SEUL point de contact entre la plateforme
 * et le site existant : tout le reste vit dans src/rendez-vous. Les deux
 * autres modes d'intégration prévus — sous-domaine et module embarqué —
 * réutilisent le même composant sans rien changer d'autre
 * (voir docs/rendez-vous/01-architecture.md).
 *
 * `noindex` tant que le service n'est pas ouvert : référencer un parcours qui
 * ne confirme encore aucun rendez-vous exposerait le visiteur à une impasse,
 * et l'étude à des demandes qu'elle ne recevrait pas. À retirer le jour de la
 * mise en service.
 */
export const metadata: Metadata = {
  title: "Prendre rendez-vous — Étude notariale Thomas Lévy, Paris 16",
  description:
    "Préparez votre rendez-vous notarial en quelques minutes : objet de la demande, précisions utiles, choix de l'interlocuteur et du créneau.",
  alternates: { canonical: "/rendez-vous" },
  robots: { index: false, follow: false },
};

export default function PageRendezVous() {
  return (
    <main className="bg-ivory">
      <Parcours />
    </main>
  );
}
