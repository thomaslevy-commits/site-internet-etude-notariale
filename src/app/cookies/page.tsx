import type { Metadata } from "next";
import { PageLegale, metadonneesPageLegale } from "@/components/page-legale";

export const metadata: Metadata = metadonneesPageLegale("cookies");

export default function Page() {
  return <PageLegale slug="cookies" />;
}
