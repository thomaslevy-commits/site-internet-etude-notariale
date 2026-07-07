/**
 * Page d'accueil provisoire — sera remplacée par le gabarit complet en phase 2.
 * Rendu 100 % statique.
 */
export default function Accueil() {
  return (
    <main className="mx-auto flex w-full max-w-grid flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-gold">
        Site en construction
      </p>
      <h1 className="mt-6 font-serif text-4xl font-medium tracking-tight text-night sm:text-5xl">
        Étude notariale — Paris
      </h1>
      <p className="mt-6 max-w-xl text-slate-soft">
        [CONTENU À VALIDER — NE PAS PUBLIER] Présentation de l&apos;étude à
        fournir avant toute mise en ligne.
      </p>
      <hr className="mt-12 w-16 border-line" />
    </main>
  );
}
