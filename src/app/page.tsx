import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaRendezVous } from "@/components/cta-rdv";
import { ContactBand } from "@/components/contact-band";
import { ArticleList } from "@/components/article-list";
import { ExpertiseExplorer } from "@/components/expertise-explorer";
import { JsonLd, schemaNotary } from "@/components/json-ld";
import { FAMILLES } from "@/config/navigation";
import { etude } from "@/config/etude";
import { loadAllArticles, loadExpertise } from "@/lib/content";
import { cheminPublic } from "@/lib/chemins";

export const metadata: Metadata = {
  description: "Étude notariale à Paris 16ᵉ. Immobilier, successions, structuration patrimoniale, entreprise et clientèle internationale. Consultations sur rendez-vous.",
  alternates: { canonical: "/" },
};
// La méthode reprend les textes existants, sans promesse de résultat.
const METHODE = [
  { titre: "Comprendre", texte: "Chaque dossier commence par vos objectifs. Avant toute règle de droit, l'étude identifie les intérêts en présence, les contraintes et les marges de manœuvre." },
  { titre: "Structurer", texte: "L'opération est ensuite construite : choix des techniques juridiques, articulation civile et fiscale, calendrier. La meilleure architecture est souvent la plus simple." },
  { titre: "Sécuriser", texte: "Les actes traduisent cette analyse. Chaque clause a une raison d'être ; les formalités et la publicité foncière sont conduites jusqu'à leur complet accomplissement." },
] as const;

export default function Accueil() {
  const articles = loadAllArticles().slice(0, 3);
  const paiement = process.env.NEXT_PUBLIC_PAIEMENT_URL;
  const domaines = FAMILLES.map((f) => ({
    id: f.id, titre: f.titre, description: f.description,
    expertises: f.slugs.map((slug) => ({ slug, titre: loadExpertise(slug).frontmatter.title })),
  }));
  return (
    <main className="editorial-home">
      <JsonLd data={schemaNotary()} />
      <section className="signature-hero" aria-labelledby="titre-accueil">
        <div className="site-container signature-grid">
          <div className="signature-copy">
            <p className="eyebrow signature-kicker"><span className="short-rule" aria-hidden="true" /> Étude notariale · Paris XVI</p>
            <h1 id="titre-accueil">Le droit.<br />La confiance.<br /><em>La durée.</em></h1>
            <div className="signature-intro">
              <p>Immobilier, patrimoine, famille et entreprise.<br className="desktop-break" /> Thomas Lévy vous accompagne dans les décisions qui engagent votre avenir, en France et à l&apos;international.</p>
              <CtaRendezVous />
            </div>
          </div>
          <figure className="signature-portrait">
            <div className="signature-image">
              <Image src={cheminPublic("/images/portrait.jpg")} alt="Maître Thomas Lévy, notaire à Paris" width={1023} height={1537} priority sizes="(min-width: 1400px) 520px, (min-width: 900px) 42vw, 90vw" />
              <span className="portrait-edge" aria-hidden="true">LÉVY NOTAIRES · PARIS</span>
            </div>
            <figcaption>
              <span><strong>Thomas Lévy</strong><span>Notaire à Paris</span></span>
              <Link href="/etude" className="round-link" aria-label="Découvrir le parcours de Thomas Lévy">↗</Link>
            </figcaption>
          </figure>
        </div>
        <div className="site-container signature-baseline">
          <p>{etude.adresse.ligne1} <span>{etude.adresse.codePostal} {etude.adresse.ville}</span></p>
          <Link href="/international">Français <span aria-hidden="true">/</span> English <span aria-hidden="true">/</span> Deutsch</Link>
          <a href="#domaines">Explorer nos expertises <span aria-hidden="true">↓</span></a>
        </div>
      </section>
      <section id="domaines" className="expertise-stage" aria-labelledby="domaines-title">
        <div className="site-container">
          <div className="chapter-heading">
            <p className="eyebrow">01 <span aria-hidden="true">/</span> Nos expertises</p>
            <h2 id="domaines-title">Vos projets.<br /><em>Notre regard.</em></h2>
            <p>Quatre domaines qui se répondent,<br />une même attention à votre situation.</p>
          </div>
          <ExpertiseExplorer domaines={domaines} />
        </div>
      </section>
      <section className="site-container philosophy-section" aria-labelledby="methode-title">
        <div className="philosophy-intro">
          <p className="eyebrow">02 <span aria-hidden="true">/</span> L&apos;esprit de l&apos;étude</p>
          <div>
            <h2 id="methode-title" className="editorial-title">Comprendre.<br /><em>Avant de rédiger.</em></h2>
            <div className="philosophy-copy">
              <p>Le rôle du notaire ne se réduit pas à la rédaction d&apos;actes. Il consiste à comprendre une opération, à en anticiper les difficultés et à construire une architecture juridique solide.</p>
              <Link href="/etude" className="text-link">L&apos;étude et sa méthode <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
        <ol className="method-columns">{METHODE.map((etape, index) => <li key={etape.titre}><span className="method-index" aria-hidden="true">0{index + 1}</span><h3>{etape.titre}</h3><p>{etape.texte}</p></li>)}</ol>
      </section>
      <section className="international-scene" aria-labelledby="international-title">
        <div className="site-container international-grid">
          <div>
            <p className="eyebrow">03 <span aria-hidden="true">/</span> Une dimension internationale</p>
            <h2 id="international-title">Paris.<br /><em>Et au-delà.</em></h2>
            <Link href="/expertises#international" className="text-link">Les expertises internationales <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="international-content">
            <p>Votre patrimoine ne s&apos;arrête pas à une frontière. Successions transfrontalières, expatriation, investissements en France : l&apos;étude accompagne les situations qui font dialoguer plusieurs pays.</p>
            <nav aria-label="Choisir la langue des informations pratiques" className="language-routes">
              <Link href="/international"><span>FR</span><span>Votre projet international</span><span aria-hidden="true">↗</span></Link>
              <Link href="/international#english" lang="en"><span>EN</span><span>Your projects in France</span><span aria-hidden="true">↗</span></Link>
              <Link href="/international#deutsch" lang="de"><span>DE</span><span>Ihre Vorhaben in Frankreich</span><span aria-hidden="true">↗</span></Link>
            </nav>
            <p className="language-note">Informations pratiques en trois langues · Analyses juridiques en français</p>
          </div>
        </div>
      </section>
      {articles.length > 0 && <section className="site-container journal-section" aria-labelledby="publications-title">
        <div className="journal-heading">
          <div><p className="eyebrow">04 <span aria-hidden="true">/</span> Le journal de l&apos;étude</p><h2 id="publications-title" className="editorial-title">Matière à <em>réflexion.</em></h2></div>
          <Link href="/blog" className="text-link">Toutes les publications <span aria-hidden="true">↗</span></Link>
        </div>
        <ArticleList articles={articles} titreNiveau={3} format="grille" />
      </section>}
      <section className="dossier-strip" aria-label="Vos démarches avec l'étude">
        <div className="site-container dossier-grid">
          <a href={etude.liens.dataRoom} target="_blank" rel="noopener noreferrer"><span>Votre dossier</span><strong>Espace documentaire</strong><span aria-hidden="true">↗</span><span className="sr-only">Nouvelle fenêtre</span></a>
          <Link href="/faq"><span>Vos questions</span><strong>Les réponses de l&apos;étude</strong><span aria-hidden="true">↗</span></Link>
          <Link href="/contact?sujet=Copie%20d%27acte#ecrire"><span>Vos démarches</span><strong>Demander une copie d&apos;acte</strong><span aria-hidden="true">↗</span></Link>
          {paiement && <a href={paiement}><span>Votre règlement</span><strong>Paiement en ligne</strong><span aria-hidden="true">↗</span></a>}
        </div>
      </section>
      <ContactBand />
    </main>
  );
}
