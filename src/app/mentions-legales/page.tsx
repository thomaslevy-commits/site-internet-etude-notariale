import type { Metadata } from "next";
import { PageLegale } from "@/components/page-legale";

export const metadata: Metadata = {
  title: "Mentions légales — Étude notariale, Paris",
};

export default function MentionsLegales() {
  return <PageLegale titre="Mentions légales" />;
}
