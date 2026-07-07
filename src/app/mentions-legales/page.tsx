import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegales() {
  return <PageLegale titre="Mentions légales" />;
}
