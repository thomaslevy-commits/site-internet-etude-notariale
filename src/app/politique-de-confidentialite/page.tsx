import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/politique-de-confidentialite" },
};

export default function PolitiqueDeConfidentialite() {
  return <PageLegale titre="Politique de confidentialité" />;
}
