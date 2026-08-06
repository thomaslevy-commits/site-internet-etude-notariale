import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaRendezVous } from "@/components/cta-rdv";
import { JsonLd, schemaNotary } from "@/components/json-ld";
import { etude } from "@/config/etude";
import { cheminPublic } from "@/lib/chemins";
import {
  CATEGORIE_LABELS,
  loadAllArticles,
  loadExpertise,
  type ExpertiseSlug,
} from "@/lib/content";

export const metadata: Metadata = {
  description:
    "Étude notariale à Paris 16ᵉ. Immobilier, successions, structuration patrimoniale, entreprise et clientèle internationale. Consultations sur rendez-vous.",
  alternates: { canonical: "/" },
};

/**
 * Sélection de 8 expertises pour la grille d'accueil (§8). Tuple figé : il
 * sert de clé au type de ACCROCHES_ACCUEIL, ce qui rend une accroche
 * manquante détectable à la compilation plutôt qu'à l'affichage.
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

/** Adresse sans la mention d'étage, pour la légende du portrait (§7). */
const ADRESSE_COURTE = etude.adresse.ligne1.split(" — ")[0];

export default function Accueil() {
  const expertises = EXPERTISES_ACCUEIL.map((slug) => ({
    slug,
    frontmatter: loadExpertise(slug).frontmatter,
  }));
  const derniersArticles = loadAllArticles().slice(0, 3);

  return (
    <main>
      <JsonLd data={schemaNotary()} />
      {/* Héros — fond night sobre, médaillon doré du panonceau officiel en
          regard du titre. L'élégance vient de l'espace, de la typographie et
          des filets or (§5) ; aucun aplat doré. */}
      <section className="relative overflow-hidden bg-night">
        <div className="relative mx-auto grid w-full max-w-grid items-center gap-16 px-6 py-24 lg:min-h-[70vh] lg:grid-cols-[minmax(0,7fr),minmax(0,5fr)] lg:py-28">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              Étude notariale — Paris 16ᵉ — depuis 1896
            </p>
            <div aria-hidden="true" className="mt-6 h-px w-16 bg-gold" />
            <h1 className="mt-8 max-w-2xl text-balance font-serif text-4xl font-medium leading-tight tracking-tight text-ivory sm:text-5xl lg:text-6xl">
              Le conseil notarial pour les opérations immobilières et
              patrimoniales complexes
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/80">
              À Paris et à l&apos;international, l&apos;étude accompagne
              particuliers, investisseurs, entreprises et family offices.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <CtaRendezVous surFondSombre />
              <Link
                href="/expertises"
                className="inline-block rounded-sm border border-ivory px-6 py-3 text-sm text-ivory transition-colors hover:bg-ivory hover:text-night"
              >
                Nos expertises
              </Link>
            </div>
          </div>
          <div className="mx-auto flex w-56 flex-col items-center self-stretch sm:w-64 lg:w-full lg:max-w-sm">
            {/* Suspente : fine ligne or terminée par un anneau, comme un
                accrochage de galerie — le panonceau complet (médaillon et
                bandeau) apparaît suspendu, sans mur (§5 : l'or en filets). */}
            <div
              aria-hidden="true"
              className="flex min-h-10 flex-1 flex-col items-center lg:-mt-28 lg:min-h-16"
            >
              <div className="w-px flex-1 bg-gold/60" />
              <div className="h-2 w-2 rounded-full border border-gold" />
            </div>
            <Image
              src={cheminPublic("/images/panonceau-detoure.png")}
              alt="Panonceau officiel des notaires — médaillon « République française » et bandeau Notaire"
              width={468}
              height={582}
              priority
              sizes="(min-width: 1024px) 24rem, 14rem"
              className="mt-3 w-full drop-shadow-2xl"
            />
            <div aria-hidden="true" className="flex-1" />
          </div>
        </div>
      </section>

      {/* Présentation du notaire : visage, nom et vision du métier à la
          première personne — un officier public identifié plutôt qu'anonyme. */}
      <section className="bg-ivory">
        <div className="mx-auto grid w-full max-w-grid gap-12 px-6 py-24 lg:grid-cols-[3fr,2fr]">
          <div className="flex flex-col justify-center">
            <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
            <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
              {etude.denominationComplete}
            </h2>
            <div className="mt-8 space-y-4 text-slate-soft">
              <p>
                Je considère que le rôle du notaire ne se réduit pas à rédiger
                des actes. Il consiste à comprendre une opération, à en
                anticiper les difficultés et à construire une architecture
                juridique dans laquelle chaque partie trouve sa sécurité.
              </p>
              <p>
                L&apos;étude est établie à Paris depuis 1896. Sa pratique est
                tournée vers les opérations immobilières complexes, la
                structuration patrimoniale, les successions françaises et
                internationales, et le conseil aux entreprises et aux family
                offices.
              </p>
              <p>
                Le premier rendez-vous est un échange : il permet de poser le
                cadre d&apos;une opération avant toute question de rédaction ou
                de coût.
              </p>
            </div>
            <div className="mt-8">
              <CtaRendezVous />
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
              Étude notariale depuis 1896
              <br />
              {ADRESSE_COURTE} — {etude.adresse.codePostal}{" "}
              {etude.adresse.ville}
            </p>
          </div>
        </div>
      </section>

      {/* Grille des expertises (§8) — chaque entrée porte une accroche
          descriptive : une liste de titres nus ne dit rien de la pratique. */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-grid px-6 py-24">
          <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
          <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
            Domaines d&apos;intervention
          </h2>
          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {expertises.map(({ slug, frontmatter }) => (
              <li key={slug} className="bg-paper">
                <Link
                  href={`/expertises/${slug}`}
                  className="block h-full px-6 py-8 transition-colors hover:bg-ivory"
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
          <p className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/expertises"
              className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
            >
              Toutes nos expertises
            </Link>
            <Link
              href="/tarif"
              className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
            >
              Comprendre le tarif
            </Link>
          </p>
        </div>
      </section>

      {/* Méthode en trois temps (§8) — numéros décoratifs, taille large (AA).
          Le chapeau désamorce l'inconnu : le premier rendez-vous n'engage à rien. */}
      <section className="mx-auto w-full max-w-grid px-6 py-24">
        <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
        <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
          Notre méthode
        </h2>
        <p className="mt-4 max-w-2xl text-slate-soft">
          Le premier rendez-vous permet de poser le cadre : vos objectifs, les
          contraintes de l&apos;opération, le calendrier souhaité. Il
          n&apos;engage à rien. La suite du dossier suit trois temps.
        </p>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {METHODE.map((etape, index) => (
            <li key={etape.titre}>
              <span
                aria-hidden="true"
                className="font-serif text-2xl leading-none text-gold"
              >
                {`0${index + 1}`}
              </span>
              <h3 className="mt-2 font-serif text-xl text-night">{etape.titre}</h3>
              <p className="mt-3 text-sm text-slate-soft">{etape.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Engagements — quatre énoncés au présent descriptif. */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-grid px-6 py-24">
          <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
          <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
            Nos engagements
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {ENGAGEMENTS.map((engagement) => (
              <div key={engagement.titre}>
                <h3 className="font-serif text-xl text-night">
                  {engagement.titre}
                </h3>
                <p className="mt-3 text-sm text-slate-soft">
                  {engagement.texte}
                </p>
                {engagement.lien ? (
                  <Link
                    href={engagement.lien.href}
                    className="mt-3 inline-block text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
                  >
                    {engagement.lien.label}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau international (§8). */}
      <section className="bg-night">
        <div className="mx-auto w-full max-w-grid px-6 py-16">
          <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ivory">
            Une pratique internationale
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-ivory/80">
            Successions comportant des éléments d&apos;extranéité, acquisitions
            par des non-résidents, expatriation et retour en France :
            l&apos;étude traite les dossiers internationaux en coordination avec
            des correspondants étrangers lorsque la situation l&apos;exige.
          </p>
          <p className="mt-4 text-sm text-ivory/70">
            Langues : {etude.langues.join(", ")}
          </p>
        </div>
      </section>

      {/* Derniers articles (§8). */}
      <section className="mx-auto w-full max-w-grid px-6 py-24">
        <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
        <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
          Actualités
        </h2>
        {derniersArticles.length > 0 ? (
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {derniersArticles.map(({ frontmatter }) => (
              <li key={`${frontmatter.categorie}/${frontmatter.slug}`}>
                <p className="text-sm uppercase tracking-wide text-slate-soft">
                  {CATEGORIE_LABELS[frontmatter.categorie]}
                </p>
                <h3 className="mt-2 font-serif text-xl text-night">
                  <Link
                    href={`/blog/${frontmatter.categorie}/${frontmatter.slug}`}
                    className="decoration-gold underline-offset-4 hover:underline"
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
      </section>

      {/* Bloc contact (§8) — téléphone appelable en grand pour le mobile,
          adresse électronique, lien statique vers Google Maps, pas d'iframe. */}
      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-grid gap-10 px-6 py-24 md:grid-cols-2">
          <div>
            <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
            <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
              Contact
            </h2>
            <p className="mt-6 text-sm text-slate-soft">
              {etude.adresse.ligne1}
              <br />
              {etude.adresse.codePostal} {etude.adresse.ville}
            </p>
            <p className="mt-3">
              <a
                href={`tel:${etude.telephoneE164}`}
                className="font-serif text-2xl text-night no-underline"
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
          <div className="flex flex-col items-start justify-center gap-4">
            <CtaRendezVous />
            <Link
              href="/contact"
              className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
            >
              Accès et formulaire de contact
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
