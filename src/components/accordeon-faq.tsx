"use client";

import { useState } from "react";

export interface EntreeFaq {
  id: string;
  question: string;
  reponse: string;
}

/**
 * Accordéon accessible sans dépendance : bouton natif, aria-expanded,
 * aria-controls, ancres partageables par question.
 */
export function AccordeonFaq({ entrees }: { entrees: EntreeFaq[] }) {
  const [ouvertes, setOuvertes] = useState<ReadonlySet<string>>(new Set());

  function basculer(id: string) {
    const suivantes = new Set(ouvertes);
    if (suivantes.has(id)) {
      suivantes.delete(id);
    } else {
      suivantes.add(id);
    }
    setOuvertes(suivantes);
  }

  return (
    <div className="divide-y divide-line border-y border-line">
      {entrees.map((entree) => {
        const ouvert = ouvertes.has(entree.id);
        return (
          <div key={entree.id} id={entree.id}>
            <h3>
              <button
                type="button"
                aria-expanded={ouvert}
                aria-controls={`${entree.id}-reponse`}
                onClick={() => basculer(entree.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left font-medium text-night"
              >
                {entree.question}
                <span aria-hidden="true" className="text-gold">
                  {ouvert ? "−" : "+"}
                </span>
              </button>
            </h3>
            {ouvert ? (
              <p
                id={`${entree.id}-reponse`}
                className="pb-5 text-sm text-slate-soft"
              >
                {entree.reponse}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
