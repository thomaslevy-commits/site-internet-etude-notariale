import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Gestion des cookies — Étude notariale, Paris",
};

export default function Cookies() {
  return <PageLegale titre="Gestion des cookies" />;
}
