import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaRendezVous } from "@/components/cta-rdv";
import { JsonLd, schemaNotary } from "@/components/json-ld";
import { etude } from "@/config/etude";
import {
  CATEGORIE_LABELS,
  loadAllArticles,
  loadExpertise,
  type ExpertiseSlug,
} from "@/lib/content";

export const metadata: Metadata = {
  description:
    "Étude notariale à Paris : immobilier complexe, structuration patrimoniale, successions internationales, conseil aux entreprises et aux family offices.",
  alternates: { canonical: "/" },
};

/** Sélection de 8 expertises pour la grille d'accueil (§8). */
const EXPERTISES_ACCUEIL: ExpertiseSlug[] = [
  "immobilier-residentiel",
  "vefa",
  "promotion-immobiliere",
  "sci",
  "successions-internationales",
  "structuration-patrimoniale",
  "transmission-entreprise",
  "family-office",
];

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

export default function Accueil() {
  const expertises = EXPERTISES_ACCUEIL.map((slug) => loadExpertise(slug));
  const derniersArticles = loadAllArticles().slice(0, 3);

  return (
    <main>
      <JsonLd data={schemaNotary()} />
      {/* Héros — bannière de l'étude, voile night en dégradé (§5). */}
      <section className="relative bg-night">
        <Image
          src="/images/banniere.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-night/40 to-night/90"
        />
        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-grid flex-col items-start justify-center px-6 py-24">
          <h1 className="max-w-2xl font-serif text-4xl font-medium tracking-tight text-ivory sm:text-5xl">
            Le conseil notarial pour les opérations immobilières et
            patrimoniales complexes
          </h1>
          <p className="mt-6 max-w-xl text-ivory/80">
            À Paris et à l&apos;international, l&apos;étude accompagne
            particuliers, investisseurs, entreprises et family offices.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <CtaRendezVous surFondSombre />
            <Link
              href="/expertises"
              className="inline-block rounded-sm border border-ivory px-6 py-3 text-sm text-ivory transition-colors hover:bg-ivory hover:text-night"
            >
              Nos expertises
            </Link>
          </div>
        </div>
      </section>

      {/* Présentation de l'étude — trois paragraphes (§8). */}
      <section className="mx-auto w-full max-w-grid px-6 py-24">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
          L&apos;étude
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <p className="text-slate-soft">
            Établie à Paris sous la responsabilité de Maître Thomas Lévy,
            l&apos;étude concentre sa pratique sur l&apos;immobilier complexe,
            la structuration patrimoniale, les successions et le conseil aux
            entreprises.
          </p>
          <p className="text-slate-soft">
            Le rôle du notaire ne se réduit pas à la rédaction d&apos;actes :
            il consiste à comprendre une opération, à en anticiper les
            difficultés et à construire une architecture juridique solide.
          </p>
          <p className="text-slate-soft">
            Les dossiers civils, fiscaux et sociétaires sont traités de
            manière croisée, en liaison avec vos conseils habituels — avocats,
            experts-comptables, banquiers privés et gestionnaires de fortune.
          </p>
        </div>
      </section>

      {/* Grille des expertises (§8). */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-grid px-6 py-24">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
            Domaines d&apos;intervention
          </h2>
          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {expertises.map(({ frontmatter }) => (
              <li key={frontmatter.slug} className="bg-paper">
                <Link
                  href={`/expertises/${frontmatter.slug}`}
                  className="block h-full px-6 py-8 transition-colors hover:bg-ivory"
                >
                  <span className="font-serif text-lg text-night">
                    {frontmatter.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link
              href="/expertises"
              className="text-sm text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
            >
              Toutes nos expertises
            </Link>
          </p>
        </div>
      </section>

      {/* Méthode en trois temps (§8) — numéros décoratifs, taille large (AA). */}
      <section className="mx-auto w-full max-w-grid px-6 py-24">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
          Notre méthode
        </h2>
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

      {/* Bandeau international (§8). */}
      <section className="bg-night">
        <div className="mx-auto w-full max-w-grid px-6 py-16">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ivory">
            Une pratique internationale
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-ivory/80">
            Successions comportant des éléments d&apos;extranéité,
            acquisitions par des non-résidents, expatriation et retour en
            France : l&apos;étude traite les dossiers internationaux en
            coordination avec des correspondants étrangers lorsque la
            situation l&apos;exige.
          </p>
          <p className="mt-4 text-sm text-ivory/70">
            Langues : {etude.langues.join(", ")}
          </p>
        </div>
      </section>

      {/* Derniers articles (§8). */}
      <section className="mx-auto w-full max-w-grid px-6 py-24">
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

      {/* Bloc contact (§8) — lien statique vers Google Maps, pas d'iframe. */}
      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-grid gap-10 px-6 py-24 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-night">
              Contact
            </h2>
            <p className="mt-6 text-sm text-slate-soft">
              {etude.adresse.ligne1}
              <br />
              {etude.adresse.codePostal} {etude.adresse.ville}
            </p>
            <p className="mt-3 text-sm text-slate-soft">{etude.telephone}</p>
            <p className="mt-3 text-sm text-slate-soft">{etude.horaires}</p>
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
