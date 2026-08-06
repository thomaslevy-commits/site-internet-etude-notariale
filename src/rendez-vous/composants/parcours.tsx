"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { etude } from "@/config/etude";
import { affecterAutomatiquement, classerProfessionnels } from "../affectation";
import { construireIcs, lienGoogleAgenda, lienOutlook } from "../calendrier";
import { genererCreneaux, grouperParJour, heureLocale, jourLocal } from "../creneaux";
import { documentsRequis, EXTENSIONS_ACCEPTEES, TAILLE_MAXIMALE_OCTETS } from "../documents";
import { MOTIFS, motifParId } from "../motifs";
import { professionnelParId } from "../professionnels";
import { evaluer, parcoursDisponible, questionsManquantes, questionsVisibles } from "../qualification/moteur";
import { QUESTIONS_COMMUNES } from "../qualification/regles";
import type {
  Coordonnees,
  Creneau,
  FormatRendezVous,
  Motif,
  Reponses,
  ReponseValeur,
} from "../types";
import { ChampQuestion } from "./champ-question";

/** Étapes du parcours, dans l'ordre. La barre de progression s'en déduit. */
const ETAPES = [
  "Introduction",
  "Votre besoin",
  "Quelques précisions",
  "Vos coordonnées",
  "Vos documents",
  "Votre interlocuteur",
  "Votre créneau",
  "Récapitulatif",
  "Confirmation",
] as const;

/** Minutes restantes estimées à partir de chaque étape. */
const MINUTES_RESTANTES = [5, 5, 4, 3, 2, 1, 1, 1, 0] as const;

const CLE_SAUVEGARDE = "rdv-etude-parcours";

const COORDONNEES_VIDES: Coordonnees = {
  civilite: "non-precisee",
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  codePostal: "",
  ville: "",
  langue: "français",
  moyenContactPrefere: "email",
  consentement: false,
};

const FORMATS: readonly { valeur: FormatRendezVous; libelle: string; detail: string }[] = [
  { valeur: "etude", libelle: "À l'étude", detail: `${etude.adresse.ligne1}, ${etude.adresse.ville}` },
  { valeur: "visioconference", libelle: "En visioconférence", detail: "Un lien vous sera transmis" },
  { valeur: "telephone", libelle: "Par téléphone", detail: "L'étude vous appelle" },
];

interface EtatSauvegarde {
  etape: number;
  motifId: string | null;
  reponses: Reponses;
  coordonnees: Coordonnees;
  format: FormatRendezVous;
  modeAffectation: "automatique" | "manuel";
  professionnelId: string | null;
  creneauDebut: string | null;
}

/**
 * Parcours client de prise de rendez-vous.
 *
 * ÉTAT D'AVANCEMENT — le parcours fonctionne de bout en bout côté navigateur :
 * qualification adaptative, affectation, créneaux, récapitulatif et ajout à
 * l'agenda. En revanche il n'écrit encore dans AUCUN système : ni base, ni
 * CRM, ni envoi d'e-mail, ni dépôt de fichier. Ces branchements supposent des
 * décisions que seul le notaire peut prendre (hébergement, prestataires,
 * AIPD) — voir docs/rendez-vous/04-conformite-et-securite.md. L'étape finale
 * le dit clairement au visiteur plutôt que de simuler une confirmation.
 */
export function Parcours() {
  const [etape, setEtape] = useState(0);
  const [motifId, setMotifId] = useState<string | null>(null);
  const [reponses, setReponses] = useState<Reponses>({});
  const [coordonnees, setCoordonnees] = useState<Coordonnees>(COORDONNEES_VIDES);
  const [format, setFormat] = useState<FormatRendezVous>("etude");
  const [modeAffectation, setModeAffectation] = useState<"automatique" | "manuel">("automatique");
  const [professionnelId, setProfessionnelId] = useState<string | null>(null);
  const [creneauDebut, setCreneauDebut] = useState<string | null>(null);
  const [fichiers, setFichiers] = useState<Record<string, string>>({});
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [confirme, setConfirme] = useState(false);
  const [restaure, setRestaure] = useState(false);

  const motif: Motif | undefined = motifId ? motifParId(motifId) : undefined;

  /* ---------------- Sauvegarde automatique et reprise ---------------- */

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_SAUVEGARDE);
      if (!brut) return;
      const etat = JSON.parse(brut) as EtatSauvegarde;
      setEtape(etat.etape ?? 0);
      setMotifId(etat.motifId ?? null);
      setReponses(etat.reponses ?? {});
      setCoordonnees({ ...COORDONNEES_VIDES, ...(etat.coordonnees ?? {}) });
      setFormat(etat.format ?? "etude");
      setModeAffectation(etat.modeAffectation ?? "automatique");
      setProfessionnelId(etat.professionnelId ?? null);
      setCreneauDebut(etat.creneauDebut ?? null);
      setRestaure(true);
    } catch {
      // Sauvegarde illisible : on repart d'un parcours vierge plutôt que
      // d'interrompre le visiteur.
    }
  }, []);

  useEffect(() => {
    // Les pièces jointes ne sont jamais sauvegardées : elles resteraient dans
    // le navigateur, souvent partagé, sans durée de conservation maîtrisée.
    const etat: EtatSauvegarde = {
      etape,
      motifId,
      reponses,
      coordonnees,
      format,
      modeAffectation,
      professionnelId,
      creneauDebut,
    };
    try {
      window.localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat));
    } catch {
      // Stockage indisponible (navigation privée) : le parcours reste
      // utilisable, seule la reprise ultérieure est perdue.
    }
  }, [etape, motifId, reponses, coordonnees, format, modeAffectation, professionnelId, creneauDebut]);

  const effacerSauvegarde = useCallback(() => {
    try {
      window.localStorage.removeItem(CLE_SAUVEGARDE);
    } catch {
      /* sans conséquence */
    }
  }, []);

  /* ---------------- Dérivés ---------------- */

  const evaluation = useMemo(
    () => (motif ? evaluer(motif, reponses) : undefined),
    [motif, reponses],
  );

  const propositions = useMemo(() => {
    if (!evaluation) return [];
    return classerProfessionnels({
      evaluation,
      format,
      langue: coordonnees.langue,
    });
  }, [evaluation, format, coordonnees.langue]);

  const professionnelRetenu = useMemo(() => {
    if (modeAffectation === "manuel" && professionnelId) {
      return professionnelParId(professionnelId);
    }
    if (!evaluation) return undefined;
    return affecterAutomatiquement({ evaluation, format, langue: coordonnees.langue })
      ?.professionnel;
  }, [modeAffectation, professionnelId, evaluation, format, coordonnees.langue]);

  const creneaux = useMemo(() => {
    if (!professionnelRetenu || !evaluation) return [];
    return genererCreneaux({
      professionnelId: professionnelRetenu.id,
      dureeMinutes: evaluation.dureeMinutes,
      formats: professionnelRetenu.formats,
      horizonJours: 14,
    });
  }, [professionnelRetenu, evaluation]);

  const creneauChoisi: Creneau | undefined = useMemo(
    () => creneaux.find((c) => c.debut === creneauDebut),
    [creneaux, creneauDebut],
  );

  const pieces = useMemo(
    () => (evaluation ? documentsRequis(evaluation.documents) : []),
    [evaluation],
  );

  const reference = useMemo(() => {
    // Référence lisible, stable pour une session donnée.
    const graine = `${motifId ?? ""}${coordonnees.email}${creneauDebut ?? ""}`;
    let somme = 0;
    for (let i = 0; i < graine.length; i++) somme = (somme * 31 + graine.charCodeAt(i)) % 100000;
    return `RDV-${new Date().getFullYear()}-${String(somme).padStart(5, "0")}`;
  }, [motifId, coordonnees.email, creneauDebut]);

  /* ---------------- Navigation ---------------- */

  function suivant() {
    setErreurs({});
    setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
    remonter();
  }

  function precedent() {
    setErreurs({});
    setEtape((e) => Math.max(e - 1, 0));
    remonter();
  }

  function remonter() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validerQualification() {
    if (!motif) return;
    const manquantes = questionsManquantes(motif, reponses, QUESTIONS_COMMUNES);
    if (manquantes.length > 0) {
      setErreurs(
        Object.fromEntries(manquantes.map((q) => [q.id, "Cette réponse est nécessaire."])),
      );
      return;
    }
    suivant();
  }

  function validerCoordonnees() {
    const nouvelles: Record<string, string> = {};
    if (!coordonnees.prenom.trim()) nouvelles.prenom = "Veuillez indiquer votre prénom.";
    if (!coordonnees.nom.trim()) nouvelles.nom = "Veuillez indiquer votre nom.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(coordonnees.email))
      nouvelles.email = "Veuillez indiquer une adresse électronique valide.";
    if (coordonnees.telephone.replace(/[^0-9+]/g, "").length < 9)
      nouvelles.telephone = "Veuillez indiquer un numéro de téléphone joignable.";
    if (!coordonnees.consentement)
      nouvelles.consentement = "Votre accord est nécessaire pour traiter la demande.";
    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length === 0) suivant();
  }

  /* ---------------- Rendu ---------------- */

  const progression = Math.round((etape / (ETAPES.length - 1)) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      {/* Barre de progression, visible pendant tout le parcours (étape 1). */}
      {etape > 0 ? (
        <div className="mb-10">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">
              Étape {etape} sur {ETAPES.length - 1} — {ETAPES[etape]}
            </p>
            <p className="text-xs text-slate-soft">
              {MINUTES_RESTANTES[etape] > 0
                ? `Environ ${MINUTES_RESTANTES[etape]} min restantes`
                : "Terminé"}
            </p>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progression}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression de votre demande"
            className="mt-3 h-1 w-full rounded-full bg-line"
          >
            <div
              className="h-1 rounded-full bg-gold transition-[width] duration-500"
              style={{ width: `${progression}%` }}
            />
          </div>
        </div>
      ) : null}

      {etape === 0 ? (
        <EtapeIntroduction
          restaure={restaure}
          onCommencer={() => {
            setRestaure(false);
            suivant();
          }}
          onRecommencer={() => {
            effacerSauvegarde();
            setEtape(0);
            setMotifId(null);
            setReponses({});
            setCoordonnees(COORDONNEES_VIDES);
            setCreneauDebut(null);
            setRestaure(false);
          }}
        />
      ) : null}

      {etape === 1 ? (
        <section aria-labelledby="titre-motif">
          <TitreEtape id="titre-motif" titre="Quel est l'objet de votre demande ?" />
          <p className="mt-3 text-slate-soft">
            Choisissez la situation la plus proche de la vôtre. Elle détermine les
            questions suivantes et la durée du rendez-vous.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {MOTIFS.map((m) => {
              const actif = motifId === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMotifId(m.id);
                      setReponses({});
                      setCreneauDebut(null);
                    }}
                    aria-pressed={actif}
                    className={[
                      "h-full w-full rounded-sm border px-5 py-4 text-left transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory",
                      actif ? "border-night bg-paper" : "border-line bg-paper hover:border-gold",
                    ].join(" ")}
                  >
                    <span className="block font-serif text-lg text-night">{m.libelle}</span>
                    <span className="mt-1 block text-sm text-slate-soft">{m.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Navigation
            surPrecedent={precedent}
            surSuivant={() => {
              if (!motifId) {
                setErreurs({ motif: "Veuillez choisir un motif." });
                return;
              }
              suivant();
            }}
            erreur={erreurs.motif}
          />
        </section>
      ) : null}

      {etape === 2 && motif ? (
        parcoursDisponible(motif) ? (
          <section aria-labelledby="titre-qualification">
            <TitreEtape id="titre-qualification" titre="Quelques précisions" />
            <p className="mt-3 text-slate-soft">
              Ces réponses servent uniquement à préparer et à orienter votre rendez-vous.
              Elles ne constituent pas une consultation juridique.
            </p>
            <div className="mt-6 divide-y divide-line">
              {questionsVisibles(motif, reponses, QUESTIONS_COMMUNES).map((question) => (
                <ChampQuestion
                  key={question.id}
                  question={question}
                  valeur={reponses[question.id]}
                  erreur={erreurs[question.id]}
                  onChange={(valeur: ReponseValeur) =>
                    setReponses((precedentes) => ({ ...precedentes, [question.id]: valeur }))
                  }
                />
              ))}
            </div>
            <Navigation surPrecedent={precedent} surSuivant={validerQualification} />
          </section>
        ) : (
          <section aria-labelledby="titre-rappel">
            <TitreEtape id="titre-rappel" titre="L'étude vous rappelle" />
            <div className="mt-6 rounded-sm border border-line bg-paper p-6">
              <p className="text-slate-soft">
                Pour ce type de demande, l&apos;étude préfère cerner votre situation de
                vive voix plutôt que par un questionnaire. Laissez vos coordonnées à
                l&apos;étape suivante : un collaborateur vous rappelle et convient avec
                vous du rendez-vous approprié.
              </p>
            </div>
            <Navigation surPrecedent={precedent} surSuivant={suivant} />
          </section>
        )
      ) : null}

      {etape === 3 ? (
        <section aria-labelledby="titre-coordonnees">
          <TitreEtape id="titre-coordonnees" titre="Vos coordonnées" />
          <p className="mt-3 text-slate-soft">
            Elles permettent de vous confirmer le rendez-vous et de vous joindre en cas
            d&apos;imprévu.
          </p>
          <FormulaireCoordonnees
            valeurs={coordonnees}
            erreurs={erreurs}
            onChange={setCoordonnees}
          />
          <Navigation surPrecedent={precedent} surSuivant={validerCoordonnees} />
        </section>
      ) : null}

      {etape === 4 ? (
        <section aria-labelledby="titre-documents">
          <TitreEtape id="titre-documents" titre="Vos documents" />
          <p className="mt-3 text-slate-soft">
            Ces pièces font gagner du temps lors du rendez-vous. Aucune n&apos;est
            indispensable pour réserver : vous pourrez les apporter le jour venu.
          </p>
          <EtapeDocuments
            pieces={pieces}
            fichiers={fichiers}
            onFichier={(id, nom) => setFichiers((f) => ({ ...f, [id]: nom }))}
            onRetirer={(id) =>
              setFichiers((f) => {
                const suivant = { ...f };
                delete suivant[id];
                return suivant;
              })
            }
          />
          <Navigation surPrecedent={precedent} surSuivant={suivant} />
        </section>
      ) : null}

      {etape === 5 && evaluation ? (
        <section aria-labelledby="titre-interlocuteur">
          <TitreEtape id="titre-interlocuteur" titre="Votre interlocuteur" />
          <fieldset className="mt-6">
            <legend className="sr-only">Format du rendez-vous</legend>
            <p className="font-serif text-lg text-night">Comment souhaitez-vous être reçu ?</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => (
                <label
                  key={f.valeur}
                  className={[
                    "cursor-pointer rounded-sm border px-4 py-3 transition-colors",
                    "focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-ivory",
                    format === f.valeur ? "border-night bg-paper" : "border-line bg-paper hover:border-gold",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="format"
                    className="sr-only"
                    checked={format === f.valeur}
                    onChange={() => {
                      setFormat(f.valeur);
                      setCreneauDebut(null);
                    }}
                  />
                  <span className="block text-sm text-anthracite">{f.libelle}</span>
                  <span className="mt-1 block text-xs text-slate-soft">{f.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex flex-wrap gap-3">
            <BoutonBascule
              actif={modeAffectation === "automatique"}
              onClick={() => setModeAffectation("automatique")}
            >
              L&apos;étude choisit pour moi
            </BoutonBascule>
            <BoutonBascule
              actif={modeAffectation === "manuel"}
              onClick={() => setModeAffectation("manuel")}
            >
              Je choisis mon interlocuteur
            </BoutonBascule>
          </div>

          <div className="mt-6 space-y-3">
            {propositions.length === 0 ? (
              <p className="rounded-sm border border-line bg-paper p-5 text-sm text-slate-soft">
                Aucun interlocuteur ne peut recevoir ce rendez-vous dans le format choisi.
                Essayez un autre format, ou contactez l&apos;étude au {etude.telephone}.
              </p>
            ) : modeAffectation === "automatique" ? (
              professionnelRetenu ? (
                <CarteProfessionnel
                  nom={professionnelRetenu.nom}
                  fonction={professionnelRetenu.fonction}
                  langues={professionnelRetenu.langues}
                  selectionne
                />
              ) : null
            ) : (
              propositions.map(({ professionnel }) => (
                <button
                  key={professionnel.id}
                  type="button"
                  onClick={() => {
                    setProfessionnelId(professionnel.id);
                    setCreneauDebut(null);
                  }}
                  aria-pressed={professionnelId === professionnel.id}
                  className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory"
                >
                  <CarteProfessionnel
                    nom={professionnel.nom}
                    fonction={professionnel.fonction}
                    langues={professionnel.langues}
                    selectionne={professionnelId === professionnel.id}
                  />
                </button>
              ))
            )}
          </div>

          <Navigation
            surPrecedent={precedent}
            surSuivant={() => {
              if (!professionnelRetenu) {
                setErreurs({ interlocuteur: "Veuillez choisir un interlocuteur." });
                return;
              }
              suivant();
            }}
            erreur={erreurs.interlocuteur}
          />
        </section>
      ) : null}

      {etape === 6 && evaluation ? (
        <section aria-labelledby="titre-creneau">
          <TitreEtape id="titre-creneau" titre="Votre créneau" />
          <p className="mt-3 text-slate-soft">
            Rendez-vous de {evaluation.dureeMinutes} minutes
            {professionnelRetenu ? ` avec ${professionnelRetenu.nom}` : ""}. Heures de Paris.
          </p>
          <EtapeCreneaux
            creneaux={creneaux}
            choisi={creneauDebut}
            onChoisir={(debut) => setCreneauDebut(debut)}
          />
          <Navigation
            surPrecedent={precedent}
            surSuivant={() => {
              if (!creneauDebut) {
                setErreurs({ creneau: "Veuillez choisir un créneau." });
                return;
              }
              suivant();
            }}
            erreur={erreurs.creneau}
          />
        </section>
      ) : null}

      {etape === 7 && motif && evaluation ? (
        <section aria-labelledby="titre-recapitulatif">
          <TitreEtape id="titre-recapitulatif" titre="Récapitulatif" />
          <dl className="mt-6 divide-y divide-line rounded-sm border border-line bg-paper">
            <Ligne intitule="Motif" valeur={motif.libelle} />
            <Ligne
              intitule="Interlocuteur"
              valeur={professionnelRetenu ? `${professionnelRetenu.nom} — ${professionnelRetenu.fonction}` : "—"}
            />
            <Ligne
              intitule="Date et heure"
              valeur={
                creneauChoisi
                  ? `${jourLocal(creneauChoisi.debut)} à ${heureLocale(creneauChoisi.debut)}`
                  : "—"
              }
            />
            <Ligne
              intitule="Format"
              valeur={FORMATS.find((f) => f.valeur === format)?.libelle ?? "—"}
            />
            <Ligne intitule="Durée estimée" valeur={`${evaluation.dureeMinutes} minutes`} />
            <Ligne
              intitule="Demandeur"
              valeur={`${coordonnees.prenom} ${coordonnees.nom} — ${coordonnees.email}`}
            />
            <Ligne
              intitule="Documents transmis"
              valeur={
                Object.keys(fichiers).length > 0
                  ? Object.values(fichiers).join(", ")
                  : "Aucun pour l'instant"
              }
            />
            <Ligne
              intitule="Documents à préparer"
              valeur={
                pieces.filter((p) => !fichiers[p.id]).map((p) => p.libelle).join(", ") ||
                "Aucun"
              }
            />
          </dl>

          <label className="mt-6 flex items-start gap-3 text-sm text-anthracite">
            <input
              type="checkbox"
              checked={confirme}
              onChange={(e) => setConfirme(e.target.checked)}
              className="mt-1 h-4 w-4 accent-night"
            />
            <span>Je confirme l&apos;exactitude des informations transmises.</span>
          </label>
          {erreurs.confirmation ? (
            <p role="alert" className="mt-2 text-sm text-red-800">
              {erreurs.confirmation}
            </p>
          ) : null}

          <Navigation
            surPrecedent={precedent}
            libelleSuivant="Confirmer le rendez-vous"
            surSuivant={() => {
              if (!confirme) {
                setErreurs({ confirmation: "Veuillez confirmer avant de valider." });
                return;
              }
              suivant();
            }}
          />
        </section>
      ) : null}

      {etape === 8 && creneauChoisi && professionnelRetenu ? (
        <EtapeConfirmation
          reference={reference}
          creneau={creneauChoisi}
          interlocuteur={professionnelRetenu.nom}
          lieu={
            format === "etude"
              ? `${etude.adresse.ligne1}, ${etude.adresse.codePostal} ${etude.adresse.ville}`
              : FORMATS.find((f) => f.valeur === format)?.libelle ?? ""
          }
          piecesRestantes={pieces.filter((p) => !fichiers[p.id]).map((p) => p.libelle)}
          onRecommencer={() => {
            effacerSauvegarde();
            window.location.reload();
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                     */
/* ------------------------------------------------------------------ */

function TitreEtape({ id, titre }: { id: string; titre: string }) {
  return (
    <>
      <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
      <h2 id={id} className="font-serif text-3xl font-medium tracking-tight text-night">
        {titre}
      </h2>
    </>
  );
}

function Navigation({
  surPrecedent,
  surSuivant,
  libelleSuivant = "Continuer",
  erreur,
}: {
  surPrecedent: () => void;
  surSuivant: () => void;
  libelleSuivant?: string;
  erreur?: string;
}) {
  return (
    <div className="mt-10 border-t border-line pt-6">
      {erreur ? (
        <p role="alert" className="mb-4 text-sm text-red-800">
          {erreur}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={surSuivant}
          className="rounded-sm bg-night px-6 py-3 text-sm text-ivory transition-colors hover:bg-anthracite focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          {libelleSuivant}
        </button>
        <button
          type="button"
          onClick={surPrecedent}
          className="rounded-sm border border-night px-6 py-3 text-sm text-night transition-colors hover:bg-paper focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          Revenir
        </button>
        <p className="text-xs text-slate-soft">Vos réponses sont enregistrées automatiquement.</p>
      </div>
    </div>
  );
}

function BoutonBascule({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={[
        "rounded-sm border px-5 py-2.5 text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory",
        actif ? "border-night bg-night text-ivory" : "border-line bg-paper text-anthracite hover:border-gold",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CarteProfessionnel({
  nom,
  fonction,
  langues,
  selectionne,
}: {
  nom: string;
  fonction: string;
  langues: readonly string[];
  selectionne: boolean;
}) {
  return (
    <div
      className={[
        "rounded-sm border bg-paper p-5",
        selectionne ? "border-night" : "border-line",
      ].join(" ")}
    >
      <p className="font-serif text-lg text-night">{nom}</p>
      <p className="mt-0.5 text-sm text-slate-soft">{fonction}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-gold-ink">
        {langues.join(" · ")}
      </p>
    </div>
  );
}

function Ligne({ intitule, valeur }: { intitule: string; valeur: string }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem,1fr]">
      <dt className="text-sm text-slate-soft">{intitule}</dt>
      <dd className="text-sm text-anthracite">{valeur}</dd>
    </div>
  );
}

function EtapeIntroduction({
  restaure,
  onCommencer,
  onRecommencer,
}: {
  restaure: boolean;
  onCommencer: () => void;
  onRecommencer: () => void;
}) {
  return (
    <section aria-labelledby="titre-intro" className="py-8">
      <div aria-hidden="true" className="mb-6 h-px w-16 bg-gold" />
      <h1
        id="titre-intro"
        className="max-w-2xl text-balance font-serif text-4xl font-medium leading-tight tracking-tight text-night sm:text-5xl"
      >
        Prenez rendez-vous avec votre notaire en quelques minutes
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-soft">
        Quelques questions permettent à l&apos;étude de préparer votre dossier et de
        vous orienter vers le bon interlocuteur. Vous choisissez ensuite votre créneau.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-slate-soft">
        <li>Environ cinq minutes.</li>
        <li>Vos réponses sont enregistrées : vous pouvez reprendre plus tard.</li>
        <li>
          Vos informations servent uniquement à préparer le rendez-vous. Elles ne sont
          jamais transmises à un tiers à des fins commerciales.
        </li>
      </ul>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onCommencer}
          className="rounded-sm bg-night px-7 py-3.5 text-sm text-ivory transition-colors hover:bg-anthracite focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          {restaure ? "Reprendre ma demande" : "Commencer ma demande"}
        </button>
        {restaure ? (
          <button
            type="button"
            onClick={onRecommencer}
            className="text-sm text-night underline decoration-gold underline-offset-4 hover:text-anthracite"
          >
            Recommencer depuis le début
          </button>
        ) : null}
      </div>
      <p className="mt-10 text-xs text-slate-soft">
        Les informations publiées sur ce site ont un caractère général et ne constituent
        pas une consultation juridique.{" "}
        <Link href="/politique-de-confidentialite" className="underline decoration-gold underline-offset-4">
          Politique de confidentialité
        </Link>
      </p>
    </section>
  );
}

function FormulaireCoordonnees({
  valeurs,
  erreurs,
  onChange,
}: {
  valeurs: Coordonnees;
  erreurs: Record<string, string>;
  onChange: (valeurs: Coordonnees) => void;
}) {
  const champ =
    "w-full rounded-sm border border-line bg-paper px-4 py-3 text-anthracite focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory";

  function maj<K extends keyof Coordonnees>(cle: K, valeur: Coordonnees[K]) {
    onChange({ ...valeurs, [cle]: valeur });
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="civilite" className="block text-sm text-slate-soft">
          Civilité
        </label>
        <select
          id="civilite"
          value={valeurs.civilite}
          onChange={(e) => maj("civilite", e.target.value as Coordonnees["civilite"])}
          className={`${champ} mt-1`}
        >
          <option value="non-precisee">Non précisée</option>
          <option value="madame">Madame</option>
          <option value="monsieur">Monsieur</option>
        </select>
      </div>

      <ChampTexte id="prenom" label="Prénom" valeur={valeurs.prenom} erreur={erreurs.prenom} onChange={(v) => maj("prenom", v)} />
      <ChampTexte id="nom" label="Nom" valeur={valeurs.nom} erreur={erreurs.nom} onChange={(v) => maj("nom", v)} />
      <ChampTexte id="email" label="Adresse électronique" type="email" valeur={valeurs.email} erreur={erreurs.email} onChange={(v) => maj("email", v)} />
      <ChampTexte id="telephone" label="Téléphone" type="tel" valeur={valeurs.telephone} erreur={erreurs.telephone} onChange={(v) => maj("telephone", v)} />
      <ChampTexte id="adresse" label="Adresse (facultatif)" valeur={valeurs.adresse ?? ""} onChange={(v) => maj("adresse", v)} />
      <ChampTexte id="ville" label="Ville (facultatif)" valeur={valeurs.ville ?? ""} onChange={(v) => maj("ville", v)} />

      <div>
        <label htmlFor="langue" className="block text-sm text-slate-soft">
          Langue de préférence
        </label>
        <select
          id="langue"
          value={valeurs.langue}
          onChange={(e) => maj("langue", e.target.value)}
          className={`${champ} mt-1`}
        >
          {etude.langues.map((langue) => (
            <option key={langue} value={langue}>
              {langue}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="moyen" className="block text-sm text-slate-soft">
          Moyen de contact préféré
        </label>
        <select
          id="moyen"
          value={valeurs.moyenContactPrefere}
          onChange={(e) => maj("moyenContactPrefere", e.target.value as "email" | "telephone")}
          className={`${champ} mt-1`}
        >
          <option value="email">Adresse électronique</option>
          <option value="telephone">Téléphone</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm text-anthracite">
          <input
            type="checkbox"
            checked={valeurs.consentement}
            onChange={(e) => maj("consentement", e.target.checked)}
            className="mt-1 h-4 w-4 accent-night"
          />
          <span>
            J&apos;accepte que ces informations soient utilisées par l&apos;étude pour
            préparer mon rendez-vous, conformément à la{" "}
            <Link href="/politique-de-confidentialite" className="underline decoration-gold underline-offset-4">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {erreurs.consentement ? (
          <p role="alert" className="mt-2 text-sm text-red-800">
            {erreurs.consentement}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ChampTexte({
  id,
  label,
  valeur,
  erreur,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  valeur: string;
  erreur?: string;
  type?: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-slate-soft">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        className={[
          "mt-1 w-full rounded-sm border bg-paper px-4 py-3 text-anthracite",
          "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory",
          erreur ? "border-red-700" : "border-line",
        ].join(" ")}
      />
      {erreur ? (
        <p id={`${id}-erreur`} role="alert" className="mt-1 text-sm text-red-800">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

function EtapeDocuments({
  pieces,
  fichiers,
  onFichier,
  onRetirer,
}: {
  pieces: readonly { id: string; libelle: string; aide?: string; obligatoire: boolean; copieUniquement?: boolean }[];
  fichiers: Record<string, string>;
  onFichier: (id: string, nom: string) => void;
  onRetirer: (id: string) => void;
}) {
  const [erreur, setErreur] = useState<string | null>(null);

  if (pieces.length === 0) {
    return (
      <p className="mt-6 rounded-sm border border-line bg-paper p-5 text-sm text-slate-soft">
        Aucune pièce particulière n&apos;est attendue à ce stade.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-6 space-y-3">
        {pieces.map((piece) => (
          <li key={piece.id} className="rounded-sm border border-line bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-anthracite">
                  {piece.libelle}{" "}
                  <span className="text-xs text-slate-soft">
                    {piece.obligatoire ? "— utile" : "— facultatif"}
                  </span>
                </p>
                {piece.aide ? <p className="mt-1 text-xs text-slate-soft">{piece.aide}</p> : null}
                {piece.copieUniquement ? (
                  <p className="mt-1 text-xs text-gold-ink">Une copie suffit.</p>
                ) : null}
              </div>
              {fichiers[piece.id] ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-anthracite">{fichiers[piece.id]}</span>
                  <button
                    type="button"
                    onClick={() => onRetirer(piece.id)}
                    className="text-xs text-night underline decoration-gold underline-offset-4"
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer rounded-sm border border-night px-4 py-2 text-xs text-night transition-colors hover:bg-ivory focus-within:ring-2 focus-within:ring-gold">
                  Choisir un fichier
                  <input
                    type="file"
                    className="sr-only"
                    accept={EXTENSIONS_ACCEPTEES}
                    onChange={(e) => {
                      const fichier = e.target.files?.[0];
                      if (!fichier) return;
                      if (fichier.size > TAILLE_MAXIMALE_OCTETS) {
                        setErreur(`« ${fichier.name} » dépasse 10 Mo.`);
                        return;
                      }
                      setErreur(null);
                      onFichier(piece.id, fichier.name);
                    }}
                  />
                </label>
              )}
            </div>
          </li>
        ))}
      </ul>
      {erreur ? (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {erreur}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-slate-soft">
        Formats acceptés : PDF, JPG, PNG, DOCX — 10 Mo par fichier.
      </p>
      <p className="mt-2 rounded-sm border border-gold/40 bg-paper p-4 text-xs text-anthracite">
        <strong className="font-medium">Transmission non encore activée.</strong> Le dépôt
        sécurisé des pièces sera ouvert lorsque l&apos;hébergement et les garanties de
        confidentialité auront été arrêtés par l&apos;étude. Vos fichiers ne quittent pas
        votre appareil : seuls leurs noms figurent au récapitulatif, pour mémoire.
      </p>
    </>
  );
}

function EtapeCreneaux({
  creneaux,
  choisi,
  onChoisir,
}: {
  creneaux: readonly Creneau[];
  choisi: string | null;
  onChoisir: (debut: string) => void;
}) {
  const jours = useMemo(() => grouperParJour(creneaux).slice(0, 7), [creneaux]);

  if (jours.length === 0) {
    return (
      <p className="mt-6 rounded-sm border border-line bg-paper p-5 text-sm text-slate-soft">
        Aucun créneau n&apos;est disponible sur la période. Contactez l&apos;étude au{" "}
        {etude.telephone}.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {jours.map(({ jour, creneaux: liste }) => (
        <div key={jour}>
          <h3 className="font-serif text-lg capitalize text-night">
            {jourLocal(liste[0].debut)}
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {liste.map((creneau) => {
              const actif = choisi === creneau.debut;
              return (
                <li key={creneau.debut}>
                  <button
                    type="button"
                    onClick={() => onChoisir(creneau.debut)}
                    aria-pressed={actif}
                    className={[
                      "rounded-sm border px-4 py-2 text-sm transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory",
                      actif
                        ? "border-night bg-night text-ivory"
                        : "border-line bg-paper text-anthracite hover:border-gold",
                    ].join(" ")}
                  >
                    {heureLocale(creneau.debut)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EtapeConfirmation({
  reference,
  creneau,
  interlocuteur,
  lieu,
  piecesRestantes,
  onRecommencer,
}: {
  reference: string;
  creneau: Creneau;
  interlocuteur: string;
  lieu: string;
  piecesRestantes: readonly string[];
  onRecommencer: () => void;
}) {
  const evenement = {
    reference,
    debut: creneau.debut,
    fin: creneau.fin,
    interlocuteur,
    lieu,
  };

  function telechargerIcs() {
    const contenu = construireIcs(evenement);
    const url = URL.createObjectURL(new Blob([contenu], { type: "text/calendar;charset=utf-8" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${reference}.ics`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="titre-confirmation">
      <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
      <h2 id="titre-confirmation" className="font-serif text-3xl font-medium tracking-tight text-night">
        Votre demande est prête
      </h2>

      <div className="mt-6 rounded-sm border border-gold/40 bg-paper p-5 text-sm text-anthracite">
        <strong className="font-medium">Enregistrement définitif non encore activé.</strong>{" "}
        Le rendez-vous n&apos;est pas confirmé tant que l&apos;étude n&apos;a pas ouvert
        le service : la base de données, l&apos;envoi des courriels et le lien avec le
        logiciel de l&apos;étude restent à mettre en place. Pour un rendez-vous ferme
        dès aujourd&apos;hui, appelez le{" "}
        <a href={`tel:${etude.telephoneE164}`} className="underline decoration-gold underline-offset-4">
          {etude.telephone}
        </a>
        .
      </div>

      <dl className="mt-6 divide-y divide-line rounded-sm border border-line bg-paper">
        <Ligne intitule="Référence" valeur={reference} />
        <Ligne intitule="Date et heure" valeur={`${jourLocal(creneau.debut)} à ${heureLocale(creneau.debut)}`} />
        <Ligne intitule="Interlocuteur" valeur={interlocuteur} />
        <Ligne intitule="Lieu" valeur={lieu} />
        <Ligne
          intitule="Documents à préparer"
          valeur={piecesRestantes.length > 0 ? piecesRestantes.join(", ") : "Aucun"}
        />
      </dl>

      <div className="mt-8">
        <p className="font-serif text-lg text-night">Ajouter à votre agenda</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={telechargerIcs}
            className="rounded-sm border border-night px-5 py-2.5 text-sm text-night transition-colors hover:bg-paper"
          >
            Apple Calendar / Outlook (.ics)
          </button>
          <a
            href={lienGoogleAgenda(evenement)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-night px-5 py-2.5 text-sm text-night transition-colors hover:bg-paper"
          >
            Google Agenda
          </a>
          <a
            href={lienOutlook(evenement)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-night px-5 py-2.5 text-sm text-night transition-colors hover:bg-paper"
          >
            Outlook en ligne
          </a>
        </div>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <button
          type="button"
          onClick={onRecommencer}
          className="text-sm text-night underline decoration-gold underline-offset-4 hover:text-anthracite"
        >
          Faire une nouvelle demande
        </button>
      </div>
    </section>
  );
}
