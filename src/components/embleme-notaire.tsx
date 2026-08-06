import Image from "next/image";
import type { CSSProperties } from "react";
import { cheminPublic } from "@/lib/chemins";
import styles from "./embleme-notaire.module.css";

/**
 * Emblème doré du panonceau, animé (pack fourni par le notaire, adapté
 * aux conventions du projet) : fil de suspension, apparition douce, puis
 * un cycle de 20 s — reflet métallique de 3 s, suivi immédiatement d'un
 * balancement amorti de 3 s. L'ensemble respecte prefers-reduced-motion
 * (rendu statique). L'image source est détourée ; reflet et halo sont
 * masqués par sa silhouette via la variable CSS --source, de sorte que
 * la lumière ne déborde jamais sur le fond du site.
 */
export function EmblemeNotaire({
  taille = 380,
  label = "Panonceau officiel des notaires — médaillon « République française » et bandeau Notaire",
}: {
  /** Largeur maximale de l'emblème en pixels (bornée à 92 vw en CSS). */
  taille?: number;
  /** Intitulé restitué aux lecteurs d'écran (role img). */
  label?: string;
}) {
  const source = cheminPublic("/images/embleme-notaire.png");
  const variables = {
    "--taille": `${taille}px`,
    "--masque": `url("${cheminPublic("/images/embleme-notaire-masque.png")}")`,
  } as CSSProperties;
  return (
    <div className={styles.root} style={variables} role="img" aria-label={label}>
      <span className={styles.pendule} aria-hidden="true">
        <span className={styles.fil} />
        <span className={styles.medaillon}>
          <Image
            src={source}
            alt=""
            width={520}
            height={661}
            priority
            sizes="(min-width: 1024px) 24rem, 82vw"
            className={styles.image}
          />
          <span className={styles.halo} />
          <span className={styles.reflet} />
        </span>
      </span>
    </div>
  );
}
