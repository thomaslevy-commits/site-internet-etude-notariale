/**
 * Tests du moteur de qualification.
 *
 * Exécution : `npm run test:rdv` (lanceur intégré de Node, sans dépendance
 * supplémentaire — CLAUDE.md §12).
 *
 * Ces tests ne vérifient pas seulement que le moteur « marche » : ils fixent
 * les décisions d'orientation. Si un jour un compromis signé cessait de
 * rendre un dossier urgent, l'étude doit l'apprendre par un test rouge, pas
 * par un rendez-vous manqué.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { motifParId } from "../motifs";
import { evaluer, parcoursDisponible, questionsManquantes, questionsVisibles } from "./moteur";
import { QUESTIONS_COMMUNES } from "./regles";

const achat = motifParId("achat-immobilier")!;
const succession = motifParId("succession")!;
const donation = motifParId("donation")!;
const pacs = motifParId("pacs")!;

/** Date de référence figée : les scores ne doivent pas dériver avec le temps. */
const LE_JOUR_DIT = new Date("2026-08-06T10:00:00Z");

test("les questions conditionnelles restent masquées tant que la condition n'est pas remplie", () => {
  const visibles = questionsVisibles(achat, {}).map((q) => q.id);
  assert.ok(!visibles.includes("avant-contrat"));
  assert.ok(!visibles.includes("prix"));
});

test("répondre « oui » à une question oui-non déclenche bien l'embranchement", () => {
  // Régression : les questions oui-non stockent un booléen. Une condition
  // écrite sur la chaîne « oui » ne se déclenchait jamais, et le parcours
  // sautait silencieusement deux questions.
  const visibles = questionsVisibles(achat, { "bien-identifie": true }).map((q) => q.id);
  assert.ok(visibles.includes("avant-contrat"));
  assert.ok(visibles.includes("prix"));
});

test("une question masquée n'est jamais réclamée comme obligatoire", () => {
  const manquantes = questionsManquantes(achat, { "bien-identifie": false }).map((q) => q.id);
  assert.ok(!manquantes.includes("avant-contrat"));
});

test("les questions obligatoires sans réponse sont signalées", () => {
  const manquantes = questionsManquantes(achat, {}, QUESTIONS_COMMUNES).map((q) => q.id);
  assert.deepEqual(manquantes.sort(), [
    "bien-identifie",
    "delai",
    "financement",
    "notaire-existant",
    "plusieurs-acquereurs",
  ]);
  // La question libre facultative n'est pas réclamée.
  assert.ok(!manquantes.includes("precisions"));
});

test("un compromis signé rend le dossier prioritaire et réclame l'avant-contrat", () => {
  // Un compromis seul vaut 3 points : le seuil « urgent » est à 4, il faut
  // donc un second facteur. Ces poids sont provisoires et devront être
  // calibrés par le notaire (voir docs/rendez-vous/01-architecture.md).
  const evaluation = evaluer(
    achat,
    { "bien-identifie": true, "avant-contrat": "compromis", delai: "1-a-3-mois" },
    LE_JOUR_DIT,
  );
  assert.equal(evaluation.urgence, "prioritaire");
  assert.ok(evaluation.documents.includes("avant-contrat"));
});

test("un compromis signé assorti d'une échéance rapprochée devient urgent", () => {
  const evaluation = evaluer(
    achat,
    { "bien-identifie": true, "avant-contrat": "compromis", delai: "moins-1-mois" },
    LE_JOUR_DIT,
  );
  assert.equal(evaluation.urgence, "urgent");
});

test("un simple projet sans bien identifié reste standard et simple", () => {
  const evaluation = evaluer(
    achat,
    { "bien-identifie": false, financement: "pas-commence", delai: "plus-6-mois" },
    LE_JOUR_DIT,
  );
  assert.equal(evaluation.urgence, "standard");
  assert.equal(evaluation.complexite, "simple");
  assert.equal(evaluation.dureeMinutes, achat.dureeParDefaut);
});

test("un montant élevé oriente vers la compétence patrimoniale et rallonge le rendez-vous", () => {
  const evaluation = evaluer(
    achat,
    { "bien-identifie": true, prix: 1_500_000, "plusieurs-acquereurs": true },
    LE_JOUR_DIT,
  );
  assert.equal(evaluation.competence, "patrimoine");
  assert.equal(evaluation.complexite, "élevée");
  assert.ok(evaluation.dureeMinutes > achat.dureeParDefaut);
});

test("un domicile hors de France bascule la succession en compétence internationale", () => {
  const evaluation = evaluer(
    succession,
    { "date-deces": "2026-07-01", "domicile-hors-france": true, "nombre-heritiers": 2 },
    LE_JOUR_DIT,
  );
  assert.equal(evaluation.competence, "international");
  // 3 points : « intermédiaire ». L'extranéité seule n'atteint pas le seuil
  // « élevée » — point à trancher par le notaire, qui seul peut dire si une
  // succession internationale doit d'emblée mobiliser le profil le plus
  // qualifié quelles que soient les autres caractéristiques du dossier.
  assert.equal(evaluation.complexite, "intermédiaire");
});

test("l'extranéité conjuguée à un testament et à un immeuble atteint la complexité élevée", () => {
  const evaluation = evaluer(
    succession,
    {
      "date-deces": "2026-07-01",
      "domicile-hors-france": true,
      testament: "oui",
      "bien-immobilier": "oui",
      "nombre-heritiers": 2,
    },
    LE_JOUR_DIT,
  );
  assert.equal(evaluation.complexite, "élevée");
});

test("un décès ancien élève l'urgence, un décès récent non", () => {
  const recent = evaluer(succession, { "date-deces": "2026-08-01" }, LE_JOUR_DIT);
  const ancien = evaluer(succession, { "date-deces": "2026-01-05" }, LE_JOUR_DIT);
  assert.equal(recent.urgence, "standard");
  assert.equal(ancien.urgence, "prioritaire");
});

test("l'évaluation est déterministe : même dossier, même résultat", () => {
  const reponses = { "type-bien": "entreprise", valeur: 800_000, "nombre-beneficiaires": 3 };
  const premiere = evaluer(donation, reponses, LE_JOUR_DIT);
  const seconde = evaluer(donation, reponses, LE_JOUR_DIT);
  assert.deepEqual(premiere, seconde);
});

test("les documents ne sont jamais dupliqués", () => {
  const evaluation = evaluer(
    achat,
    { "bien-identifie": true, "avant-contrat": "compromis", financement: "obtenu" },
    LE_JOUR_DIT,
  );
  assert.equal(new Set(evaluation.documents).size, evaluation.documents.length);
});

test("les règles déclenchées sont restituées pour justifier l'orientation", () => {
  const evaluation = evaluer(
    achat,
    { "bien-identifie": true, "avant-contrat": "compromis" },
    LE_JOUR_DIT,
  );
  assert.ok(evaluation.motifsDeclenches.length > 0);
});

test("un motif sans questions validées n'ouvre pas le parcours complet", () => {
  assert.equal(parcoursDisponible(achat), true);
  assert.equal(parcoursDisponible(pacs), false);
});
