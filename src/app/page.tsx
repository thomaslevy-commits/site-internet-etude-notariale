import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaRendezVous } from "@/components/cta-rdv";
import { HeroVideo } from "@/components/hero-video";
import { JsonLd, schemaNotary } from "@/components/json-ld";
import { LienCapitale } from "@/components/lien-capitale";
import { etude } from "@/config/etude";
import { cheminPublic } from "@/lib/chemins";
import {
  CATEGORIE_LABELS,
  EXPERTISE_SLUGS,
  loadAllArticles,
  loadExpertise,
  type Categorie,
  type ExpertiseSlug,
} from "@/lib/content";

export const metadata: Metadata = {
  description:
    "Étude notariale à Paris 16ᵉ. Immobilier, successions, structuration patrimoniale, entreprise et clientèle internationale. Consultations sur rendez-vous.",
  alternates: { canonical: "/" },
};

/**
 * Refonte du 3 septembre 2026 — décision du notaire, après la levée des
 * gabarits imposés. Deux références ont été données, et sont transposées
 * ici sans rien en copier :
 *  - l'écriture d'un site de banque privée pour la composition : héros
 *    plein écran à texte centré, repères chiffrés en grande serif, renvois
 *    en petites capitales espacées (LienCapitale), sections aérées ;
 *  - la structure d'un site d'étude notariale de place pour deux blocs qui
 *    manquaient au nôtre : les pôles d'expertise présentés comme de grandes
 *    entrées éditoriales avant la grille, et un bloc « démarches à
 *    distance » qui rassemble les services accessibles sans rendez-vous.
 * Le fond éditorial — les phrases, les engagements, la méthode — est
 * inchangé : validé, il ne se réécrit pas au gré d'une refonte visuelle.
 */

/**
 * Pôles d'expertise : les quatre familles de /expertises et du blog, avec
 * trois portes d'entrée chacune. Une ligne descriptive dit ce que l'étude
 * fait, jamais ce qu'elle vaut (§3).
 */
const POLES: readonly {
  categorie: Categorie;
  texte: string;
  slugs: readonly [ExpertiseSlug, ExpertiseSlug, ExpertiseSlug];
}[] = [
  {
    categorie: "immobilier",
    texte:
      "Acquisitions et ventes, VEFA, promotion, marchands de biens, fiscalité immobilière : du logement à l'opération d'ensemble.",
    slugs: ["immobilier-residentiel", "vefa", "promotion-immobiliere"],
  },
  {
    categorie: "patrimoine-famille",
    texte:
      "Successions, donations, partages, séparations et structuration patrimoniale, pensés dans la durée d'une famille.",
    slugs: ["successions", "donations", "structuration-patrimoniale"],
  },
  {
    categorie: "entreprise",
    texte:
      "Transmission d'entreprise, baux commerciaux, sociétés civiles : l'immobilier et le patrimoine du dirigeant, en coordination avec ses conseils.",
    slugs: ["transmission-entreprise", "baux-commerciaux", "sci"],
  },
  {
    categorie: "international",
    texte: `Successions transfrontalières, non-résidents, expatriés, investisseurs étrangers et family offices — en ${etude.langues.join(", ")}.`,
    slugs: ["successions-internationales", "investisseurs-etrangers", "family-office"],
  },
];

/**
 * Sélection de 8 expertises pour la grille. Tuple figé : il sert de clé au
 * type de ACCROCHES_ACCUEIL, ce qui rend une accroche manquante détectable
 * à la compilation plutôt qu'à l'affichage.
 */
const EXPERTISES_ACCUEIL = [
  "immobilier-residentiel",
  "vefa",
  "promotion-immobiliere",
  "sci",
  "successions-internationales",
  "structuration-patrimoniale",
  "transmission-entreprise",
  "family-office",
] as const satisfies readonly ExpertiseSlug[];

/**
 * Accroche par expertise : une phrase descriptive de quinze mots au plus.
 * Elle dit ce que l'étude fait, jamais ce qu'elle vaut — la compétence se
 * montre par la précision technique (§3).
 */
const ACCROCHES_ACCUEIL: Record<(typeof EXPERTISES_ACCUEIL)[number], string> = {
  "immobilier-residentiel":
    "Chaque acquisition vérifiée sous tous ses angles avant la signature.",
  vefa: "Du contrat de réservation à la livraison, un acte sécurisé à chaque étape.",
  "promotion-immobiliere":
    "Montage, commercialisation et livraison coordonnés avec le promoteur.",
  sci: "La structure, la fiscalité et la transmission anticipées dès la constitution.",
  "successions-internationales":
    "Plusieurs juridictions, un seul interlocuteur pour coordonner l'ensemble.",
  "structuration-patrimoniale":
    "L'architecture civile et fiscale conçue pour durer au-delà d'une opération.",
  "transmission-entreprise":
    "Cession, donation, pacte Dutreil : chaque levier articulé dans un calendrier.",
  "family-office":
    "Un notaire intégré à l'équipe de conseil patrimonial du client.",
};

const METHODE = [
  {
    titre: "Comprendre",
    texte:
      "Chaque dossier commence par vos objectifs. Avant toute règle de droit, l'étude identifie les intérêts en présence, les contraintes et les marges de manœuvre.",
  },
  {
    titre: "Structurer",
    texte:
      "L'opération est ensuite construite : choix des techniques juridiques, articulation civile et fiscale, calendrier. La meilleure architecture est souvent la plus simple.",
  },
  {
    titre: "Sécuriser",
    texte:
      "Les actes traduisent cette analyse. Chaque clause a une raison d'être ; les formalités et la publicité foncière sont conduites jusqu'à leur complet accomplissement.",
  },
] as const;

/**
 * Engagements : formulations descriptives — ce que l'étude fait — et non
 * performatives. « Les coûts sont détaillés », jamais « nous garantissons » (§3).
 */
const ENGAGEMENTS: readonly {
  titre: string;
  texte: string;
  lien?: { href: string; label: string };
}[] = [
  {
    titre: "Transparence",
    texte:
      "Les coûts d'une opération — émoluments, taxes, débours, honoraires — sont détaillés avant tout engagement. Aucune surprise à la signature.",
    lien: { href: "/tarif", label: "Comprendre le tarif notarial" },
  },
  {
    titre: "Réactivité",
    texte:
      "Un interlocuteur identifié, un calendrier établi dès l'ouverture du dossier, des points d'étape sans avoir à les demander.",
  },
  {
    titre: "Rigueur",
    texte:
      "Chaque dossier fait l'objet d'une revue civile, fiscale et foncière systématique avant toute signature.",
  },
  {
    titre: "Confidentialité",
    texte:
      "Le secret professionnel est absolu. Aucune information relative à un dossier ne circule sans l'accord exprès du client.",
  },
];

/**
 * Paiement en ligne — interrupteur du §12. Tant qu'aucun prestataire n'est
 * retenu et qu'aucun circuit d'encaissement n'est validé par le comptable
 * taxateur (arbitrage n° 3 du §13), la variable reste vide et l'entrée
 * n'existe pas. Le périmètre est fixé par le §13 : sommes dues à l'étude
 * au titre de sa rémunération et de ses remboursements, rien d'autre.
 */
const PAIEMENT_URL = process.env.NEXT_PUBLIC_PAIEMENT_URL;

/**
 * Démarches accessibles sans rendez-vous. Structure reprise d'un site
 * d'étude de place (« gérez vos démarches à distance ») ; les textes
 * décrivent un service, jamais une promesse. La copie d'acte passe par le
 * formulaire de contact : aucun envoi de pièce ne transite par le site.
 */
const DEMARCHES: readonly {
  titre: string;
  texte: string;
  action: string;
  href: string;
  externe?: boolean;
}[] = [
  {
    titre: "Espace documentaire sécurisé",
    texte:
      "Le dépôt et l'échange de pièces avec l'étude passent par l'espace sécurisé d'un prestataire externe, jamais par ce site.",
    action: "Accéder à l'espace documentaire",
    href: etude.liens.dataRoom,
    externe: true,
  },
  {
    titre: "Tarif",
    texte:
      "Émoluments réglementés, débours, droits et taxes, honoraires libres : de quoi se compose le coût d'une opération.",
    action: "Consulter le tarif",
    href: "/tarif",
  },
  {
    titre: "Copie d'acte",
    texte:
      "La demande de copie d'un acte reçu par l'étude se fait par le formulaire de contact, en indiquant l'acte concerné.",
    action: "Faire une demande",
    href: "/contact",
  },
  ...(PAIEMENT_URL
    ? [
        {
          titre: "Paiement en ligne",
          texte:
            "Règlement des sommes dues à l'étude au titre de ses émoluments, honoraires et débours.",
          action: "Procéder au paiement",
          href: PAIEMENT_URL,
          externe: true,
        },
      ]
    : []),
];

/** Adresse sans la mention d'étage, pour la légende du portrait (§7). */
const ADRESSE_COURTE = etude.adresse.ligne1.split(" — ")[0];

/**
 * Repères — la preuve arrive tôt, juste après le héros. Transposition d'une
 * mécanique observée sur les sites de banque d'affaires et d'étude : le
 * visiteur obtient une réponse à « pourquoi est-ce crédible » avant
 * d'entrer dans le catalogue des expertises.
 *
 * Aucun chiffre n'est produit pour l'occasion. Les quatre reprennent des
 * faits déjà publiés ou dérivés du code :
 *   — l'année de nomination figure sur /etude (« arrêté du 27 décembre 2005 ») ;
 *   — le nombre de domaines est dérivé de EXPERTISE_SLUGS, il ne peut donc
 *     pas diverger de l'arborescence réelle ;
 *   — les langues viennent de etude.ts, source unique du NAP ;
 *   — l'implantation vient de la même source.
 * Formulations descriptives, sans comparaison ni superlatif (§3).
 */
const REPERES: readonly { valeur: string; libelle: string }[] = [
  { valeur: "2005", libelle: "Notaire depuis" },
  {
    valeur: String(EXPERTISE_SLUGS.length),
    libelle: "Domaines d'intervention",
  },
  {
    valeur: String(etude.langues.length),
    libelle: "Langues de travail",
  },
  { valeur: "Paris 16ᵉ", libelle: "Implantation" },
];

/** Filet doré et intitulé de section, en petites capitales espacées. */
function Intitule({
  children,
  surFondSombre = false,
}: {
  children: string;
  surFondSombre?: boolean;
}) {
  return (
    <p
      className={`text-[0.72rem] uppercase tracking-[0.28em] ${
        surFondSombre ? "text-gold" : "text-gold-ink"
      }`}
    >
      {children}
    </p>
  );
}

export default function Accueil() {
  const poles = POLES.map((pole) => ({
    ...pole,
    expertises: pole.slugs.map((slug) => ({
      slug,
      titre: loadExpertise(slug).frontmatter.title,
    })),
  }));
  const expertises = EXPERTISES_ACCUEIL.map((slug) => ({
    slug,
    frontmatter: loadExpertise(slug).frontmatter,
  }));
  const derniersArticles = loadAllArticles().slice(0, 3);

  return (
    <main>
      <JsonLd data={schemaNotary()} />

      {/* Héros plein écran, texte centré. La photographie de la salle de
          réunion est rendue d'abord ; les deux séquences vidéo s'y fondent
          ensuite (voir hero-video.tsx pour ce qu'elles sont et quand elles
          ne sont pas chargées). Le voile night est plus dense qu'avant :
          le texte est centré sur l'image et non plus calé dans un angle
          sombre, il doit rester lisible sur n'importe quel plan. */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-night">
        <HeroVideo />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(16,28,44,0.55) 0%, rgba(16,28,44,0.42) 45%, rgba(16,28,44,0.78) 100%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-grid flex-col items-center px-6 pb-24 pt-32 text-center">
          {/* Ivoire et non or : centré sur l'image, le surtitre passe sur le
              ciel clair du plan aérien, où l'or ne tient pas le contraste. */}
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-ivory/90">
            Étude notariale — Paris 16ᵉ
          </p>
          <div aria-hidden="true" className="mt-7 h-px w-12 bg-gold" />
          <h1
            className="mt-9 max-w-4xl text-balance font-serif font-normal leading-[1.08] tracking-tight text-ivory"
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.6rem)" }}
          >
            Le conseil notarial pour les opérations immobilières et
            patrimoniales complexes
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/85">
            À Paris et à l&apos;international, l&apos;étude accompagne
            particuliers, investisseurs, entreprises et family offices.
          </p>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <CtaRendezVous surFondSombre />
            <Link
              href="/expertises"
              className="inline-block rounded-sm border border-ivory/80 px-6 py-3 text-sm text-ivory transition-colors hover:bg-ivory hover:text-night"
            >
              Nos expertises
            </Link>
          </div>
        </div>
      </section>

      {/* Repères — bande sombre, valeurs en grande serif, libellés en
          capitales dorées : les chiffres se lisent de loin, comme sur les
          sites de gestion privée dont la composition s'inspire. */}
      <section className="bg-night text-ivory">
        <div className="mx-auto w-full max-w-grid px-6 py-16 lg:py-20">
          <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {REPERES.map((repere) => (
              <div
                key={repere.libelle}
                className="border-l border-gold/40 pl-6"
              >
                <dd className="font-serif text-5xl font-normal leading-none tracking-tight text-ivory lg:text-6xl">
                  {repere.valeur}
                </dd>
                <dt className="mt-4 text-[0.72rem] uppercase tracking-[0.24em] text-gold">
                  {repere.libelle}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Le notaire : visage, nom et vision du métier à la première
          personne — un officier public identifié plutôt qu'anonyme. */}
      <section className="bg-ivory">
        <div className="mx-auto grid w-full max-w-grid gap-14 px-6 py-24 lg:grid-cols-[3fr,2fr] lg:py-32">
          <div className="flex flex-col justify-center">
            <Intitule>Nous connaître</Intitule>
            <h2
              className="mt-6 font-serif font-normal leading-[1.12] tracking-tight text-night"
              style={{ fontSize: "clamp(2rem, 3.4vw, 3rem)" }}
            >
              {etude.denominationComplete}
            </h2>
            <div className="mt-8 max-w-prose space-y-5 text-[1.05rem] leading-relaxed text-anthracite">
              <p>
                Chaque opération immobilière ou patrimoniale est unique. Le
                rôle du notaire est d&apos;en comprendre les enjeux, d&apos;en
                anticiper les risques et de construire une architecture
                juridique sur mesure qui protège chaque partie.
              </p>
              <p>
                L&apos;étude accompagne particuliers, investisseurs, entreprises
                et family offices dans leurs projets les plus structurants :
                acquisitions complexes, montages en SCI, transmissions
                d&apos;entreprise, successions internationales et
                restructurations patrimoniales.
              </p>
              <p>
                Un premier rendez-vous permet de poser le cadre de votre
                opération, d&apos;identifier les points d&apos;attention et de
                définir ensemble la stratégie notariale adaptée à votre
                situation.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[0.7rem] uppercase tracking-[0.14em] text-gold-ink/70">
              <span>Notaire Paris 16</span>
              <span aria-hidden="true">·</span>
              <span>Immobilier</span>
              <span aria-hidden="true">·</span>
              <span>Patrimoine</span>
              <span aria-hidden="true">·</span>
              <span>Successions</span>
              <span aria-hidden="true">·</span>
              <span>SCI</span>
              <span aria-hidden="true">·</span>
              <span>International</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-8">
              <CtaRendezVous />
              <LienCapitale href="/etude">En savoir plus sur l&rsquo;étude</LienCapitale>
            </div>
          </div>
          <div className="flex flex-col items-center lg:items-end">
            <Image
              src={cheminPublic("/images/portrait.jpg")}
              alt={`${etude.nomNotaire}, notaire à Paris`}
              width={480}
              height={721}
              sizes="(min-width: 1024px) 24rem, 100vw"
              className="w-full max-w-sm rounded-sm"
            />
            <p className="mt-4 text-center text-sm text-slate-soft lg:text-right">
              {ADRESSE_COURTE} — {etude.adresse.codePostal}{" "}
              {etude.adresse.ville}
            </p>
          </div>
        </div>
      </section>

      {/* Pôles — quatre grandes entrées éditoriales avant la grille : le
          visiteur se situe d'abord dans une famille, puis dans une
          expertise. Le titre de chaque pôle est un lien vers l'index, les
          trois expertises en dessous ouvrent directement leur page. */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-grid px-6 py-24 lg:py-32">
          <Intitule>Notre pratique</Intitule>
          <h2
            className="mt-6 max-w-3xl font-serif font-normal leading-[1.12] tracking-tight text-night"
            style={{ fontSize: "clamp(2rem, 3.4vw, 3rem)" }}
          >
            Quatre pôles, une même exigence de conseil
          </h2>
          <ul className="mt-14 grid gap-px border-t border-line md:grid-cols-2 lg:grid-cols-4 lg:border-t-0">
            {poles.map((pole) => (
              <li
                key={pole.categorie}
                className="border-b border-line py-10 lg:border-b-0 lg:border-t lg:pr-8"
              >
                <h3 className="font-serif text-2xl text-night">
                  <Link
                    href="/expertises"
                    className="no-underline hover:text-anthracite"
                  >
                    {CATEGORIE_LABELS[pole.categorie]}
                  </Link>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-soft">
                  {pole.texte}
                </p>
                <ul className="mt-6 space-y-2">
                  {pole.expertises.map((expertise) => (
                    <li key={expertise.slug}>
                      <Link
                        href={`/expertises/${expertise.slug}`}
                        className="text-sm text-night decoration-gold underline-offset-4 hover:underline"
                      >
                        {expertise.titre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <LienCapitale href="/expertises">Toutes nos expertises</LienCapitale>
          </div>
        </div>
      </section>

      {/* Grille de huit expertises — chaque entrée porte une accroche
          descriptive : une liste de titres nus ne dit rien de la pratique. */}
      <section className="bg-ivory">
        <div className="mx-auto w-full max-w-grid px-6 py-24">
          <Intitule>Domaines d&rsquo;intervention</Intitule>
          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {expertises.map(({ slug, frontmatter }) => (
              <li key={slug} className="bg-ivory">
                <Link
                  href={`/expertises/${slug}`}
                  className="block h-full px-6 py-8 no-underline transition-colors hover:bg-paper"
                >
                  <span className="block font-serif text-lg text-night">
                    {frontmatter.title}
                  </span>
                  <span className="mt-2 block text-sm text-slate-soft">
                    {ACCROCHES_ACCUEIL[slug]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Méthode — « de l'analyse à la signature » : l'étude est présente à
          chaque étape, ce qu'un site d'étude de place dit en une phrase et
          que nos trois temps détaillent. Le chapeau désamorce l'inconnu :
          le premier rendez-vous n'engage à rien. */}
      <section className="bg-night text-ivory">
        <div className="mx-auto w-full max-w-grid px-6 py-24 lg:py-32">
          <Intitule surFondSombre>Notre méthode</Intitule>
          <h2
            className="mt-6 max-w-3xl font-serif font-normal leading-[1.12] tracking-tight text-ivory"
            style={{ fontSize: "clamp(2rem, 3.4vw, 3rem)" }}
          >
            De l&rsquo;analyse à la signature
          </h2>
          <p className="mt-6 max-w-2xl text-ivory/80">
            Le premier rendez-vous permet de poser le cadre : vos objectifs, les
            contraintes de l&apos;opération, le calendrier souhaité. Il
            n&apos;engage à rien. La suite du dossier suit trois temps, et
            l&apos;étude est présente à chacun d&apos;eux, jusqu&apos;aux
            formalités qui suivent la signature.
          </p>
          <ol className="mt-14 grid gap-12 md:grid-cols-3">
            {METHODE.map((etape, index) => (
              <li key={etape.titre} className="border-t border-gold/40 pt-6">
                <span
                  aria-hidden="true"
                  className="font-serif text-3xl leading-none text-gold"
                >
                  {`0${index + 1}`}
                </span>
                <h3 className="mt-4 font-serif text-2xl text-ivory">
                  {etape.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ivory/75">
                  {etape.texte}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Démarches à distance — ce qui se fait sans rendez-vous. */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-grid px-6 py-24 lg:py-32">
          <Intitule>Services en ligne</Intitule>
          <h2
            className="mt-6 max-w-3xl font-serif font-normal leading-[1.12] tracking-tight text-night"
            style={{ fontSize: "clamp(2rem, 3.4vw, 3rem)" }}
          >
            Vos démarches à distance
          </h2>
          <ul className="mt-14 grid gap-px border border-line bg-line md:grid-cols-3">
            {DEMARCHES.map((demarche) => (
              <li
                key={demarche.titre}
                className="flex flex-col bg-paper px-8 py-10"
              >
                <h3 className="font-serif text-2xl text-night">
                  {demarche.titre}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-soft">
                  {demarche.texte}
                </p>
                <div className="mt-8">
                  <LienCapitale href={demarche.href} externe={demarche.externe}>
                    {demarche.action}
                  </LienCapitale>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Engagements — quatre énoncés au présent descriptif. */}
      <section className="bg-ivory">
        <div className="mx-auto w-full max-w-grid px-6 py-24 lg:py-32">
          <Intitule>Nos engagements</Intitule>
          <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {ENGAGEMENTS.map((engagement) => (
              <div key={engagement.titre} className="border-t border-line pt-6">
                <h3 className="font-serif text-2xl text-night">
                  {engagement.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-soft">
                  {engagement.texte}
                </p>
                {engagement.lien ? (
                  <Link
                    href={engagement.lien.href}
                    className="mt-4 inline-block text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
                  >
                    {engagement.lien.label}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau international. */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid w-full max-w-grid gap-8 px-6 py-16 lg:grid-cols-[2fr,3fr] lg:items-center">
          <div>
            <Intitule>International</Intitule>
            <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-night">
              Une pratique internationale
            </h2>
          </div>
          <div>
            <p className="text-anthracite">
              Successions comportant des éléments d&apos;extranéité,
              acquisitions par des non-résidents, expatriation et retour en
              France : l&apos;étude traite les dossiers internationaux en
              coordination avec des correspondants étrangers lorsque la
              situation l&apos;exige.
            </p>
            <p className="mt-4 text-sm text-slate-soft">
              Langues de travail : {etude.langues.join(", ")}.
            </p>
          </div>
        </div>
      </section>

      {/* Derniers articles. */}
      <section className="bg-ivory">
        <div className="mx-auto w-full max-w-grid px-6 py-24">
          <Intitule>Actualités et publications</Intitule>
          {derniersArticles.length > 0 ? (
            <ul className="mt-10 grid gap-10 md:grid-cols-3">
              {derniersArticles.map(({ frontmatter }) => (
                <li
                  key={`${frontmatter.categorie}/${frontmatter.slug}`}
                  className="border-t border-line pt-6"
                >
                  <p className="text-[0.72rem] uppercase tracking-[0.2em] text-slate-soft">
                    {CATEGORIE_LABELS[frontmatter.categorie]}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl text-night">
                    <Link
                      href={`/blog/${frontmatter.categorie}/${frontmatter.slug}`}
                      className="no-underline decoration-gold underline-offset-4 hover:underline"
                    >
                      {frontmatter.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-slate-soft">
                    <time dateTime={frontmatter.date}>{frontmatter.date}</time>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-slate-soft">
              Les articles du blog seront publiés prochainement.
            </p>
          )}
          <div className="mt-12">
            <LienCapitale href="/blog">Toutes les publications</LienCapitale>
          </div>
        </div>
      </section>

      {/* Bloc contact — téléphone appelable en grand pour le mobile,
          adresse électronique, lien statique vers Google Maps, pas d'iframe. */}
      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-grid gap-10 px-6 py-24 md:grid-cols-2 lg:py-32">
          <div>
            <Intitule>Contact</Intitule>
            <h2 className="mt-6 font-serif text-3xl font-normal tracking-tight text-night">
              Nous rencontrer
            </h2>
            <p className="mt-6 text-sm text-slate-soft">
              {etude.adresse.ligne1}
              <br />
              {etude.adresse.codePostal} {etude.adresse.ville}
            </p>
            <p className="mt-3">
              <a
                href={`tel:${etude.telephoneE164}`}
                className="font-serif text-3xl text-night no-underline"
              >
                {etude.telephone}
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-soft">{etude.horaires}</p>
            <p className="mt-3">
              <a
                href={`mailto:${etude.email}`}
                className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
              >
                {etude.email}
              </a>
            </p>
            <p className="mt-3">
              <a
                href={etude.liens.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
              >
                Voir le plan d&apos;accès
              </a>
            </p>
          </div>
          <div className="flex flex-col items-start justify-center gap-6">
            <CtaRendezVous />
            <LienCapitale href="/contact">Accès et formulaire de contact</LienCapitale>
          </div>
        </div>
      </section>
    </main>
  );
}
