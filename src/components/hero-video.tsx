"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { cheminPublic } from "@/lib/chemins";

/**
 * Séquences du héros de l'accueil — décision du notaire du 3 septembre 2026,
 * qui a demandé une vidéo « dans le domaine du notariat » produite par
 * génération (Higgsfield, modèle Veo 3.1, deux plans de huit secondes) :
 * un travelling aérien au-dessus des toits haussmanniens de l'ouest
 * parisien, puis un lent travelling dans des salons haussmanniens.
 *
 * Ce sont des images d'illustration. Elles ne montrent ni les locaux réels
 * de l'étude ni aucune personne, et ne portent aucun texte. Le composant le
 * dit à l'écran (« Séquences d'illustration ») : la déontologie du §3
 * interdit tout ce qui induirait le visiteur en erreur, même implicitement,
 * et un salon imaginé pris pour le vrai en serait un cas. Retirer cette
 * mention est une décision du notaire, non un choix de mise en page.
 *
 * Les fichiers sont servis depuis le domaine : aucun tiers, rien à déclarer
 * dans les pages légales.
 */
const SEQUENCES = [
  "/videos/paris-toits.mp4",
  "/videos/salons-haussmanniens.mp4",
] as const;

/** Durée du fondu enchaîné entre deux plans, et marge avant la fin du plan
 *  sortant à laquelle le plan entrant démarre. */
const FONDU_MS = 1400;

type Connexion = Navigator & { connection?: { saveData?: boolean } };

/**
 * Photographie d'abord, vidéo ensuite. La photographie de la salle de
 * réunion — la vraie — est rendue immédiatement en priorité : c'est elle
 * qui compte pour le premier affichage. La vidéo se charge par-dessus et
 * s'y fond dès que son premier plan peut être lu.
 *
 * La vidéo n'est pas chargée du tout dans trois cas, tous décidés au
 * premier rendu côté client :
 *  - prefers-reduced-motion : un travelling permanent est précisément le
 *    mouvement que ce réglage demande d'éviter (exigence d'accessibilité
 *    maintenue par le §5 révisé) ;
 *  - économiseur de données déclaré par le navigateur ;
 *  - écran étroit (< 768 px) : deux fichiers vidéo en plein écran sur un
 *    téléphone coûtent plusieurs mégaoctets pour un bénéfice réduit, la
 *    photographie y suffit. Choix de conception, révisable.
 */
export function HeroVideo() {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const refs = [refA, refB] as const;

  const [lecture, setLecture] = useState(false);
  const [visible, setVisible] = useState(false);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const etroit = window.matchMedia("(max-width: 767px)").matches;
    const economie = (navigator as Connexion).connection?.saveData === true;
    if (!reduit && !etroit && !economie) setLecture(true);
  }, []);

  useEffect(() => {
    if (!lecture) return;
    // Lecture automatique : autorisée par les navigateurs parce que la vidéo
    // est muette et lue dans la page. Si elle est refusée malgré tout, la
    // photographie reste seule à l'écran — aucun bouton, aucun message.
    refA.current?.play().catch(() => setLecture(false));
  }, [lecture]);

  /**
   * À FONDU_MS de la fin du plan courant, le plan suivant démarre et les
   * opacités se croisent : le plan sortant continue de jouer pendant le
   * fondu, on ne voit donc jamais d'image figée ni de noir.
   */
  function surTemps(index: number) {
    return (evenement: SyntheticEvent<HTMLVideoElement>) => {
      const video = evenement.currentTarget;
      if (index !== actif || !Number.isFinite(video.duration)) return;
      if (video.duration - video.currentTime > FONDU_MS / 1000) return;
      const suivant = (index + 1) % SEQUENCES.length;
      const cible = refs[suivant].current;
      if (!cible) return;
      cible.currentTime = 0;
      cible.play().catch(() => {});
      setActif(suivant);
    };
  }

  function surFin(evenement: SyntheticEvent<HTMLVideoElement>) {
    const video = evenement.currentTarget;
    video.pause();
    video.currentTime = 0;
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <Image
        src={cheminPublic("/images/salle-etude.jpg")}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {lecture
        ? SEQUENCES.map((source, index) => (
            <video
              key={source}
              ref={refs[index]}
              src={cheminPublic(source)}
              muted
              playsInline
              preload="auto"
              tabIndex={-1}
              disablePictureInPicture
              onCanPlay={index === 0 ? () => setVisible(true) : undefined}
              onTimeUpdate={surTemps(index)}
              onEnded={surFin}
              className="absolute inset-0 h-full w-full object-cover object-center transition-opacity ease-in-out"
              style={{
                opacity: visible && index === actif ? 1 : 0,
                transitionDuration: `${FONDU_MS}ms`,
              }}
            />
          ))
        : null}
      {lecture && visible ? (
        <p className="absolute bottom-4 right-6 text-[0.65rem] uppercase tracking-[0.18em] text-ivory/60">
          Séquences d&rsquo;illustration
        </p>
      ) : null}
    </div>
  );
}
