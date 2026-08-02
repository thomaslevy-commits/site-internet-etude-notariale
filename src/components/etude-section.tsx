import Image from "next/image";
import { cheminPublic } from "@/lib/chemins";

/**
 * Section « L'étude » de l'accueil : photographie pleine hauteur, voile
 * night en dégradé et phrase signature. La photographie attendue est
 * public/images/salle-etude.jpg — à déposer avant fusion (voir PR).
 * Pas de priority : l'image est sous la ligne de flottaison (§4).
 */
export function EtudeSection() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-night">
      <Image
        src={cheminPublic("/images/salle-etude.jpg")}
        alt="Salle de réunion de l'étude notariale Thomas Lévy, Paris 16ᵉ"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(16,28,44,0.82) 0%, rgba(16,28,44,0.60) 16%, rgba(16,28,44,0.28) 34%, rgba(16,28,44,0.05) 52%, rgba(16,28,44,0) 68%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-grid px-6 pb-14">
        <span className="mb-4 block h-0.5 w-[72px] bg-gold" />
        <p
          className="max-w-[34ch] font-serif font-medium text-ivory"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
            lineHeight: 1.25,
            textShadow: "0 2px 20px rgba(16,28,44,0.6)",
          }}
        >
          Depuis 1896, une étude où chaque patrimoine se transmet comme une
          œuvre d&rsquo;exception.
        </p>
      </div>
    </section>
  );
}
