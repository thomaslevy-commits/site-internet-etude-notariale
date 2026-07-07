import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Gestion des cookies",
  alternates: { canonical: "/cookies" },
};

export default function Cookies() {
  return <PageLegale titre="Gestion des cookies" />;
}
