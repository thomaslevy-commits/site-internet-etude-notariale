import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Étude notariale, Paris",
};

export default function PolitiqueDeConfidentialite() {
  return <PageLegale titre="Politique de confidentialité" />;
}
