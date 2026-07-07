# CLAUDE.md — Site de l'étude notariale Thomas Lévy (Paris)

Ce fichier est le cahier des charges permanent du projet. Toute session de travail doit s'y conformer. En cas de conflit entre une instruction ponctuelle et ce document, signaler le conflit avant d'agir.

---

## 1. Objet du projet

Site vitrine premium d'une étude notariale parisienne positionnée sur l'immobilier complexe, la structuration patrimoniale, les successions internationales et le conseil aux entreprises et family offices.

Objectifs, par ordre de priorité :
1. Crédibilité institutionnelle immédiate (le visiteur type gère des enjeux de plusieurs millions d'euros).
2. Référencement naturel sur les requêtes notariales et patrimoniales parisiennes.
3. Conversion sobre : prise de rendez-vous et prise de contact.

Le site n'est ni un outil transactionnel ni un espace client.

---

## 2. Périmètre

### Inclus
- Accueil, L'étude, pages d'expertise (une par domaine), Honoraires, Blog juridique, FAQ, Contact, Mentions légales, Politique de confidentialité, Gestion des cookies, Déclaration d'accessibilité.
- SEO technique complet (métadonnées, données structurées, sitemap, flux RSS du blog).
- Formulaire de contact simple (nom, coordonnées, objet, message) avec consentement RGPD explicite.
- Lien de prise de rendez-vous vers un outil externe (variable d'environnement `NEXT_PUBLIC_BOOKING_URL`).

### Exclus — ne jamais développer, même sur demande ponctuelle
- Espace client, dépôt de documents, suivi de dossiers : renvoyer aux outils métier de l'étude.
- Signature électronique : compétence des plateformes agréées de la profession.
- Paiement en ligne.
- Authentification, comptes utilisateurs, base de données.
- Chat, chatbot, avis intégrés autres que le lien vers la fiche Google.

Si une fonctionnalité exclue semble nécessaire, s'arrêter et poser la question.

---

## 3. Contraintes déontologiques — non négociables

Le site est celui d'un officier public ministériel soumis au règlement national du notariat.

Interdictions absolues dans tout contenu, balise, métadonnée ou attribut alt :
- Toute publicité comparative ou dénigrement, même implicite.
- Tout superlatif commercial : « le meilleur », « n°1 », « leader », « imbattable ».
- Toute promesse de résultat : « nous obtiendrons », « garantie », « succès assuré ».
- Toute sollicitation agressive : compte à rebours, offre limitée, pop-up d'incitation.
- Toute mention de tarification autre que le renvoi au tarif réglementé et à la possibilité d'honoraires libres pour les prestations non tarifées.

Formulations admises : sobres, factuelles, descriptives. « L'étude intervient en… », « Notre pratique couvre… », « Un rendez-vous permet d'examiner votre situation. »

Chaque page de fond porte en pied la mention : « Les informations publiées sur ce site ont un caractère général et ne constituent pas une consultation juridique. »

---

## 4. Pile technique

- **Next.js** (App Router), rendu statique (`generateStaticParams`, ISR uniquement si justifié).
- **TypeScript** en mode `strict`, aucun `any` non justifié par un commentaire.
- **Tailwind CSS** avec design tokens définis en §5 — aucune couleur ou taille arbitraire hors tokens.
- **Contenu en MDX** dans `/content` (frontmatter typé avec Zod). Pas de base de données. Pas de CMS dans un premier temps.
- **Framer Motion** limité : fondus et translations ≤ 300 ms, respect strict de `prefers-reduced-motion`.
- Images : `next/image`, AVIF/WebP, dimensionnement explicite, lazy loading hors héros.
- Polices : `next/font`, auto-hébergées, `display: swap`.
- Déploiement cible : Vercel, région `cdg1` (Paris) — données et logs en Union européenne.
- Aucun script tiers hors outil de mesure d'audience exempté de consentement (Plausible ou Matomo auto-hébergé). Pas de Google Analytics par défaut.

---

## 5. Design system

Référence d'inspiration : codes visuels des maisons de gestion privée et du luxe institutionnel. Sobriété absolue ; l'élégance vient de l'espace, de la typographie et du rythme, jamais des effets.

### Palette (tokens Tailwind, noms exacts)
- `ivory` `#FAF7F2` — fond principal
- `paper` `#FFFFFF` — fonds de cartes et sections alternées
- `night` `#101C2C` — bleu nuit, titres et pied de page
- `anthracite` `#2B2E33` — texte courant
- `slate-soft` `#5A6472` — texte secondaire
- `gold` `#A98A4C` — accents uniquement : filets, puces, soulignés de liens, icônes. Jamais en aplat, jamais en fond de bouton plein.
- `line` `#E4DED4` — filets et séparateurs

Contraste : tout couple texte/fond respecte WCAG AA au minimum (vérifier `gold` sur `ivory` — réservé aux éléments non textuels ou en graisse forte et grande taille).

### Typographie
- Titres : serif de caractère (Cormorant Garamond ou Libre Caslon Text), graisses 400–600.
- Texte : sans-serif humaniste (Inter ou Source Sans 3), 16–18 px de base, interlignage 1.6.
- Jamais plus de deux familles. Lettrage des titres légèrement resserré (`tracking-tight`).

### Composition
- Grille max 1200 px, marges généreuses, sections aérées (padding vertical ≥ 96 px sur desktop).
- Héros pleine largeur avec photographie et voile `night` en dégradé pour la lisibilité.
- Boutons : primaire fond `night` texte `ivory` ; secondaire filet 1 px `night` sur fond transparent. Coins très légèrement arrondis (2–4 px). Aucun bouton doré.
- Icônes : trait fin (Lucide), taille modérée, couleur `night` ou `gold`.

---

## 6. Arborescence et URL

```
/                                  Accueil
/etude                             L'étude (histoire, méthode, équipe, engagements, langues)
/expertises                        Index des expertises
/expertises/[slug]                 Pages d'expertise (voir liste)
/honoraires                        Émoluments, débours, taxes, honoraires libres
/blog                              Index du blog
/blog/[categorie]/[slug]           Articles
/faq                               FAQ générale (les FAQ spécialisées vivent sur les pages d'expertise)
/contact                           Contact et accès
/mentions-legales
/politique-de-confidentialite
/cookies
/accessibilite
```

Slugs d'expertise (un fichier MDX par slug) :
`immobilier-residentiel`, `immobilier-commercial`, `vefa`, `promotion-immobiliere`, `marchands-de-biens`, `sci`, `fiscalite-immobiliere`, `successions`, `successions-internationales`, `donations`, `partage`, `divorce`, `structuration-patrimoniale`, `transmission-entreprise`, `baux-commerciaux`, `expatries`, `investisseurs-etrangers`, `family-office`.

Règles d'URL : minuscules, tirets, sans article, sans date, stables. Toute modification d'URL exige une redirection 301 dans `next.config`.

### Maillage interne
- Chaque page d'expertise renvoie vers 3–5 expertises connexes (champ `related` du frontmatter) et vers les articles de sa catégorie de blog.
- Chaque article renvoie vers sa page d'expertise pilier (champ `pillar`).
- Fil d'Ariane sur toute page de profondeur ≥ 2.

---

## 7. SEO technique

- Métadonnées par page via l'API Metadata de Next : `title` ≤ 60 caractères sur le modèle `{Sujet} — Étude notariale {Nom}, Paris {arr.}` ; `description` 140–160 caractères, factuelle, sans superlatif.
- Un `h1` unique par page ; hiérarchie `h2`/`h3` stricte.
- Open Graph et Twitter Card complets, image OG dédiée 1200×630.
- `sitemap.xml` et `robots.txt` générés ; canonicals systématiques.
- Données structurées JSON-LD :
  - `Notary` (sous-type de `LegalService`/`LocalBusiness`) sur l'accueil et le contact : nom, adresse, géolocalisation, horaires, téléphone, `areaServed`, `knowsLanguage`.
  - `BreadcrumbList` sur toute page profonde.
  - `FAQPage` sur `/faq` et sur les blocs FAQ des pages d'expertise.
  - `Article` + `Person` (auteur) sur les articles de blog.
- Les coordonnées (NAP) proviennent d'un unique fichier `src/config/etude.ts` — jamais en dur dans les composants.

---

## 8. Gabarits de page

### Accueil
Héros (photographie, phrase de positionnement sobre, deux CTA : rendez-vous / expertises) → présentation de l'étude en trois paragraphes → grille des expertises (6 à 8 entrées, lien vers l'index) → méthode en trois temps (comprendre, structurer, sécuriser) → bandeau international (langues, clientèle étrangère) → derniers articles → bloc contact avec carte.

### Page d'expertise (gabarit unique piloté par le frontmatter)
Introduction (2–3 paragraphes) → problématiques rencontrées → l'approche de l'étude → déroulement d'un dossier (étapes numérotées) → FAQ (4–8 questions, schema FAQPage) → expertises connexes → CTA rendez-vous.

### Honoraires
Distinction pédagogique mais rigoureuse : émoluments réglementés, débours, droits et taxes, honoraires libres (art. L. 444-1 et s. C. com. et arrêtés tarifaires en vigueur — vérifier les références avant publication). Aucune simulation chiffrée en ligne.

### Contact
Coordonnées, carte (iframe chargée après consentement ou lien statique vers Google Maps — préférer le lien statique par défaut), horaires, formulaire, accès transports.

---

## 9. Contenu — règle stricte

**Ne jamais rédiger de contenu juridique de fond.** Les textes (pages d'expertise, articles, FAQ, honoraires) sont fournis en fichiers MDX validés par le notaire et déposés dans `/content`. En attendant, utiliser des placeholders explicites `[CONTENU À VALIDER — NE PAS PUBLIER]` visibles en développement et bloquants au build de production (vérification dans le pipeline).

Le code peut en revanche générer : les structures, les frontmatters types, les composants d'affichage, les textes purement fonctionnels (navigation, boutons, messages de formulaire).

---

## 10. Qualité — critères de recette

Chaque phase se conclut par ces vérifications, résultats à l'appui :
- Lighthouse ≥ 95 sur les quatre axes, mobile et desktop, sur les gabarits représentatifs.
- Core Web Vitals : LCP < 2,5 s, CLS < 0,1, INP < 200 ms.
- Accessibilité RGAA/WCAG 2.1 AA : navigation clavier complète, focus visibles, landmarks, alt pertinents, formulaire étiqueté, `prefers-reduced-motion` respecté. Audit axe-core sans erreur critique.
- `tsc --noEmit` et lint sans erreur.
- Aucun texte contrevenant au §3 (relire chaque chaîne ajoutée).

---

## 11. Plan de travail

Travailler par phases, dans l'ordre, une branche par phase, sans anticiper :

1. **Socle** : projet Next.js + TypeScript + Tailwind, tokens du §5, polices, layout global (en-tête, pied de page), config `etude.ts`, pipeline de contenu MDX typé.
2. **Gabarits** : accueil, gabarit expertise, honoraires, contact, pages légales — avec placeholders.
3. **Blog et FAQ** : index, catégories, gabarit article, flux RSS, FAQ.
4. **SEO** : métadonnées, JSON-LD, sitemap, OG images, redirections.
5. **Finitions** : animations, états de focus, audit accessibilité, optimisation des performances, recette complète du §10.

À la fin de chaque phase : récapitulatif des choix effectués, points d'attention, questions ouvertes.

---

## 12. Conventions

- Composants dans `src/components`, un composant par fichier, props typées et documentées.
- Pas de dépendance ajoutée sans justification écrite dans le commit.
- Commits en français, sobres, à l'impératif.
- Aucun secret dans le code ; variables d'environnement documentées dans `.env.example`.
