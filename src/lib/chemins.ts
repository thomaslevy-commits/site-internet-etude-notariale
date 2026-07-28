/**
 * Préfixe des chemins publics : GitHub Pages sert le site sous un
 * sous-chemin (basePath). Vide partout ailleurs.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function cheminPublic(chemin: string): string {
  return `${BASE_PATH}${chemin}`;
}
