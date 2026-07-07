import Link from "next/link";

export interface Maillon {
  href?: string;
  label: string;
}

/** Fil d'Ariane — obligatoire sur toute page de profondeur ≥ 2 (§6). */
export function FilAriane({ maillons }: { maillons: Maillon[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-slate-soft">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href="/"
            className="decoration-gold underline-offset-4 hover:text-night hover:underline"
          >
            Accueil
          </Link>
        </li>
        {maillons.map((maillon) => (
          <li key={maillon.label} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {maillon.href ? (
              <Link
                href={maillon.href}
                className="decoration-gold underline-offset-4 hover:text-night hover:underline"
              >
                {maillon.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-anthracite">
                {maillon.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
