import type { Metadata } from "next";
import { PageLegale, metadonneesPageLegale } from "@/components/page-legale";

export const metadata: Metadata = metadonneesPageLegale("accessibilite");

export default function Page() {
  return <PageLegale slug="accessibilite" />;
}
