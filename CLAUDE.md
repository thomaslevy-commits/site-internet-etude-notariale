# CLAUDE.md — Site de l'étude notariale Thomas Lévy (Paris)

Ce fichier est le cahier des charges permanent du projet. Toute session de travail doit s'y conformer. En cas de conflit entre une instruction ponctuelle et ce document, signaler le conflit avant d'agir.

**Révision du 3 septembre 2026 — liberté de conception.** Le notaire a abrogé l'ensemble des règles de design, de gabarits, de pile technique et de seuils de performance qui bridaient la conception du site (anciens §2 « Exclus », §4, §5, §6 « règles d'URL » et « maillage », §8, §10). Ne subsistent que les obligations d'ordre légal (§3 déontologie, secret professionnel, exactitude des pages légales) et les mécanismes qui protègent le notaire (§9, §12). Toute règle esthétique ou technique rencontrée ailleurs dans le dépôt (commentaires, skill, anciens audits) est lue à la lumière de cette révision et ne fait plus obstacle.

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

### Périmètre ouvert (décision du notaire du 3 septembre 2026)
Aucune fonctionnalité n'est exclue a priori. Chat, avis intégrés, contenus embarqués ou tout autre module peuvent être proposés et mis en place sur décision du notaire. Une seule limite demeure, d'ordre légal : aucun acte authentique n'est conservé en ligne — le minutier reste dans les systèmes agréés de la profession.

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

- **Next.js** (App Router), **TypeScript** strict, **Tailwind CSS**. Contenu éditorial en MDX dans `/content` (frontmatter validé par Zod).
- Espace client (phase 2) : Route Handlers avec validation Zod, PostgreSQL hébergé en UE, authentification éprouvée avec MFA, jamais de cryptographie maison.
- Déploiement Vercel, région `cdg1` (Paris).
- **Liberté technique (décision du notaire du 3 septembre 2026)** : bibliothèques d'animation, scripts et contenus tiers (cartes, vidéos, mesure d'audience, polices distantes), formats d'image et de police sont laissés à l'appréciation du concepteur. La seule contrepartie est de bonne foi : tout traceur ou service tiers effectivement chargé est déclaré tel quel dans `content/legal/cookies.mdx` et `content/legal/politique-de-confidentialite.mdx`, qui décrivent le site réel et non un site idéal.

---

## 5. Direction artistique — libre

Le design system antérieur (palette fermée, typographies imposées, grille, règles de boutons, « signature visuelle à préserver ») est **abrogé par décision du notaire du 3 septembre 2026**. Les tokens Tailwind existants (`ivory`, `paper`, `night`, `anthracite`, `slate-soft`, `gold`, `gold-ink`, `line`, `line-strong`) restent disponibles comme point de départ, sans valeur normative : couleurs, typographies, compositions, animations, photographies et emblèmes peuvent être repensés librement, dans le respect du seul §3.

Deux exigences subsistent, parce qu'elles sont juridiques et non esthétiques :
- le §3 (déontologie de la communication notariale) s'applique à tout visuel, texte, balise et attribut alt ;
- les contrastes texte/fond et la navigation clavier restent conformes au niveau AA, la page « Déclaration d'accessibilité » engageant l'étude sur ce point. Si le design retenu s'en écarte, la déclaration est mise à jour en conséquence plutôt que laissée inexacte.

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

L'arborescence ci-dessus décrit l'état actuel, non une contrainte : pages, sections et URL peuvent être créées, fusionnées ou supprimées. Une URL déjà indexée qui disparaît reçoit une redirection 301 dans `next.config` — c'est une pratique de bon sens, non une règle du projet. Les pages de l'espace client sont exclues de l'indexation (`noindex`, hors sitemap).

### Maillage interne
Libre. Les champs `related` et `pillar` des frontmatters restent disponibles pour qui veut s'en servir.

---

## 7. SEO technique

- Métadonnées par page via l'API Metadata de Next : `title` ≤ 60 caractères sur le modèle `{Sujet} — Étude notariale {Nom}, Paris {arr.}` ; `description` 140–160 caractères, factuelle, sans superlatif.
- Un `h1` unique par page ; hiérarchie `h2`/`h3` stricte.
- Open Graph et Twitter Card complets, image OG dédiée 1200×630.
- `sitemap.xml` et `robots.txt` générés ; canonicals systématiques. Les pages de rubrique n'entrent au sitemap qu'une fois peuplées. Les pages légales portant encore un marqueur `[À VALIDER — … ]` sont déclarées `noindex, follow` et exclues du sitemap ; l'exclusion est dérivée du contenu (`pageLegaleIncomplete`) et tombe d'elle-même une fois le dernier élément renseigné.
- Favicon : `src/app/icon.svg` (provisoire, composé sur les seuls tokens du §5 — à remplacer lorsque l'identité sera arrêtée).
- Données structurées JSON-LD :
  - `Notary` (sous-type de `LegalService`/`LocalBusiness`) sur l'accueil et le contact : nom, adresse, géolocalisation, horaires, téléphone, `areaServed`, `knowsLanguage`. Le type existe bien au vocabulaire schema.org ; ne pas le remplacer par `ProfessionalService`, qui y est déprécié.
  - `BreadcrumbList` sur toute page profonde.
  - `FAQPage` sur `/faq` et sur les blocs FAQ des pages d'expertise.
  - `Article` + `Person` (auteur) sur les articles de blog.
- Les coordonnées (NAP) proviennent d'un unique fichier `src/config/etude.ts` — jamais en dur dans les composants. `data/etude-nap.json` en est le reflet pour les workflows externes : toute divergence entre les deux se propagerait aux annuaires.

---

## 8. Gabarits de page — libres

Les gabarits antérieurs (ordre des sections de l'accueil, structure imposée des pages d'expertise, règles de la page contact) sont **abrogés par décision du notaire du 3 septembre 2026**. Chaque page peut être composée librement. Deux mécanismes techniques subsistent parce qu'ils protègent le notaire et non le design :
- les pages légales sont chargées depuis `content/legal/*.mdx` — le code n'y rédige aucune mention ;
- la garde `verifier:contenu` (§9) reste branchée.

La carte d'accès du pied de page est chargée directement depuis Google (décision du notaire du 3 septembre 2026) ; les pages « Gestion des cookies » et « Politique de confidentialité » le déclarent.

---

## 9. Contenu — règle stricte

**Ne jamais rédiger de contenu juridique de fond.** Les textes (pages d'expertise, articles, FAQ, tarif, pages légales) sont fournis en fichiers MDX validés par le notaire et déposés dans `/content`.

Le code peut en revanche générer : les structures, les frontmatters types, les composants d'affichage, les textes purement fonctionnels (navigation, boutons, messages de formulaire).

Deux marqueurs, deux régimes :
- `[CONTENU À VALIDER — NE PAS PUBLIER]` — **bloquant**. Aucun build de production ne passe tant qu'il subsiste dans un fichier publié.
- `[À VALIDER — … ]` — **non bloquant**, réservé aux pages légales : un élément que seul le notaire peut renseigner (forme d'exercice, SIREN, assureur, durées de conservation). La page reste publiable mais n'est pas indexable, le marqueur est rendu visible à l'écran, et `verifier:contenu` en dresse la liste à chaque construction.

La garde `scripts/verifier-contenu.mjs` est branchée sur `prebuild` et doit l'être sur la CI (`CONTENU_STRICT=1`). Elle n'était appelée nulle part jusqu'au 2 septembre 2026 : c'est ce qui a permis la mise en ligne de quatre pages légales portant la sentinelle bloquante. Ne jamais la débrancher.

Les gabarits d'article non publiés vivent dans `content/blog/_exemples/` : les dossiers préfixés par `_` ne sont chargés par aucune route et sont ignorés par la garde.

---

## 10. Qualité — indicateurs, non seuils

Les seuils antérieurs (Lighthouse ≥ 95, Core Web Vitals chiffrés) sont **abrogés par décision du notaire du 3 septembre 2026** : ils ne bloquent plus aucun choix de conception. Lighthouse et axe-core restent exécutés en CI à titre indicatif (`warn`), pour mesurer l'effet d'un choix, jamais pour l'interdire. Restent bloquants : `tsc --noEmit`, `npm run lint`, `npm run verifier:contenu`, et la relecture du §3 sur chaque chaîne ajoutée. Aucun score non mesuré n'est annoncé.

---

## 11. Plan de travail

Travailler par phases, dans l'ordre, sans anticiper :

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
- Commits en français, sobres, à l'impératif.
- **Tout le travail se fait sur `main`, et sur `main` seule** (décision du notaire du 2 septembre 2026). Ni branche de sujet, ni proposition de fusion : chaque modification est commitée puis poussée directement sur `main`, qui est la seule source de vérité et la seule branche déployée. Ne créer une branche que sur demande expresse du notaire, pour un chantier dont il a lui-même décidé qu'il ne devait pas rejoindre `main` en l'état.
- **Contrepartie de la règle précédente, impérative :** la proposition de fusion servait de garde avant production. Cette garde disparaît, la vérification passe donc *avant* le commit. Ne rien pousser sur `main` sans avoir fait passer, dans cet ordre, `npx tsc --noEmit`, `npm run lint` et `npm run verifier:contenu`, et sans avoir relu chaque chaîne ajoutée au regard du §3. Un push sur `main` est une mise en production : il n'y a plus d'étape entre le commit et le site.
- Ce qui n'est pas en état d'être servi au public ne se cache pas derrière une branche mais derrière un interrupteur : `noindex`, route désactivée ou variable d'environnement. Le dépôt reste linéaire, le site reste maîtrisé.
- Aucun secret dans le code ; variables d'environnement documentées dans `.env.example`.
- Les commentaires expliquent *pourquoi*, non *quoi* : ils consignent la décision et le raisonnement qui l'a produite. C'est la mémoire du projet — ne pas les élaguer.

---

## 13. État du projet et arbitrages ouverts (3 septembre 2026)

**Le site est en ligne** sur `https://www.levy-notaires.fr` et sert `main`.
Il porte toutefois `robots: { index: false, follow: false }`
(`src/app/layout.tsx`) : il est public et intégralement désindexé. La levée de
ce `noindex` est une décision du notaire, à ne prendre qu'après validation des
quatre pages légales et de l'ensemble des contenus.

**Consolidation du 2 septembre 2026.** Les propositions de fusion #41
(régularisation de l'audit de phase 0), #34 (parcours et formation) et #40
(lien Data Room) ont rejoint `main`. La #40 était intégralement reprise par la
#41, qui la complète — lien corrigé aussi dans le menu mobile, entrée
« Paiement en ligne » retirée faute de destination : elle a donc été close
comme absorbée plutôt que fusionnée deux fois. `tsc --noEmit`, `next lint` et
`verifier:contenu` passent sur `main` après fusion. Le dépôt passe au régime
du §12 : plus de branche, plus de proposition de fusion, tout sur `main`.

**Correctifs du 3 septembre 2026** (suites du troisième audit de phase 0,
`claude/audit-phase0-main-c3ad754.md`). Le formulaire de contact n'annonce
plus un envoi qui n'a pas eu lieu : le court-circuit anti-automate affichait
« votre message a bien été transmis » sans rien envoyer, et un gestionnaire de
mots de passe renseignant le champ leurre suffisait à le déclencher. La
soumission part désormais toujours, marquée `suspect` à l'usage du service
destinataire, et le contrôle de l'endpoint passe avant tout le reste. Les
pages légales portant encore un marqueur sont exclues de l'index et du
sitemap, par dérivation du contenu et non par liste tenue à la main. La garde
exige les champs `problematiques`, `approche` et `etapes` de chaque expertise,
que le gabarit remplaçait sinon par la sentinelle injectée depuis le code —
seconde porte par laquelle « NE PAS PUBLIER » pouvait encore atteindre le
public. La liste d'accès n'est plus dupliquée sur `/contact`.
`loadAllExpertises`, export mort, est supprimé. `lighthouserc.mobile.json`
ajoute une mesure mobile, indicative et non bloquante.

**Liberté de conception du 3 septembre 2026.** Le notaire a abrogé les règles
de design, de gabarits, de pile technique et de seuils de performance (voir
l'avertissement en tête de fichier et les §2, 4, 5, 6, 8 et 10 révisés). La
carte Google du pied de page est chargée directement, sans consentement
préalable ; `access-map.tsx`, `cookies.mdx` et
`politique-de-confidentialite.mdx` sont alignés sur ce choix. Les assertions
Lighthouse passent en `warn`.

**Reste à appliquer à la main sur `.github/workflows/ci.yml`** — les fichiers
de workflow ne peuvent pas être écrits par une intégration : poser
`CONTENU_STRICT: "1"` en variable d'environnement du pipeline, étendre le
périmètre `axe-core` de quatre à neuf adresses (accueil, étude, expertise,
tarif, FAQ, contact, page légale, rubrique de blog, 404) et ajouter l'étape
Lighthouse mobile en `continue-on-error`. Sans `CONTENU_STRICT`, la garde ne
bloque qu'au déploiement de production.

**Décisions en attente, à ne pas trancher sans accord explicite :**
1. **Forme d'exercice — tranchée le 2 septembre 2026** (société civile
   professionnelle à associé unique) et publiée dans les mentions légales.
   **Point de vérification rouvert le 3 septembre 2026 :** l'annuaire des
   Notaires de France recense la société « SCP Thomas LEVY », 11 boulevard
   Flandrin 75116 Paris, en y rattachant plusieurs notaires. Une mention
   légale inexacte sur la forme d'exercice n'est pas un détail rédactionnel
   sur le site d'un officier public : à confirmer par le notaire sur pièce
   (extrait du registre du commerce et des sociétés) avant toute mise en
   index. En découlent la dénomination sociale, le SIREN, le directeur de la
   publication, `denominationComplete` de `src/config/etude.ts`, le fichier
   `data/etude-nap.json` diffusé aux annuaires et le champ `founder` du
   JSON-LD — lequel affirme aujourd'hui que le notaire a *constitué* la
   société.
2. Branche `rdv/socle-plateforme` : plateforme de rendez-vous développée en
   interne (~8 900 lignes) contre le lien vers un outil externe prévu au §2.
   Seule branche laissée ouverte, volontairement : son propre auteur la
   signale comme non déployable (ni base de données, ni authentification, ni
   AIPD) et trois conflits avec le §2 et le §9 restent à trancher. Elle ne
   rejoindra `main` qu'après arbitrage.
3. Destination du lien « Paiement en ligne » de l'en-tête, retiré le
   2 septembre 2026 faute d'adresse : prestataire de paiement retenu, ou
   service de paiement en ligne de la profession. Point signalé comme
   prioritaire par le notaire.
   **Périmètre à arrêter par écrit avant toute ligne de code** : le paiement
   en ligne ne porte que sur les sommes dues à l'étude au titre de sa
   rémunération et de ses remboursements — émoluments, honoraires libres,
   débours et taxes afférentes. Aucun fonds de dossier — prix, dépôt de
   garantie, séquestre, provision destinée à un tiers — ne saurait transiter
   par le compte technique d'un prestataire de paiement généraliste. Le
   circuit d'encaissement lui-même (compte récepteur, délai de reversement,
   commissions prélevées, imputation comptable, mécanique de remboursement)
   doit être établi et validé par le comptable taxateur avant implémentation.
   En cas de doute sur la nature d'une somme, la traiter comme un fonds de
   dossier et s'arrêter.
4. Maintien ou retrait de `@vercel/speed-insights`, désormais autorisé par le
   §4 révisé mais toujours signalé « à valider » dans les pages légales.
5. Prestataire recevant les envois du formulaire de contact : identité,
   localisation, contrat de sous-traitance (art. 28 RGPD), durée de
   conservation.
6. Prestataire de la Data Room : le lien est actif sur chaque page et le
   traitement n'est déclaré dans aucune politique. Identité, localisation,
   contrat art. 28, articulation avec le secret professionnel.

**Écarts connus, non traités à ce jour :** `'unsafe-inline'` dans la directive
`script-src` de la CSP ; corps rédactionnel des pages d'expertise trop court
pour les requêtes visées — 62 mots en moyenne hors frontmatter, mesurés le
3 septembre 2026, soit 1 120 mots pour dix-huit pages ; blog sans article
publié ; FAQ à neuf questions ; aucune version anglaise malgré
`knowsLanguage: [fr, en, de]` ; `embleme-notaire.png` à 836 Ko en `priority`
sur le héros de l'accueil, donc candidat direct au LCP ; aucune mesure
Lighthouse consignée dans le dépôt — le pipeline mesure, il ne conserve pas ;
`output: "export"` conservé dans `next.config.ts` sans workflow qui l'active —
son activation désactiverait silencieusement redirections et en-têtes.
