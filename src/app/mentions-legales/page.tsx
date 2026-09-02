import type { Metadata } from "next";
import { PageLegale, metadonneesPageLegale } from "@/components/page-legale";

export const metadata: Metadata = metadonneesPageLegale("mentions-legales");

export default function Page() {
  return <PageLegale slug="mentions-legales" />;
}
