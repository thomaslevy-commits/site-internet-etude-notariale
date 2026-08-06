# 01 — Architecture fonctionnelle et parcours utilisateur

**Objet.** Décrire comment la plateforme de prise de rendez-vous est découpée, où passe la frontière avec le site vitrine existant, comment circulent les données, et quelles règles gouvernent l'affectation d'un interlocuteur, la réservation d'un créneau et le cycle de vie d'une demande.

**Statut du document.** Document de conception. Il décrit une cible et les choix qu'elle suppose ; il ne décrit pas un système en service. Les points encore ouverts sont signalés comme tels, et le §11 en dresse la liste.

**Public visé.** Le notaire et l'étude d'abord, l'équipe technique ensuite. Les termes techniques indispensables sont expliqués à leur première apparition.

---

## 1. Ce qui existe aujourd'hui, ce qui n'existe pas

Il faut lire ce document en sachant précisément où en est le travail.

Le travail est en cours et le dépôt évolue ; le tableau du §2 fait foi sur le détail. En substance, à la date de rédaction :

**Écrit :**

- Le **cœur métier** : vocabulaire commun (`types.ts`), catalogue des douze motifs (`motifs.ts`), questions et règles (`qualification/regles.ts`), moteur d'évaluation (`qualification/moteur.ts`), catalogue des pièces (`documents.ts`). Quatre motifs sur douze portent des questions validées.
- Les **règles auxiliaires** : affectation, créneaux, calendrier, professionnels.
- Une **première ébauche d'interface** : `src/app/rendez-vous/page.tsx` et les composants `src/rendez-vous/composants/`, en `noindex`.
- Un **schéma de base de données cible** : `prisma/schema.prisma`, décrit au document 02.
- Des **modèles d'e-mails** et une **couche d'adaptation CRM**, décrite au document 03.

**N'existe pas :**

- **Aucune infrastructure.** Pas de base de données créée, pas de migration produite (`prisma/migrations/` est absent), pas de stockage de fichiers, pas de service d'envoi d'e-mails configuré.
- **Aucune dépendance correspondante dans `package.json`** : ni ORM, ni bibliothèque d'authentification, ni client d'envoi d'e-mails, ni client de stockage. Ce qui est écrit ne s'exécute donc pas encore de bout en bout.
- **Aucune authentification, aucun contrôle d'accès, aucune journalisation des accès aux documents.**
- **Aucun tableau de bord interne** : `src/app/interne/` n'existe pas.
- **Aucune interface serveur** : `src/app/api/` n'existe pas ; rien n'est encore persisté.

Autrement dit, ce qui est fait est le cœur métier et sa mise en forme — la partie qui encode les décisions du notaire. Tout ce qui touche à la conservation effective des données, à l'identité des personnes et aux échanges avec l'extérieur reste à faire, et c'est précisément la partie soumise aux exigences du §2 du cahier des charges (voir `04-conformite-et-securite.md`).

---

## 2. Découpage en modules

La plateforme se décompose en sept modules. Le découpage a une raison pratique : chacun peut être revu, testé et validé séparément, et l'ordre ci-dessous est aussi un ordre de construction possible.

| Module | Rôle | Emplacement prévu | État |
|---|---|---|---|
| **Domaine** | Vocabulaire partagé : types, statuts, structures de données. Ne dépend de rien. | `src/rendez-vous/types.ts` | Fait |
| **Catalogue** | Motifs, questions, règles d'évaluation, catalogue des pièces. Contenu soumis au notaire. | `src/rendez-vous/motifs.ts`, `qualification/regles.ts`, `documents.ts` | Fait pour 4 motifs sur 12 |
| **Moteur de qualification** | Décide quelles questions afficher, calcule urgence, complexité, durée, compétence requise et pièces à réunir. Fonction pure : mêmes réponses, même résultat. | `src/rendez-vous/qualification/moteur.ts` | Fait |
| **Parcours client** | Les neuf écrans, la validation des saisies, la sauvegarde et la reprise. | `src/app/rendez-vous/`, `src/rendez-vous/composants/` | Ébauche d'interface, sans persistance |
| **Persistance et fichiers** | Base PostgreSQL en Union européenne, stockage des pièces déposées, journal des accès. | `prisma/schema.prisma`, couche d'accès dédiée | Schéma cible écrit ; aucune base, aucune migration |
| **Planification** | Disponibilités des professionnels, proposition de créneaux, réservation sans doublon, synchronisation calendrier. | `src/rendez-vous/creneaux.ts`, `affectation.ts`, `calendrier.ts`, `professionnels.ts` | Règles écrites ; réservation non branchée à une base |
| **Notifications** | E-mails de confirmation, de rappel et d'alerte interne. Aucun contenu de dossier dans un e-mail (§2). | `src/rendez-vous/emails/` | Modèles écrits ; aucun envoi possible |
| **Tableau de bord interne** | Consultation, tri, affectation manuelle, changement de statut, accès aux pièces. Accès réservé aux collaborateurs. | `src/app/interne/…` | À faire |
| **Intégration CRM** | Export ou synchronisation vers l'outil de l'étude. Volontairement différée. | `src/rendez-vous/crm/` | Couche d'adaptation écrite, aucun CRM branché (document 03) |

**Règle de dépendance.** Les modules ne se référencent que de haut en bas de ce tableau : le domaine ne connaît personne, le moteur ne connaît que le domaine et le catalogue, le parcours ne connaît que ce qui le précède. Aucun module métier n'appelle directement un prestataire externe ; les échanges passent par une couche d'adaptation dédiée. Cette contrainte n'est pas une préférence esthétique : elle permet de changer de prestataire d'envoi d'e-mails, de stockage ou de CRM sans toucher aux règles du notaire, et elle rend le moteur testable sans base de données ni réseau.

---

## 3. Frontière entre le site vitrine et la plateforme

Le site vitrine et la plateforme n'ont ni le même régime juridique, ni le même régime technique. La frontière doit être explicite.

| | Site vitrine (phases 1 à 5) | Plateforme de rendez-vous |
|---|---|---|
| Nature des données | Aucune donnée personnelle conservée, hors formulaire de contact | Données personnelles, données de situation familiale et patrimoniale, pièces jointes |
| Rendu | Pages statiques, engendrées à la construction | Pages dynamiques, réponses calculées à chaque demande |
| Conservation | Contenu éditorial en fichiers MDX, aucune base | Base PostgreSQL en UE + stockage de fichiers en UE |
| Indexation par les moteurs | Recherchée | Interdite (`noindex`, hors `sitemap.xml`) |
| Authentification | Aucune | Requise pour l'étude ; à décider pour le client (voir §10 et document 04) |
| Journalisation | Journaux techniques ordinaires | Journal des accès aux documents, conservé et consultable |
| Exigences applicables | §3 déontologie, §5 design, §7 SEO, §10 recette | Les mêmes, **plus** l'intégralité des exigences de sécurité du §2 |

**Ce qui traverse la frontière, et rien d'autre :**

1. Du vitrine vers la plateforme : un lien. Le composant `src/components/cta-rdv.tsx` pointe aujourd'hui vers la variable `NEXT_PUBLIC_BOOKING_URL` (outil externe) et retombe sur `/contact` si elle est vide. Le jour où la plateforme ouvre, cette variable prend l'adresse de la plateforme — le vitrine n'a rien d'autre à savoir.
2. De la plateforme vers le vitrine : rien. La plateforme ne lit ni n'écrit dans le contenu du site.
3. Le partage se limite à la charte : `src/config/etude.ts` pour les coordonnées, les tokens Tailwind du §5, les polices. Il s'agit de présentation, pas de données.

Cette frontière doit rester une règle de code, pas une intention : aucun module du site vitrine ne doit importer un module `src/rendez-vous/*`, et réciproquement, hors configuration de présentation.

---

## 4. Les trois modes d'intégration

Trois façons d'exposer la plateforme au public ont été demandées. Elles ne diffèrent pas par les fonctionnalités mais par les conséquences techniques, et ces conséquences sont réelles.

### Mode A — Page dédiée sur le même domaine

`https://www.levy-notaires.fr/rendez-vous`

Le parcours vit dans le même projet Next.js et sous la même adresse que le site.

**Conséquences :**

- *Continuité pour le visiteur* : pas de rupture d'adresse ni de charte ; c'est le mode le plus lisible pour le client.
- *Cookies et sessions* : cookies de premier niveau, sans difficulté particulière. C'est le mode le plus simple pour maintenir un parcours en cours ou une session authentifiée.
- *En-têtes de sécurité* : le fichier `vercel.json` applique aujourd'hui une politique de sécurité de contenu (CSP — la liste des sources que le navigateur a le droit de contacter) à **toutes** les adresses du site, avec `connect-src 'self'`. Toute communication de la plateforme vers un autre domaine (stockage de fichiers, service d'envoi, prestataire de visioconférence) devra être ajoutée explicitement, sous peine d'échec silencieux côté visiteur.
- *Indexation* : les adresses `/rendez-vous/*` doivent être exclues du `sitemap.ts` et marquées `noindex`, comme le prévoit le §6 pour l'espace client.
- *Périmètre d'un incident* : le site vitrine et la plateforme partagent le même déploiement. Une régression sur la plateforme peut affecter la disponibilité du site vitrine. C'est le principal inconvénient de ce mode.
- *Sauvegardes et journaux* : un seul projet, une seule configuration à contrôler — plus simple à auditer.

### Mode B — Sous-domaine dédié

`https://rendez-vous.levy-notaires.fr`

Un second projet, déployé séparément, éventuellement avec sa propre base et ses propres journaux.

**Conséquences :**

- *Isolement* : c'est le principal intérêt. Le site vitrine reste en ligne si la plateforme est arrêtée, et inversement. Les droits d'accès, les variables d'environnement et les journaux sont séparés. Pour un système qui traite des données couvertes par le secret professionnel, cet isolement est un argument sérieux.
- *Cookies* : un cookie posé sur `rendez-vous.levy-notaires.fr` n'est pas lisible par `www.levy-notaires.fr`, et c'est souhaitable. Il ne faut **pas** élargir les cookies au domaine parent pour « simplifier » : cela exposerait la session de la plateforme à toutes les pages du site.
- *Certificat et DNS* : un enregistrement DNS et un certificat supplémentaires à gérer et à surveiller (échéance de renouvellement).
- *Charte* : les tokens de design et les polices doivent être dupliqués ou extraits dans un module partagé. Sans discipline, les deux interfaces divergent visuellement en quelques mois.
- *Continuité perçue* : le changement d'adresse est visible par le client. Il est acceptable si l'aspect reste identique, et il est même rassurant s'il est annoncé (« vous accédez à l'espace sécurisé de l'étude »).
- *Coût* : deux projets à déployer, à surveiller et à auditer.

### Mode C — Module embarqué dans une page du site

Le parcours est inséré dans une page du site vitrine, soit comme composant du même projet, soit dans un cadre (`iframe`) pointant vers le sous-domaine.

**Conséquences, et elles sont lourdes :**

- *Si le module est embarqué comme composant du même projet*, on est en réalité dans le mode A avec une contrainte de mise en page supplémentaire : le parcours doit cohabiter avec l'en-tête et le pied de page. Un parcours en neuf étapes réclame de la place ; l'encadrer dans un gabarit de page vitrine dégrade la lisibilité, particulièrement sur téléphone.
- *Si le module est embarqué dans un `iframe` vers le sous-domaine*, trois obstacles techniques sont à lever :
  1. `vercel.json` impose aujourd'hui `X-Frame-Options: DENY` et `frame-ancestors 'none'`, c'est-à-dire l'interdiction pure et simple d'afficher le site dans un cadre. Il faudrait relâcher cette protection côté plateforme pour autoriser précisément le domaine du site — et une protection relâchée est une protection à justifier.
  2. La directive `frame-src` du site ne mentionne aujourd'hui que Google Maps ; il faudrait y ajouter le sous-domaine.
  3. Les navigateurs bloquent par défaut les cookies dits « tiers », c'est-à-dire ceux posés par un contenu affiché dans un cadre depuis un autre domaine. La sauvegarde du parcours et, a fortiori, une session authentifiée deviennent fragiles et dépendantes du navigateur du visiteur. Des mécanismes existent pour y remédier, mais ils ajoutent de la complexité à un endroit où l'on ne veut pas de surprise.
- *Accessibilité* : un parcours multi-étapes dans un cadre pose des difficultés de gestion du focus clavier et d'annonce des changements d'étape aux lecteurs d'écran — au regard du critère RGAA/WCAG AA du §10, c'est un risque à ne pas prendre à la légère.

### Recommandation technique, décision au notaire

Sur les seuls critères techniques et de sécurité, l'ordre de préférence est **B, puis A, puis C** : le sous-domaine isole ce qui doit l'être ; la page dédiée est le meilleur compromis si l'on veut un seul projet à maintenir ; le module embarqué en cadre cumule les inconvénients des deux sans avantage propre.

Le choix relève du notaire. Il est réversible à condition d'être fait **avant** de construire le parcours : passer du mode A au mode B après coup impose des redirections permanentes, une reconfiguration des cookies et une révision de la CSP.

---

## 5. Le parcours en neuf étapes

| # | Étape | Ce que fait le visiteur | Ce que fait le système | Données créées |
|---|---|---|---|---|
| 1 | Accueil | Lit l'objet du parcours, la durée approximative, l'information sur le traitement de ses données | Ouvre un brouillon anonyme | Identifiant de brouillon |
| 2 | Motif | Choisit parmi les douze motifs | Vérifie si le parcours complet est ouvert pour ce motif (`parcoursDisponible`) ; sinon oriente vers une demande de rappel | Motif |
| 3 | Qualification | Répond aux questions | Affiche les questions visibles selon les réponses déjà données, bloque tant qu'une question visible obligatoire est sans réponse | Réponses |
| 4 | Coordonnées | Saisit civilité, nom, coordonnées, langue, moyen de contact préféré, consentement | Valide les formats, exige le consentement explicite | Coordonnées |
| 5 | Documents | Dépose les pièces demandées | Calcule la liste propre au dossier, vérifie type et taille (10 Mo, PDF/JPEG/PNG/DOCX), rappelle qu'une copie suffit | Références de fichiers |
| 6 | Interlocuteur | Voit l'interlocuteur proposé, peut demander un autre professionnel | Applique les règles d'affectation (§7) | Professionnel pressenti |
| 7 | Créneau | Choisit un créneau et un format | Propose les créneaux compatibles, pose une réservation temporaire | Créneau retenu (provisoire) |
| 8 | Récapitulatif | Relit et corrige | Reconstruit l'évaluation à partir des réponses définitives | — |
| 9 | Confirmation | Reçoit une référence lisible | Enregistre définitivement, envoie les e-mails, notifie l'étude | Demande consolidée, référence |

**Trois principes tenus tout au long du parcours :**

- **Aucun conseil.** Le moteur classe un dossier pour l'étude : durée, interlocuteur, pièces, ordre de traitement. Il ne dit jamais au visiteur ce qu'il doit faire. La restitution des scores d'urgence et de complexité est **interne** ; elle n'apparaît pas dans le parcours client. Cette limite est déjà structurelle dans le code, elle doit le rester dans les écrans.
- **Aucune question inventée.** Pour les huit motifs dont les questions ne sont pas validées, l'étape 3 est remplacée par une demande de rappel : coordonnées, description libre, disponibilités. L'étude qualifie elle-même.
- **Sortie possible à toute étape.** Le visiteur peut toujours renoncer au parcours et joindre l'étude par téléphone ou par le formulaire de contact. Aucun écran ne piège le visiteur, conformément au §3.

---

## 6. Flux de données de bout en bout

Description en langage courant de ce qui se passe, dans l'ordre.

1. **Ouverture.** Le visiteur arrive sur l'étape 1. Le système crée un brouillon vide côté serveur et remet au navigateur un identifiant opaque — une suite de caractères sans signification, qui ne révèle rien sur le contenu. Cet identifiant est le seul élément conservé dans le navigateur.
2. **Progression.** À chaque étape franchie, le navigateur envoie les réponses au serveur. Le serveur les valide (schéma Zod, comme le prévoit le §4), les enregistre dans le brouillon, et renvoie l'état suivant. **Les données ne sont pas conservées dans le navigateur** : ni les réponses, ni les coordonnées, ni la moindre pièce. Le navigateur ne détient que l'identifiant.
3. **Évaluation.** Le moteur est appliqué côté serveur, sur les réponses enregistrées. Il produit l'urgence, la complexité, la compétence requise, la durée du rendez-vous, la liste des pièces et la liste lisible des règles déclenchées. Le résultat est recalculé à chaque étape plutôt que mémorisé : il reste ainsi cohérent avec les réponses, même après correction.
4. **Dépôt de pièces.** Le fichier est transmis au serveur, contrôlé (type déclaré, type réel, taille, nom nettoyé, analyse antivirus), puis rangé dans un stockage chiffré en Union européenne. Le brouillon ne retient qu'une référence — l'endroit où se trouve le fichier — jamais le fichier lui-même. Chaque dépôt et chaque consultation ultérieure sont inscrits au journal des accès.
5. **Affectation et créneaux.** Le système calcule les professionnels éligibles (§7), interroge leurs disponibilités et propose les créneaux compatibles avec le format demandé et la durée calculée.
6. **Réservation.** Le choix d'un créneau pose une réservation temporaire de courte durée (§8). Elle expire d'elle-même si le parcours n'est pas mené à son terme.
7. **Confirmation.** À la validation finale, le brouillon devient une demande : une référence lisible est attribuée (« RDV-2026-0042 »), le statut passe à `rendez-vous-confirme` ou `rendez-vous-a-valider`, la réservation temporaire devient ferme.
8. **Notifications.** Un e-mail part vers le client, un autre vers l'étude. **Ni l'un ni l'autre ne contient de contenu de dossier** : date, heure, lieu ou format, référence, et une invitation à se connecter ou à joindre l'étude pour le reste. C'est une exigence expresse du §2 et elle prime sur tout confort d'usage.
9. **Traitement interne.** L'étude consulte le tableau de bord, ouvre le dossier, consulte les pièces (chaque consultation est journalisée), fait évoluer le statut.
10. **Sortie.** Le rendez-vous est réalisé, la demande est convertie en dossier dans les outils de l'étude, ou classée sans suite. La purge s'applique ensuite selon la politique de rétention décrite dans le document 04.

Aucune donnée personnelle ne quitte l'Union européenne à aucune de ces étapes — c'est un critère éliminatoire pour le choix de chaque prestataire.

---

## 7. Règles d'affectation automatique de l'interlocuteur

L'affectation est un **filtrage** puis un **classement**. Elle propose, elle ne décide pas : l'étude peut toujours réaffecter.

**Filtrage — un professionnel est éligible s'il satisfait les quatre conditions :**

1. **Compétence.** Il déclare la compétence retenue par le moteur (`evaluation.competence`, parmi immobilier, succession, famille, entreprise, patrimoine, international). La compétence provient du motif choisi, sauf si une règle l'a modifiée — ainsi, une succession dont le défunt résidait hors de France bascule sur la compétence `international`.
2. **Complexité.** Sa complexité maximale traitée est au moins égale à la complexité calculée. Cette condition traduit une consigne du notaire : un dossier de complexité élevée ne se règle pas au premier rendez-vous avec un collaborateur.
3. **Format.** Il accepte le format demandé (à l'étude, visioconférence, téléphone, extérieur).
4. **Langue.** Il parle la langue indiquée dans les coordonnées. Compte tenu de la clientèle de l'étude, cette condition n'est pas accessoire.

**Classement des éligibles — dans cet ordre :**

1. Le professionnel déjà connu du demandeur, s'il en existe un et que l'information est disponible.
2. Celui dont la première disponibilité est la plus proche, si l'urgence est `prioritaire` ou `urgent`.
3. Celui dont la charge de rendez-vous à venir est la moins lourde, pour répartir le travail.
4. À égalité, un ordre stable et prévisible (rang déclaré dans la configuration), jamais un tirage au sort — un système qui donne un résultat différent à chaque exécution est impossible à expliquer et à contrôler.

**Aucun éligible.** Cas fréquent en pratique : langue rare, format inhabituel, complexité élevée alors que le seul professionnel compétent est indisponible. Le système ne dégrade **pas** silencieusement les critères. Il place la demande en `rendez-vous-a-valider`, propose au visiteur d'être rappelé, et alerte l'étude. Un mauvais interlocuteur coûte plus cher qu'un rappel.

**Choix du visiteur.** Le visiteur peut demander un autre professionnel parmi les éligibles. Il ne peut pas contourner le filtrage : la liste qu'il voit est déjà filtrée.

**À décider par le notaire :** la liste nominative des professionnels, leurs compétences déclarées, leur complexité maximale, leurs langues et leurs formats acceptés. Ces données sont de la configuration, pas du code, et elles doivent être validées par écrit.

---

## 8. Créneaux et prévention des doubles réservations

Le risque est simple à énoncer : deux visiteurs regardent le même créneau au même moment, tous deux le réservent, un seul rendez-vous peut avoir lieu. C'est le défaut le plus visible et le plus dommageable qu'une plateforme de rendez-vous puisse avoir.

**Construction des créneaux.** Pour chaque professionnel : des plages d'ouverture déclarées (l'étude reçoit du lundi au vendredi, de 9 h à 19 h, sur rendez-vous), moins les indisponibilités (congés, audiences, rendez-vous existants), découpées selon la durée calculée par le moteur, augmentée d'un temps tampon entre deux rendez-vous. Un délai minimal avant le premier créneau proposé est appliqué, pour laisser à l'étude le temps de préparer le dossier ; ce délai est un paramètre à fixer par le notaire, et il peut différer selon l'urgence.

**Trois protections superposées.**

1. **Réservation temporaire.** Au choix du créneau (étape 7), une réservation nominative de courte durée — de l'ordre de dix à quinze minutes — est posée sur le créneau. Elle le retire des propositions faites aux autres visiteurs et expire automatiquement si le parcours n'aboutit pas. Sans ce mécanisme, un visiteur qui met cinq minutes à relire son récapitulatif peut perdre son créneau : c'est une source de mécontentement inutile.
2. **Réservation ferme sous transaction.** La confirmation s'effectue en une seule opération de base de données, indivisible : ou bien le créneau est libre et la demande est enregistrée, ou bien rien n'est enregistré et le visiteur est informé que le créneau vient d'être pris, avec les créneaux voisins proposés immédiatement.
3. **Contrainte d'unicité en base.** La base de données elle-même refuse deux rendez-vous qui se chevauchent pour un même professionnel. C'est le filet de sécurité : même en cas d'erreur applicative, de double clic, de rejeu d'une requête ou de deux serveurs répondant simultanément, la base tient. Un contrôle applicatif seul ne suffit pas et ne doit pas être considéré comme suffisant.

**Idempotence.** Chaque confirmation porte une clé d'unicité : si le visiteur clique deux fois, ou si le réseau force un renvoi, un seul rendez-vous est créé. Un second envoi renvoie la même référence, sans créer de doublon ni de second e-mail.

**Synchronisation avec les calendriers de l'étude.** C'est le point le plus délicat, et le plus souvent sous-estimé.

- *Sens plateforme → calendrier* : à la confirmation, un événement est créé dans le calendrier du professionnel. L'objet de l'événement ne contient que la référence et le motif au sens large — pas de contenu de dossier, conformément au §2 (les calendriers sont souvent partagés plus largement qu'on ne le croit).
- *Sens calendrier → plateforme* : une réunion ajoutée directement dans le calendrier doit rendre le créneau indisponible sur la plateforme. Deux approches existent : interroger le calendrier au moment de proposer les créneaux (fiable, mais dépendant de la disponibilité du service externe), ou tenir une copie locale rafraîchie régulièrement (rapide, mais susceptible d'être en retard). Une approche mixte est possible : copie locale pour l'affichage, vérification directe juste avant la confirmation ferme.
- *Point d'honnêteté* : quelle que soit l'approche, la plateforme ne peut pas garantir l'absence totale de conflit avec un calendrier externe qu'elle ne maîtrise pas. La procédure de l'étude doit prévoir le cas — d'où l'intérêt du statut `rendez-vous-a-valider` et d'une revue humaine quotidienne des rendez-vous du lendemain.

**Fuseau horaire.** Tous les instants sont conservés en UTC avec fuseau explicite, et affichés en heure de Paris. Les changements d'heure d'été et d'hiver doivent faire l'objet d'un test explicite : c'est une source classique de rendez-vous décalés d'une heure, et l'erreur ne se voit que deux fois par an.

---

## 9. Sauvegarde et reprise du parcours

Un parcours en neuf étapes n'est pas toujours mené d'une traite. Il faut pouvoir l'interrompre et le reprendre — sans transformer cette commodité en fuite de données.

**Principe retenu : tout côté serveur, rien côté navigateur.** Le brouillon vit dans la base ; le navigateur ne détient qu'un identifiant opaque, dans un cookie technique strictement nécessaire au service demandé (à ce titre exempté de consentement, mais à mentionner dans la politique de cookies).

Ce choix est délibéré. Conserver les réponses dans le navigateur (`localStorage`) serait plus simple à écrire et éviterait des allers-retours, mais laisserait sur la machine du visiteur — souvent partagée — des informations de situation familiale ou patrimoniale, hors de portée de toute politique de purge. Le confort de développement ne justifie pas ce risque.

**Reprise sur le même appareil.** Le cookie suffit. Le visiteur retrouve son parcours à l'étape où il l'avait laissé, dans la limite de validité du brouillon.

**Reprise sur un autre appareil.** Elle suppose un lien de reprise envoyé par e-mail, donc que l'adresse ait déjà été saisie (étape 4). Ce lien doit être à usage unique, de durée de vie courte, et ne doit jamais donner accès aux pièces déjà déposées — au mieux à la liste de leurs intitulés. **Cette fonctionnalité est à arbitrer par le notaire** : un lien de reprise dans une boîte aux lettres est un accès à des données sensibles sans authentification, et si l'e-mail est lu par un tiers, l'accès l'est aussi. Le refus de cette fonctionnalité est une position défendable ; le document 04 la traite au titre de l'authentification des clients.

**Durée de vie des brouillons.** Un brouillon non converti est supprimé automatiquement au bout d'un délai court à fixer par le notaire — quelques jours est un ordre de grandeur raisonnable. Les pièces éventuellement déposées sont supprimées avec lui. Cette purge doit être automatique et vérifiable : une purge annoncée mais non exécutée est pire qu'une absence de purge, car elle fonde une déclaration inexacte au registre des traitements.

**Anonymat des premières étapes.** Aux étapes 1 à 3, aucune donnée identifiante n'est saisie. Un brouillon abandonné avant l'étape 4 ne contient donc que des réponses non rattachables à une personne. Il conserve néanmoins une valeur statistique pour l'étude et doit être purgé au même titre.

---

## 10. Statuts et transitions autorisées

Les dix statuts sont fixés dans `types.ts`. Une demande ne peut passer d'un statut à un autre que par une transition prévue ; toute autre tentative est refusée et journalisée. Ce n'est pas une précaution théorique : c'est ce qui empêche qu'une demande annulée redevienne confirmée par un enchaînement d'actions imprévu.

| Statut | Signification | Transitions autorisées | Déclencheur |
|---|---|---|---|
| `brouillon` | Parcours ouvert, rien de consolidé | → `qualification-en-cours`, `sans-suite` | Visiteur / purge automatique |
| `qualification-en-cours` | Questions en cours de réponse | → `attente-documents`, `prete-a-planifier`, `sans-suite` | Visiteur / purge |
| `attente-documents` | Des pièces obligatoires manquent | → `prete-a-planifier`, `sans-suite` | Visiteur / étude |
| `prete-a-planifier` | Tout le nécessaire est réuni | → `rendez-vous-a-valider`, `rendez-vous-confirme`, `sans-suite` | Visiteur / étude |
| `rendez-vous-a-valider` | Créneau demandé, confirmation de l'étude requise | → `rendez-vous-confirme`, `annule`, `prete-a-planifier` | Étude uniquement |
| `rendez-vous-confirme` | Rendez-vous ferme, calendrier alimenté | → `rendez-vous-realise`, `annule`, `prete-a-planifier` | Étude / client / échéance |
| `rendez-vous-realise` | Le rendez-vous a eu lieu | → `converti-en-dossier`, `sans-suite` | Étude |
| `annule` | Rendez-vous annulé, créneau libéré | → `prete-a-planifier`, `sans-suite` | Étude / client |
| `sans-suite` | Demande close sans rendez-vous | → `prete-a-planifier` (réouverture par l'étude) | Étude |
| `converti-en-dossier` | Reprise dans les outils de l'étude | Terminal | Étude |

**Règles complémentaires :**

- **Toute transition est journalisée** : date, auteur (collaborateur identifié, client, ou traitement automatique), statut d'origine, statut d'arrivée, motif éventuel. Ce journal est la mémoire du dossier ; il ne doit jamais être modifiable après coup.
- **Le passage à `rendez-vous-a-valider` ou `rendez-vous-confirme` est automatique** selon une règle à fixer par le notaire. Proposition de départ : confirmation automatique pour les dossiers de complexité `simple` avec un professionnel éligible identifié ; validation humaine pour les autres, et systématiquement pour les motifs sans questions validées.
- **La libération du créneau** intervient à l'entrée dans `annule` et `sans-suite`, jamais avant, et jamais deux fois.
- **`converti-en-dossier` est terminal** : au-delà, le dossier vit dans les outils de l'étude, et la plateforme n'a plus vocation à en conserver le détail. C'est ce statut qui déclenche la fenêtre de purge décrite au document 04.

---

## 11. Points ouverts

À trancher avant de construire le parcours, car chacun de ces points conditionne le reste :

1. **Mode d'intégration** (§4) — A, B ou C. Choix difficilement réversible après construction.
2. **Authentification du client** — parcours entièrement anonyme jusqu'à la confirmation, ou création de compte ? Le §2 impose l'authentification forte pour l'espace client de la phase 2 ; l'articulation entre la plateforme de rendez-vous et cet espace doit être décidée (document 04).
3. **Lien de reprise par e-mail** (§9) — accepté ou refusé.
4. **Règle de confirmation automatique** (§10) — quels dossiers passent sans validation humaine.
5. **Configuration des professionnels** (§7) — liste, compétences, langues, formats, complexité maximale, délai minimal de prise de rendez-vous.
6. **Questions des huit motifs restants** — sans elles, les deux tiers du catalogue restent en demande de rappel (documents 04, §« points de conflit »).
7. **Prestataires** — base de données, stockage, envoi d'e-mails, calendrier. Options présentées au document 05 ; le choix appartient au notaire et doit être écrit (§2).

---

*Documents liés : `04-conformite-et-securite.md` (exigences préalables à toute mise en production), `05-deploiement-et-variables.md` (variables d'environnement et procédure de déploiement).*
