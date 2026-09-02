import type { Metadata } from "next";
import { PageLegale, metadonneesPageLegale } from "@/components/page-legale";

export const metadata: Metadata = metadonneesPageLegale("politique-de-confidentialite");

export default function Page() {
  return <PageLegale slug="politique-de-confidentialite" />;
}
