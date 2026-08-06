"use client";

import type { Question, ReponseValeur } from "../types";

/**
 * Rendu d'une question du formulaire dynamique.
 *
 * Un seul composant couvre les neuf types de champs : ajouter une question
 * dans regles.ts suffit alors à la voir apparaître, sans toucher à l'interface.
 *
 * Accessibilité (CLAUDE.md §10) : chaque champ porte une étiquette liée, les
 * groupes de choix sont des `fieldset`/`legend`, l'aide contextuelle et le
 * message d'erreur sont rattachés au champ par aria-describedby, et l'erreur
 * est annoncée. Aucun champ ne repose sur la seule couleur.
 */
export function ChampQuestion({
  question,
  valeur,
  erreur,
  onChange,
}: {
  question: Question;
  valeur: ReponseValeur | undefined;
  erreur?: string;
  onChange: (valeur: ReponseValeur) => void;
}) {
  const idAide = `${question.id}-aide`;
  const idErreur = `${question.id}-erreur`;
  const decrit =
    [question.aide ? idAide : null, erreur ? idErreur : null].filter(Boolean).join(" ") ||
    undefined;

  const classeChamp = [
    "w-full rounded-sm border bg-paper px-4 py-3 text-anthracite",
    "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory",
    erreur ? "border-red-700" : "border-line",
  ].join(" ");

  /** Groupes de choix : boutons radio stylés en cartes, cochables au clavier. */
  const estGroupe =
    question.type === "choix-unique" ||
    question.type === "choix-multiple" ||
    question.type === "oui-non";

  const options =
    question.type === "oui-non"
      ? [
          { valeur: "oui", libelle: "Oui" },
          { valeur: "non", libelle: "Non" },
        ]
      : (question.options ?? []);

  const multiple = question.type === "choix-multiple";
  const selection: readonly string[] = Array.isArray(valeur)
    ? (valeur as readonly string[])
    : typeof valeur === "boolean"
      ? [valeur ? "oui" : "non"]
      : typeof valeur === "string" && valeur !== ""
        ? [valeur]
        : [];

  function choisir(option: string) {
    if (multiple) {
      const suivante = selection.includes(option)
        ? selection.filter((v) => v !== option)
        : [...selection, option];
      onChange(suivante);
      return;
    }
    // Les questions « oui / non » stockent un booléen : les règles et le CRM
    // manipulent ainsi une vraie valeur logique, pas la chaîne « oui ».
    onChange(question.type === "oui-non" ? option === "oui" : option);
  }

  return (
    <div className="py-5">
      {estGroupe ? (
        <fieldset>
          <legend className="font-serif text-lg text-night">
            {question.libelle}
            {question.obligatoire ? <span className="sr-only"> (obligatoire)</span> : null}
          </legend>
          {question.aide ? (
            <p id={idAide} className="mt-1 text-sm text-slate-soft">
              {question.aide}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {options.map((option) => {
              const actif = selection.includes(option.valeur);
              return (
                <label
                  key={option.valeur}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 transition-colors",
                    "focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-ivory",
                    actif
                      ? "border-night bg-paper shadow-sm"
                      : "border-line bg-paper hover:border-gold",
                  ].join(" ")}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={question.id}
                    value={option.valeur}
                    checked={actif}
                    onChange={() => choisir(option.valeur)}
                    aria-describedby={decrit}
                    className="mt-1 h-4 w-4 shrink-0 accent-night"
                  />
                  <span>
                    <span className="block text-sm text-anthracite">{option.libelle}</span>
                    {"aide" in option && option.aide ? (
                      <span className="mt-0.5 block text-xs text-slate-soft">{option.aide}</span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <>
          <label htmlFor={question.id} className="block font-serif text-lg text-night">
            {question.libelle}
            {question.obligatoire ? <span className="sr-only"> (obligatoire)</span> : null}
          </label>
          {question.aide ? (
            <p id={idAide} className="mt-1 text-sm text-slate-soft">
              {question.aide}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            {question.type === "texte-long" ? (
              <textarea
                id={question.id}
                rows={4}
                value={typeof valeur === "string" ? valeur : ""}
                onChange={(e) => onChange(e.target.value)}
                aria-describedby={decrit}
                aria-invalid={erreur ? true : undefined}
                className={classeChamp}
              />
            ) : (
              <input
                id={question.id}
                type={
                  question.type === "date"
                    ? "date"
                    : question.type === "nombre" || question.type === "montant"
                      ? "number"
                      : "text"
                }
                inputMode={
                  question.type === "nombre" || question.type === "montant"
                    ? "numeric"
                    : undefined
                }
                min={question.type === "nombre" || question.type === "montant" ? 0 : undefined}
                value={
                  typeof valeur === "string" || typeof valeur === "number" ? String(valeur) : ""
                }
                onChange={(e) => {
                  const brut = e.target.value;
                  if (question.type === "nombre" || question.type === "montant") {
                    onChange(brut === "" ? null : Number(brut));
                    return;
                  }
                  onChange(brut);
                }}
                aria-describedby={decrit}
                aria-invalid={erreur ? true : undefined}
                className={classeChamp}
              />
            )}
            {question.unite ? (
              <span aria-hidden="true" className="text-slate-soft">
                {question.unite}
              </span>
            ) : null}
          </div>
        </>
      )}

      {erreur ? (
        <p id={idErreur} role="alert" className="mt-2 text-sm text-red-800">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
