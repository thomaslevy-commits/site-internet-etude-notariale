import type { Metadata } from "next";
import { AccordeonFaq } from "@/components/accordeon-faq";
import { JsonLd, schemaFaq } from "@/components/json-ld";
import { loadFaq, PLACEHOLDER } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: PLACEHOLDER,
  alternates: { canonical: "/faq" },
};

/**
 * FAQ générale (§6) — les FAQ spécialisées vivent sur les pages
 * d'expertise. Contenu depuis content/faq.mdx, validé par Zod.
 */
export default function PageFaq() {
  const faq = loadFaq();
  const toutesLesQuestions = faq.themes.flatMap((theme) => theme.questions);

  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <JsonLd data={schemaFaq(toutesLesQuestions)} />
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Questions fréquentes
      </h1>
      <div className="mt-14 max-w-3xl space-y-14">
        {faq.themes.map((theme, indexTheme) => (
          <section key={theme.titre}>
            <h2 className="font-serif text-2xl text-night">{theme.titre}</h2>
            <div className="mt-6">
              <AccordeonFaq
                entrees={theme.questions.map((entree, indexQuestion) => ({
                  id: `faq-${indexTheme + 1}-${indexQuestion + 1}`,
                  question: entree.question,
                  reponse: entree.reponse,
                }))}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
