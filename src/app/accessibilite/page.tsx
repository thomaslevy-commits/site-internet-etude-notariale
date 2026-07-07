import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Déclaration d'accessibilité",
  alternates: { canonical: "/accessibilite" },
};

export default function Accessibilite() {
  return <PageLegale titre="Déclaration d'accessibilité" />;
}
