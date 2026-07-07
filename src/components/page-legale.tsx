import { PLACEHOLDER } from "@/lib/content";

/**
 * Gabarit commun des pages légales — les textes définitifs (mentions,
 * RGPD, cookies, accessibilité) sont fournis et validés par le notaire (§9).
 */
export function PageLegale({ titre }: { titre: string }) {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        {titre}
      </h1>
      <div className="mt-10 max-w-3xl space-y-4">
        <p className="text-slate-soft">{PLACEHOLDER}</p>
      </div>
    </main>
  );
}
