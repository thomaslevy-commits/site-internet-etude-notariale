"use client";

import Link from "next/link";

/**
 * Frontière d'erreur globale. Elle ne montre jamais le détail technique de
 * l'incident au visiteur — un message d'erreur peut révéler des éléments
 * d'infrastructure — et propose de reprendre là où il en était, ou de
 * joindre l'étude directement.
 */
export default function Erreur({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Une erreur est survenue
      </h1>
      <p className="mt-6 max-w-2xl text-slate-soft">
        La page n&apos;a pas pu être affichée. L&apos;incident est
        indépendant de votre navigation.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-block rounded-sm bg-night px-6 py-3 text-sm text-ivory transition-colors hover:bg-anthracite"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
        >
          Revenir à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
