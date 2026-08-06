/**
 * Professionnels de l'étude pouvant recevoir un rendez-vous.
 *
 * DONNÉES DE DÉMONSTRATION — À REMPLACER
 * Les entrées ci-dessous sont fictives, à l'exception du notaire titulaire
 * dont le nom provient de src/config/etude.ts. Elles servent à faire
 * fonctionner et démontrer le parcours. La composition réelle de l'équipe,
 * les compétences et les langues doivent être fournies par le notaire, et ces
 * données rejoindront alors la base (table Professionnel du schéma Prisma).
 *
 * Aucune photographie n'est référencée : publier le portrait d'un
 * collaborateur suppose son accord écrit.
 */
import { etude } from "@/config/etude";
import type { CompetenceId, Professionnel } from "./types";

export const PROFESSIONNELS: readonly Professionnel[] = [
  {
    id: "notaire-titulaire",
    nom: etude.nomNotaire,
    fonction: "Notaire",
    competences: ["immobilier", "succession", "patrimoine", "entreprise", "international"],
    langues: ["français", "anglais", "allemand"],
    formats: ["etude", "visioconference", "telephone", "exterieur"],
    complexiteMaximale: "élevée",
  },
  {
    id: "notaire-assistant",
    nom: "[NOM À FOURNIR]",
    fonction: "Notaire assistant",
    competences: ["immobilier", "famille", "succession"],
    langues: ["français", "anglais"],
    formats: ["etude", "visioconference", "telephone"],
    complexiteMaximale: "intermédiaire",
  },
  {
    id: "clerc-immobilier",
    nom: "[NOM À FOURNIR]",
    fonction: "Clerc de notaire — pôle immobilier",
    competences: ["immobilier"],
    langues: ["français"],
    formats: ["etude", "telephone"],
    complexiteMaximale: "simple",
  },
];

/** Ordre de tri des niveaux de complexité, du plus simple au plus élevé. */
const RANG_COMPLEXITE = { simple: 0, intermédiaire: 1, élevée: 2 } as const;

export function professionnelParId(id: string): Professionnel | undefined {
  return PROFESSIONNELS.find((professionnel) => professionnel.id === id);
}

/** Le professionnel couvre-t-il cette compétence ? */
export function couvreCompetence(
  professionnel: Professionnel,
  competence: CompetenceId,
): boolean {
  return professionnel.competences.includes(competence);
}

/** Le professionnel peut-il traiter ce niveau de complexité ? */
export function accepteComplexite(
  professionnel: Professionnel,
  complexite: keyof typeof RANG_COMPLEXITE,
): boolean {
  return RANG_COMPLEXITE[professionnel.complexiteMaximale] >= RANG_COMPLEXITE[complexite];
}
