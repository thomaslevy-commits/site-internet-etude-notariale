# CLAUDE.md — Site de l'étude notariale Thomas Lévy (Paris)

Ce fichier est le cahier des charges permanent du projet. Toute session de travail doit s'y conformer. En cas de conflit entre une instruction ponctuelle et ce document, signaler le conflit avant d'agir.

---

## 1. Objet du projet

Site premium d'une étude notariale parisienne positionnée sur l'immobilier complexe, la structuration patrimoniale, les successions internationales et le conseil aux entreprises et family offices.

Objectifs, par ordre de priorité :
1. Crédibilité institutionnelle immédiate (le visiteur type gère des enjeux de plusieurs millions d'euros).
2. Référencement naturel sur les requêtes notariales et patrimoniales parisiennes.
3. Conversion sobre : prise de rendez-vous et prise de contact.
4. Espace client sécurisé (phase 2) : dépôt de documents, suivi de dossiers, signature électronique, paiement des provisions.

---

## 2. Périmètre

### Inclus — site vitrine (phase 1)
- Accueil, L'étude, pages d'expertise (une par domaine), Tarif, Blog juridique (index, pages de rubrique, articles), FAQ, Contact, Mentions légales, Politique de confidentialité, Gestion des cookies, Déclaration d'accessibilité.
- SEO technique complet (métadonnées, données structurées, sitemap, flux RSS du blog).
- Formulaire de contact simple (nom, coordonnées, objet, message) avec consentement RGPD explicite.
- Lien de prise de rendez-vous vers un outil externe (variable d'environnement `NEXT_PUBLIC_BOOKING_URL`).
- Lien sortant vers l'espace sécurisé d'échange de documents d'un prestataire externe (`etude.liens.dataRoom`, décision du notaire du 6 août 2026). Le site n'héberge ni ne transporte aucune pièce : il renvoie, rien de plus.

### Inclus — espace client (phase 2 ; exclusion levée par décision du notaire le 2 août 2026)
- Espace client sécurisé avec comptes utilisateurs et authentification forte (MFA).
- Dépôt et échange de documents chiffrés entre le client et l'étude.
- Suivi de l'avancement des dossiers : statuts et étapes publiés par l'étude, sans jamais exposer le contenu des actes dans les notifications.
- Signature électronique via un prestataire qualifié eIDAS, pour les documents **non authentiques** uniquement (lettres de mission, conventions d'honoraires, documents préparatoires). L'acte authentique électronique (AAE) reste signé exclusivement via les outils agréés de la profession — ce n'est pas une fonctionnalité du site et aucun développement ne doit le laisser croire.
- Paiement en ligne sécurisé des provisions sur frais et honoraires via un prestataire de services de paiement agréé, avec rapprochement comptable par l'étude. Les fonds réglementés (prix de vente, fonds de tiers) continuent de transiter exclusivement par la comptabilité de l'étude et la Caisse des Dépôts — jamais par le site.
- Base de données PostgreSQL hébergée en Union européenne.

### Exclus
- Chat, chatbot.
- Avis intégrés autres que le lien vers la fiche Google.
- Toute conservation en ligne d'actes authentiques : le minutier reste dans les systèmes agréés de la profession.

Si une fonctionnalité exclue semble nécessaire, s'arrêter et poser la question.

### Exigences de sécurité et de conformité de la phase 2 — non négociables
- Hébergement, base de données, stockage de fichiers et journaux exclusivement en Union européenne ; chiffrement en transit et au repos ; journalisation des accès aux documents.
- Authentification forte (MFA) pour les clients comme pour les collaborateurs ; sessions courtes ; moindre privilège ; aucun compte partagé.
- Analyse d'impact RGPD (AIPD) réalisée et registre des traitements mis à jour **avant** la mise en production de l'espace client ; politique de rétention et de purge des documents écrite et appliquée.
- Le secret professionnel prime sur tout : les e-mails et notifications ne contiennent jamais le contenu d'un dossier, seulement une invitation à se connecter.
- Audit de sécurité (ou test d'intrusion) avant ouverture au public ; sauvegardes chiffrées, testées par des restaurations régulières.
- Prestataires (signature eIDAS, paiement) : choix soumis à validation écrite du notaire, contrats de sous-traitance RGPD (art. 28) vérifiés.

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

- **Next.js** (App Router). Site vitrine : rendu statique (`generateStaticParams`, ISR uniquement si justifié). Espace client : Route Handlers (API REST) avec validation Zod et limitation de débit.
- **TypeScript** en mode `strict`, aucun `any` non justifié par un commentaire.
- **Tailwind CSS** avec design tokens définis en §5 — aucune couleur ou taille arbitraire hors tokens.
- **Contenu éditorial en MDX** dans `/content` (frontmatter typé avec Zod). La base de données est réservée à l'espace client — le contenu éditorial reste en MDX, sans CMS dans un premier temps.
- **PostgreSQL** (phase 2) hébergé en UE, accédé via un ORM typé (Prisma ou Drizzle) ; migrations versionnées ; aucun SQL construit par concaténation.
- **Authentification** (phase 2) : solution éprouvée (Auth.js ou équivalent), MFA, mots de passe hachés par algorithme moderne — jamais d'implémentation maison de la cryptographie.
- **Animations en CSS pur.** Framer Motion était prévu ; le projet s'en est passé et n'a aucune bibliothèque d'animation. Ne pas en réintroduire une sans nécessité démontrée. Fondus et translations ≤ 300 ms, respect strict de `prefers-reduced-motion`.
- Images : `next/image`, AVIF/WebP, dimensionnement explicite, lazy loading hors héros.
- Polices : `next/font`, auto-hébergées, `display: swap`.
- Déploiement cible : Vercel, région `cdg1` (Paris) — données et logs en Union européenne.
- Aucun script tiers hors outil de mesure d'audience exempté de consentement (Plausible ou Matomo auto-hébergé) et prestataires de la phase 2 (signature, paiement) chargés uniquement sur leurs pages.

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
- `gold-ink` `#77613A` — textes dorés sur fonds clairs (5,5:1 sur `ivory`).
- `line` `#E4DED4` — filets et séparateurs décoratifs
- `line-strong` `#978B74` — limites des champs de saisie uniquement. `line` ne vaut que 1,34:1 sur `paper`, quand le critère WCAG 1.4.11 en exige 3 pour la bordure qui identifie un composant de saisie.

Contraste : tout couple texte/fond respecte WCAG AA au minimum (`gold` sur `ivory` ne vaut que 3,06:1 — réservé aux éléments non textuels ; pour du texte, employer `gold-ink`).

### Typographie
- Titres : serif de caractère (Cormorant Garamond ou Libre Caslon Text), graisses 400–600.
- Texte : sans-serif humaniste (Inter ou Source Sans 3), 16–18 px de base, interlignage 1.6.
- Jamais plus de deux familles. Lettrage des titres légèrement resserré (`tracking-tight`).

### Composition
- Grille max 1200 px, marges généreuses, sections aérées (padding vertical ≥ 96 px sur desktop).
- Héros pleine largeur avec photographie et voile `night` en dégradé pour la lisibilité.
- Boutons : primaire fond `night` texte `ivory` ; secondaire filet 1 px `night` sur fond transparent. Coins très légèrement arrondis (2–4 px). Aucun bouton doré, y compris au survol.
- Icônes : trait fin (Lucide), taille modérée, couleur `night` ou `gold`.

### Signature visuelle — à préserver
Le filet or de 40 px au-dessus de chaque titre de section, l'alternance ivoire / blanc / bleu nuit en bandes pleine largeur, les numéros décoratifs en serif or, la grille d'expertises en `gap-px` sur fond `line`, le héros sans photographie et l'emblème animé du panonceau constituent l'identité visuelle du site. Aucune évolution ne doit les dégrader sans décision expresse.

---

## 6. Arborescence et URL

```
/                                  Accueil
/etude                             L'étude (histoire, méthode, équipe, engagements, langues)
/expertises                        Index des expertises
/expertises/[slug]                 Pages d'expertise (voir liste)
/tarif                             Émoluments, débours, taxes, honoraires libres
                                   (301 depuis /honoraires — voir next.config.ts)
/blog                              Index du blog
/blog/[categorie]                  Rubrique (immobilier, patrimoine-famille,
                                   entreprise, international)
/blog/[categorie]/[slug]           Articles
/faq                               FAQ générale (les FAQ spécialisées vivent sur les pages d'expertise)
/contact                           Contact et accès
/espace-client                     Espace client (phase 2 — connexion, dossiers, documents, signature, paiement)
/mentions-legales
/politique-de-confidentialite
/cookies
/accessibilite
```

Liens sortants portés par l'en-tête, sans route interne correspondante :
`etude.liens.dataRoom` (espace documentaire du prestataire). Une entrée
« Paiement en ligne » a existé et pointait vers `/paiement`, qui n'a jamais
existé : elle servait un 404 sur toutes les pages et a été retirée. Elle
relève de la phase 2 et ne sera rétablie qu'une fois un prestataire retenu.

Slugs d'expertise (un fichier MDX par slug) :
`immobilier-residentiel`, `immobilier-commercial`, `vefa`, `promotion-immobiliere`, `marchands-de-biens`, `sci`, `fiscalite-immobiliere`, `successions`, `successions-internationales`, `donations`, `partage`, `divorce`, `structuration-patrimoniale`, `transmission-entreprise`, `baux-commerciaux`, `expatries`, `investisseurs-etrangers`, `family-office`.

Règles d'URL : minuscules, tirets, sans article, sans date, stables. Toute modification d'URL exige une redirection 301 dans `next.config`. Les pages de l'espace client sont exclues de l'indexation (`noindex`, hors sitemap).

### Maillage interne
- Chaque page d'expertise renvoie vers 3–5 expertises connexes (champ `related` du frontmatter), vers les articles de sa catégorie de blog et vers `/tarif`.
- Chaque article renvoie vers sa page d'expertise pilier (champ `pillar`) et vers sa page de rubrique.
- Fil d'Ariane sur toute page de profondeur ≥ 2 et sur les pages légales.

---

## 7. SEO technique

- Métadonnées par page via l'API Metadata de Next : `title` ≤ 60 caractères sur le modèle `{Sujet} — Étude notariale {Nom}, Paris {arr.}` ; `description` 140–160 caractères, factuelle, sans superlatif.
- Un `h1` unique par page ; hiérarchie `h2`/`h3` stricte.
- Open Graph et Twitter Card complets, image OG dédiée 1200×630.
- `sitemap.xml` et `robots.txt` générés ; canonicals systématiques. Les pages de rubrique n'entrent au sitemap qu'une fois peuplées.
- Favicon : `src/app/icon.svg` (provisoire, composé sur les seuls tokens du §5 — à remplacer lorsque l'identité sera arrêtée).
- Données structurées JSON-LD :
  - `Notary` (sous-type de `LegalService`/`LocalBusiness`) sur l'accueil et le contact : nom, adresse, géolocalisation, horaires, téléphone, `areaServed`, `knowsLanguage`.
  - `BreadcrumbList` sur toute page profonde.
  - `FAQPage` sur `/faq` et sur les blocs FAQ des pages d'expertise.
  - `Article` + `Person` (auteur) sur les articles de blog.
- Les coordonnées (NAP) proviennent d'un unique fichier `src/config/etude.ts` — jamais en dur dans les composants. `data/etude-nap.json` en est le reflet pour les workflows externes : toute divergence entre les deux se propagerait aux annuaires.

---

## 8. Gabarits de page

### Accueil
Héros (phrase de positionnement sobre, emblème, deux CTA : rendez-vous / expertises) → présentation du notaire → grille des expertises (6 à 8 entrées, lien vers l'index) → méthode en trois temps (comprendre, structurer, sécuriser) → engagements → bandeau international (langues, clientèle étrangère) → derniers articles → bloc contact.

### Page d'expertise (gabarit unique piloté par le frontmatter)
Introduction (2–3 paragraphes) → problématiques rencontrées → l'approche de l'étude → déroulement d'un dossier (étapes numérotées) → FAQ (4–8 questions, schema FAQPage) → expertises connexes → CTA rendez-vous → renvoi vers `/tarif`.

### Tarif
Distinction pédagogique mais rigoureuse : émoluments réglementés, débours, droits et taxes, honoraires libres (art. L. 444-1 et s. C. com. et arrêtés tarifaires en vigueur — vérifier les références avant publication). Aucune simulation chiffrée en ligne.

### Pages légales (gabarit unique piloté par le MDX)
Sections à paragraphes, listes et couples terme/valeur, chargées depuis `content/legal/*.mdx` et validées par Zod. Le code ne rédige aucune mention.

### Contact
Coordonnées, horaires, accès (source unique `src/config/acces.ts`), formulaire, lien statique vers Google Maps. La carte n'est chargée qu'après accord exprès du visiteur.

---

## 9. Contenu — règle stricte

**Ne jamais rédiger de contenu juridique de fond.** Les textes (pages d'expertise, articles, FAQ, tarif, pages légales) sont fournis en fichiers MDX validés par le notaire et déposés dans `/content`.

Le code peut en revanche générer : les structures, les frontmatters types, les composants d'affichage, les textes purement fonctionnels (navigation, boutons, messages de formulaire).

Deux marqueurs, deux régimes :
- `[CONTENU À VALIDER — NE PAS PUBLIER]` — **bloquant**. Aucun build de production ne passe tant qu'il subsiste dans un fichier publié.
- `[À VALIDER — … ]` — **non bloquant**, réservé aux pages légales : un élément que seul le notaire peut renseigner (forme d'exercice, SIREN, assureur, durées de conservation). La page reste publiable, le marqueur est rendu visible à l'écran, et `verifier:contenu` en dresse la liste à chaque construction.

La garde `scripts/verifier-contenu.mjs` est branchée sur `prebuild` et doit l'être sur la CI (`CONTENU_STRICT=1`). Elle n'était appelée nulle part jusqu'au 2 septembre 2026 : c'est ce qui a permis la mise en ligne de quatre pages légales portant la sentinelle bloquante. Ne jamais la débrancher.

Les gabarits d'article non publiés vivent dans `content/blog/_exemples/` : les dossiers préfixés par `_` ne sont chargés par aucune route et sont ignorés par la garde.

---

## 10. Qualité — critères de recette

Chaque phase se conclut par ces vérifications, résultats à l'appui :
- Lighthouse ≥ 95 sur les quatre axes, mobile et desktop, sur les gabarits représentatifs.
- Core Web Vitals : LCP < 2,5 s, CLS < 0,1, INP < 200 ms.
- Accessibilité RGAA/WCAG 2.1 AA : navigation clavier complète, focus visibles, landmarks, alt pertinents, formulaire étiqueté, erreurs annoncées, `prefers-reduced-motion` respecté. Audit axe-core sans erreur critique.
- `tsc --noEmit`, `npm run lint` et `npm run verifier:contenu` sans erreur.
- Aucun texte contrevenant au §3 (relire chaque chaîne ajoutée).
- Espace client (phase 2) : en plus, revue de sécurité de chaque sous-lot (authentification, contrôle d'accès, chiffrement, journalisation) avant fusion.

Aucune mesure Lighthouse ou Core Web Vitals réelle n'a été consignée à ce jour. Ne jamais annoncer un score qui n'a pas été mesuré.

---

## 11. Plan de travail

Travailler par phases, dans l'ordre, une branche par phase, sans anticiper :

1. **Socle** : projet Next.js + TypeScript + Tailwind, tokens du §5, polices, layout global (en-tête, pied de page), config `etude.ts`, pipeline de contenu MDX typé.
2. **Gabarits** : accueil, gabarit expertise, tarif, contact, pages légales.
3. **Blog et FAQ** : index, rubriques, gabarit article, flux RSS, FAQ.
4. **SEO** : métadonnées, JSON-LD, sitemap, OG images, redirections.
5. **Finitions** : animations, états de focus, audit accessibilité, optimisation des performances, recette complète du §10.
6. **Espace client** (après mise en ligne du site vitrine, sous-lots dans cet ordre) : modèle de données et infrastructure → authentification (MFA) → dossiers et suivi → dépôt de documents chiffrés → signature électronique (prestataire eIDAS) → paiement des provisions (PSP). Chaque sous-lot passe la revue de sécurité du §10 et les exigences du §2 avant ouverture ; AIPD et audit de sécurité avant toute mise en production.

À la fin de chaque phase : récapitulatif des choix effectués, points d'attention, questions ouvertes.

---

## 12. Conventions

- Composants dans `src/components`, un composant par fichier, props typées et documentées.
- Pas de dépendance ajoutée sans justification écrite dans le commit.
- Commits en français, sobres, à l'impératif. Une branche par sujet, tout passe par une proposition de fusion.
- Aucun secret dans le code ; variables d'environnement documentées dans `.env.example`.
- Les commentaires expliquent *pourquoi*, non *quoi* : ils consignent la décision et le raisonnement qui l'a produite. C'est la mémoire du projet — ne pas les élaguer.

---

## 13. État du projet et arbitrages ouverts (2 septembre 2026)

**Le site est en ligne** sur `https://www.levy-notaires.fr` et sert `main`.
Il porte toutefois `robots: { index: false, follow: false }`
(`src/app/layout.tsx`) : il est public et intégralement désindexé. La levée de
ce `noindex` est une décision du notaire, à ne prendre qu'après validation des
quatre pages légales et de l'ensemble des contenus.

**Décisions en attente, à ne pas trancher sans accord explicite :**
1. Forme d'exercice de l'office (notaire à titre individuel ou société) — les
   annuaires officiels font état d'une structure à plusieurs associés. Elle
   commande les mentions légales et le champ `founder` du JSON-LD.
2. Branche `etude/parcours-et-formation` : elle ajoute le parcours du notaire
   sur `/etude` mais supprime l'emblème animé du héros, direction retenue sur
   `main` au terme de cinq commits.
3. Branche `rdv/socle-plateforme` : plateforme de rendez-vous développée en
   interne (~8 900 lignes) contre le lien vers un outil externe prévu au §2.
4. Maintien ou retrait de `@vercel/speed-insights`, que le §4 n'autorise pas
   en l'état et qu'aucune politique ne déclarait.
5. Prestataire recevant les envois du formulaire de contact : identité,
   localisation, contrat de sous-traitance (art. 28 RGPD), durée de
   conservation.

**Écarts connus, non traités à ce jour :** `'unsafe-inline'` dans la directive
`script-src` de la CSP ; corps rédactionnel des pages d'expertise trop court
pour les requêtes visées (~400 mots) ; blog sans article publié ; FAQ à neuf
questions ; aucune version anglaise malgré `knowsLanguage: [fr, en, de]` ;
`embleme-notaire.png` à 855 Ko ; aucune mesure Lighthouse consignée ;
`output: "export"` conservé dans `next.config.ts` sans workflow qui l'active —
son activation désactiverait silencieusement redirections et en-têtes.
