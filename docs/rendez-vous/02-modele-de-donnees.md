# 02 — Modèle de données

Ce document présente le modèle de données de la plateforme de prise de rendez-vous,
défini dans `prisma/schema.prisma`. Il en explique le rôle table par table, les
relations, les index retenus et — point exigé par le cahier des charges avant
toute mise en production (CLAUDE.md §2) — la politique de conservation et de
purge par catégorie de données.

Le modèle de domaine faisant autorité reste `src/rendez-vous/types.ts`. Le schéma
Prisma en est le reflet persistant : les énumérations reprennent les valeurs des
types TypeScript caractère pour caractère, via les directives `@map`. Toute
évolution doit être portée aux deux endroits.

---

## 1. Principes retenus

Sept décisions structurent l'ensemble du schéma. Elles découlent des exigences
non négociables du §2 du cahier des charges et de la nature des données traitées
(succession, patrimoine, pièces d'identité).

1. **Minimisation.** Aucune donnée n'est collectée « au cas où ». Les champs
   facultatifs de `coordonnees` (adresse, date de naissance) le restent en base
   et ne sont demandés que si le motif ou une règle de qualification le justifie.
2. **Séparation identité / fichier.** Les données d'identité vivent exclusivement
   dans `coordonnees`. Les métadonnées de fichier vivent dans `fichiers_stockes`,
   qui ne contient ni nom, ni adresse, ni **nom de fichier d'origine** — un nom
   comme `CNI-<patronyme>.pdf` révélerait l'identité du demandeur sans aucune
   utilité fonctionnelle. Seule l'extension normalisée est conservée.
3. **Aucun binaire en base.** Le contenu des pièces déposées réside dans un
   stockage objet chiffré hébergé en Union européenne. La base ne conserve
   qu'une clé d'objet opaque, un emplacement logique, une empreinte SHA-256 et la
   **référence** de la clé de chiffrement dans le gestionnaire de clés — jamais
   la clé elle-même, aucun secret ne figure en base (CLAUDE.md §12).
4. **Secret professionnel.** Ni le corps des e-mails, ni la charge utile envoyée
   au CRM, ni aucun élément de dossier ne figurent dans les journaux. Les envois
   ne portent que l'identifiant du gabarit et l'état technique de l'expédition ;
   les synchronisations, l'empreinte de la charge utile.
5. **Traçabilité en ajout seul.** `journal_acces_documents` n'est jamais mis à
   jour ni supprimé hors purge planifiée. Les accès refusés y figurent au même
   titre que les accès autorisés : ce sont eux qui révèlent un incident.
6. **Historisation plutôt qu'écrasement.** Un consentement retiré ne modifie pas
   la ligne d'origine, il en crée une nouvelle. Une règle de disponibilité
   modifiée est clôturée puis remplacée. Un professionnel qui quitte l'étude est
   désactivé, jamais supprimé.
7. **Échéance de purge portée par la donnée.** Chaque table à durée de vie limitée
   porte une colonne `purge_prevue_le` indexée, calculée à l'écriture. La tâche
   de purge n'interroge que les lignes échues ; elle ne parcourt jamais
   l'intégralité d'une table, et une donnée oubliée est visible par simple
   requête sur cette colonne.

---

## 2. Vue d'ensemble

```
                      ┌────────────────────┐
                      │   professionnels   │
                      └─────────┬──────────┘
             ┌──────────────────┼──────────────────┐
             │                  │                  │
   regles_disponibilite  indisponibilites      creneaux
                                                   │ 0..1
                                                   │
┌──────────────┐  1..1   ┌──────────────┐  1..1    │
│ coordonnees  │◄────────│              │──────────┘
└──────────────┘         │              │  1..1  ┌──────────────┐
                         │   demandes   │───────►│ evaluations  │
┌──────────────┐  0..n   │              │        └──────────────┘
│ consentements│◄────────│              │
└──────────────┘         │              │  0..n  ┌──────────────────────┐
                         │              │───────►│ reponses_qualification│
┌──────────────────┐0..n │              │        └──────────────────────┘
│ envois_email     │◄────│              │
└──────────────────┘     │              │  0..n  ┌────────────────────┐
┌──────────────────┐0..n │              │───────►│ documents_demande  │
│synchronisations_ │◄────└──────────────┘        └─────────┬──────────┘
│      crm         │                                       │ 0..1
└──────────────────┘                             ┌─────────▼──────────┐
                                                 │  fichiers_stockes  │
                                                 └─────────┬──────────┘
                                                           │ 0..n
                                              ┌────────────▼─────────────┐
                                              │ journal_acces_documents  │
                                              └──────────────────────────┘
```

---

## 3. Les tables

### 3.1 Parcours

**`demandes`** — table centrale, miroir de `Demande`. Elle porte la référence
lisible communiquée au demandeur (`RDV-2026-0042`), le statut, le motif, le
format souhaité et l'affectation. Elle ne contient **aucune donnée d'identité**,
ce qui permet de l'anonymiser (effacement des coordonnées) tout en conservant
l'historique statistique du parcours.

Trois écarts assumés par rapport à `types.ts`, tous justifiés par la persistance :

- `format` est nullable — il est inconnu tant que la demande est un brouillon ;
- `creneauDebut` / `creneauFin` ne sont pas recopiés : ils se lisent sur le
  créneau lié, source unique de l'horaire ;
- `parcours` (`complet` / `rappel`) distingue les motifs dont les questions sont
  validées de ceux qui basculent vers une demande de rappel
  (`qualification/moteur.ts`, `parcoursDisponible`). Sans ce champ, le tableau de
  bord confondrait deux flux de nature différente.

Le jeton de suivi remis au demandeur (reprise de parcours sans compte) est stocké
**haché** : la base ne permet pas de le reconstituer, et il porte une expiration.

**`coordonnees`** — miroir de `Coordonnees`, en table séparée pour trois raisons :
contrôle d'accès plus fin, anonymisation indépendante de la demande, purge
indépendante des métadonnées de fichier. Le booléen `consentement` de `types.ts`
n'y est **pas dupliqué** : il se lit dans `consentements`, qui porte la preuve
horodatée. Une seule source, pas de divergence possible. Une empreinte de
l'adresse e-mail normalisée est conservée pour rapprocher deux demandes ou
honorer une demande d'effacement après anonymisation, sans garder l'adresse.

**`reponses_qualification`** — une ligne par question répondue, plutôt qu'un
unique document JSON. Ce choix permet d'effacer une réponse précise (droit de
rectification, minimisation a posteriori), d'indexer les questions utiles au
tableau de bord, et de repérer les champs jamais renseignés — donc à retirer du
formulaire. La valeur est répartie sur des colonnes typées selon `type` ; les
choix multiples vont dans `valeur_liste`. L'identifiant de question n'est pas
contraint par une clé étrangère : le catalogue vit dans le code, versionné avec
lui, et une question retirée ne doit pas invalider les demandes passées.

**`evaluations`** — résultat du moteur figé au moment du dépôt, miroir de
`Evaluation`. Il est conservé plutôt que recalculé : le moteur et les règles
évoluent, et l'étude doit pouvoir justifier l'orientation retenue à l'époque. La
colonne `version_moteur` rend l'évaluation rejouable à l'identique — le moteur
est une fonction pure, à condition de savoir dans quelle version il a tourné.

### 3.2 Agenda

**`professionnels`** — miroir de `Professionnel` : compétences, langues, formats
acceptés, complexité maximale traitée. Données professionnelles uniquement (nom
et fonction, déjà publics sur le site). Désactivation plutôt que suppression.

**`regles_disponibilite`** — disponibilité récurrente par jour de semaine. Les
heures sont stockées en **minutes depuis minuit** dans le fuseau `Europe/Paris`,
et non en type horaire : cela évite toute ambiguïté au passage à l'heure d'été.
Une règle modifiée est clôturée (`valable_au`) et remplacée, pour que les agendas
passés restent lisibles.

**`indisponibilites`** — absences ponctuelles, prioritaires sur les règles. Le
libellé est interne et sobre (« congé », « formation ») : jamais un nom de client.

**`creneaux`** — miroir de `Creneau`, augmenté de l'état de réservation.
`retenu_jusqu_a` matérialise la réservation temporaire pendant que le demandeur
termine son parcours ; une tâche libère les créneaux expirés. La contrainte
d'unicité `(professionnel, début)` et la relation unique vers la demande
**interdisent structurellement la double réservation** : ce n'est pas laissé à la
vigilance du code applicatif.

### 3.3 Documents

**`documents_demande`** — table métier : quelle pièce du catalogue
(`src/rendez-vous/documents.ts`) est réclamée pour quelle demande, et où en est
son dépôt. Aucune métadonnée technique, aucune donnée d'identité.

**`fichiers_stockes`** — métadonnées techniques du fichier effectivement déposé :
type MIME, taille, empreinte SHA-256, extension, emplacement chiffré, référence
de clé, résultat de l'analyse antivirus. La séparation d'avec
`documents_demande` est volontaire : la purge du fichier n'efface pas la trace
que la pièce avait été réclamée, ce qui reste nécessaire pour comprendre un
dossier ancien. Après purge, la ligne subsiste avec `purge_le` renseignée comme
preuve de destruction, sans référence exploitable.

**`journal_acces_documents`** — exigence explicite du §2. Chaque dépôt,
consultation, téléchargement, suppression ou purge est tracé : acteur (client,
professionnel, système), action, résultat, et éléments de corrélation réduits —
adresse IP **tronquée** (dernier octet retiré en IPv4, préfixe /48 en IPv6),
empreintes de l'agent utilisateur et de la session. Suffisant pour caractériser
un incident, insuffisant pour profiler. Table en ajout seul.

### 3.4 Communications et intégrations

**`envois_email`** — état technique des e-mails transactionnels : gabarit,
destinataire (`client` ou `etude`), langue, statut, compteur de tentatives,
dernière erreur, prochaine tentative, référence du prestataire. **Aucun corps de
message**, conformément au §2 : un e-mail ne contient jamais d'élément de
dossier, seulement une invitation à se connecter ou à venir. La clé
d'idempotence interdit le double envoi lors d'un rejeu de la file d'attente.

**`synchronisations_crm`** — une ligne par opération tentée vers le CRM de
l'étude, avec `tentatives`, `derniere_erreur`, `derniere_tentative_le` et
`prochaine_tentative_le`. Sans cette trace, une demande peut disparaître entre le
site et le CRM sans que personne ne le voie. La charge utile n'est pas
conservée : seule son empreinte l'est, suffisante pour détecter un rejeu ou une
divergence. `reference_externe` permet la reprise après incident sans créer de
doublon côté CRM.

### 3.5 Conformité

**`consentements`** — une ligne par finalité et par événement, horodatée. Quatre
finalités distinctes : traitement de la demande (indispensable), dépôt de
documents, contact téléphonique, conservation prolongée. Les trois dernières sont
libres et leur refus n'empêche jamais la prise de rendez-vous. La version du
texte présenté et son empreinte prouvent **ce qui a été accepté**, sans recopier
le texte à chaque demande. Un retrait crée une nouvelle ligne `accepte = false`.

---

## 4. Index

| Table | Index | Raison |
|---|---|---|
| `demandes` | `reference` (unique) | Accès par la référence communiquée au demandeur. |
| `demandes` | `jeton_suivi_empreinte` (unique) | Reprise de parcours sans compte. |
| `demandes` | `(statut, cree_le)` | Vue principale du tableau de bord interne, triée par ancienneté. |
| `demandes` | `(professionnel_id, statut)` | Vue par interlocuteur. |
| `demandes` | `(motif, cree_le)` | Statistiques par motif, sans balayage complet. |
| `demandes` | `purge_prevue_le` | Tâche de purge. |
| `coordonnees` | `email_empreinte` | Rapprochement de demandes, traitement d'un droit à l'effacement. |
| `reponses_qualification` | `(demande_id, question_id)` (unique) | Idempotence de l'enregistrement, une réponse par question. |
| `reponses_qualification` | `question_id` | Mesure du taux de remplissage, révision du formulaire. |
| `evaluations` | `(urgence, complexite)` | Tri du tableau de bord par priorité. |
| `creneaux` | `(professionnel_id, debut)` (unique) | Interdit la double réservation. |
| `creneaux` | `(statut, debut)` | Recherche des créneaux libres à venir — la requête la plus fréquente du parcours. |
| `documents_demande` | `(demande_id, definition_id)` (unique) | Une seule ligne par pièce réclamée. |
| `fichiers_stockes` | `empreinte_sha256` | Détection des dépôts en double. |
| `fichiers_stockes` | `statut_analyse` | File d'attente de l'analyse antivirus. |
| `journal_acces_documents` | `(fichier_id, horodatage_le)` | Reconstitution de l'historique d'une pièce. |
| `journal_acces_documents` | `(professionnel_id, horodatage_le)` | Revue des accès d'un collaborateur. |
| `envois_email`, `synchronisations_crm` | `(statut, prochaine_tentative_le)` | Sélection des travaux à rejouer. |
| toutes tables à durée de vie limitée | `purge_prevue_le` | Purge sans balayage. |

---

## 5. Conservation et purge

> Les durées ci-dessous sont une **proposition**. Elles doivent être arrêtées par
> le notaire, inscrites au registre des traitements et cohérentes avec l'AIPD,
> **avant** toute mise en production (CLAUDE.md §2). Elles sont indépendantes des
> obligations d'archivage propres au minutier, qui restent hors de ce système :
> aucun acte authentique n'est conservé ici.

Le point de départ (« déclencheur ») est toujours un événement daté et présent en
base — jamais une appréciation. Chaque écriture calcule `purge_prevue_le` ; une
tâche planifiée quotidienne traite les lignes échues et journalise son passage.

| Catégorie | Tables | Durée proposée | Déclencheur | Action à l'échéance |
|---|---|---|---|---|
| Demande abandonnée (brouillon jamais soumis) | `demandes`, `reponses_qualification`, `coordonnees` | **30 jours** | dernière modification | Suppression complète |
| Demande sans suite (annulée, sans suite, non convertie) | `demandes`, `reponses_qualification` | **12 mois** | entrée en statut terminal (`terminee_le`) | Anonymisation : `coordonnees` supprimée, demande conservée sans identité |
| Demande aboutie non convertie en dossier (rendez-vous réalisé) | `demandes`, `reponses_qualification` | **3 ans** | `terminee_le` | Anonymisation |
| Demande convertie en dossier | `demandes` | **reprise par le CRM**, puis anonymisation à 3 ans | `terminee_le` | Anonymisation ; la conservation métier relève du CRM et du dossier de l'étude, régis par leurs propres règles |
| Coordonnées (identité, contact) | `coordonnees` | alignée sur la demande, **3 ans maximum** sans nouveau contact | dernier contact ou `terminee_le` | Suppression ; `email_empreinte` conservée le temps de traiter une demande d'effacement, puis supprimée |
| Pièces déposées — contenu | stockage objet | **90 jours** après le rendez-vous, **30 jours** si la demande est abandonnée ou sans suite | `depose_le`, recalculé sur `terminee_le` | Destruction du contenu chiffré ; ligne conservée avec `purge_le`, statut `purge` |
| Pièces déposées — métadonnées | `fichiers_stockes`, `documents_demande` | **12 mois** | purge du contenu | Suppression de la ligne technique ; la trace métier « pièce réclamée » suit la demande |
| Journal d'accès aux documents | `journal_acces_documents` | **12 mois** | `horodatage_le` | Suppression. Durée à confirmer avec l'AIPD : c'est le maximum usuellement admis pour un journal de sécurité |
| Envois d'e-mails | `envois_email` | **12 mois** | `cree_le` | Suppression |
| Synchronisations CRM | `synchronisations_crm` | **12 mois** ; les lignes en échec sont conservées jusqu'à résolution explicite | `cree_le` | Suppression, sauf statut `echec` non traité |
| Consentements | `consentements` | **durée du traitement + 3 ans** | `recueilli_le` | Suppression. La preuve doit survivre à la demande qu'elle couvre : c'est la seule catégorie conservée plus longtemps que la donnée principale |
| Agenda (créneaux passés) | `creneaux` | **24 mois** | `debut` | Suppression des créneaux jamais réservés ; les créneaux liés à une demande suivent la demande |
| Référentiel (professionnels, règles de disponibilité) | `professionnels`, `regles_disponibilite` | sans limite | — | Désactivation, pas de suppression |

### Mécanique de purge

- **Anonymisation ≠ suppression.** L'anonymisation supprime la ligne
  `coordonnees` et renseigne `demandes.anonymisee_le`. La demande subsiste, sans
  identité, pour les statistiques d'activité (volumes par motif, délais, taux de
  conversion). Ce n'est plus une donnée personnelle, à condition que
  `reponses_qualification` ait été expurgée des réponses en texte libre — les
  champs `texte-long` peuvent contenir un nom. **Cette expurgation fait partie de
  l'opération d'anonymisation, elle n'est pas optionnelle.**
- **Ordre imposé.** Le contenu du fichier est détruit dans le stockage objet
  *avant* la suppression de la ligne `fichiers_stockes` : perdre la référence
  avant le contenu laisserait un fichier orphelin, chiffré mais présent.
- **Cascade.** Les suppressions en cascade sont déclarées au niveau du schéma
  (`onDelete: Cascade`) pour tout ce qui n'a pas de sens sans la demande. Les
  liens vers les journaux sont en `SetNull` : une demande effacée ne doit pas
  effacer la trace d'un accès.
- **Journalisation de la purge.** Chaque exécution consigne le nombre de lignes
  traitées par catégorie. Une purge silencieuse ne se prouve pas.
- **Sauvegardes.** La purge ne prend effet dans les sauvegardes qu'à l'expiration
  de leur propre rotation. Cette durée doit être documentée dans le registre des
  traitements et communiquée aux personnes concernées.

---

## 6. Migrations et exploitation

- Migrations **versionnées** dans `prisma/migrations/**`, générées par
  `prisma migrate dev`, appliquées en production par `prisma migrate deploy`.
  Aucune modification de schéma hors migration.
- Aucune migration n'a encore été générée : ce schéma est la cible.
- Deux variables d'environnement, à documenter dans `.env.example`
  (CLAUDE.md §12) : `DATABASE_URL` (connexion applicative, avec pooling) et
  `DATABASE_URL_MIGRATION` (connexion directe, réservée aux migrations).
- L'ORM est requêté exclusivement via l'API typée de Prisma : aucun SQL construit
  par concaténation (CLAUDE.md §4).
- Base hébergée en Union européenne, chiffrement au repos et en transit,
  sauvegardes chiffrées et restaurations testées (CLAUDE.md §2).
- Moindre privilège : le rôle applicatif ne dispose ni de `DROP`, ni de `TRUNCATE`,
  ni du droit de supprimer dans `journal_acces_documents`. La purge s'exécute sous
  un rôle distinct, dédié à cette tâche.

---

## 7. Points à trancher par le notaire

1. **Durées de conservation.** Toutes celles du §5 sont des propositions. Elles
   conditionnent l'AIPD et le registre des traitements.
2. **Chiffrement au niveau colonne.** Le chiffrement du volume protège contre le
   vol de support, pas contre un accès applicatif indu. Faut-il chiffrer en plus,
   au niveau applicatif, les colonnes directement identifiantes de `coordonnees`
   (nom, e-mail, téléphone, date de naissance) ? Cela interdirait la recherche
   par nom dans le tableau de bord : c'est un arbitrage entre confort
   d'exploitation et niveau de protection.
3. **Date de naissance.** Est-elle réellement nécessaire *avant* le rendez-vous,
   ou peut-elle être recueillie lors de l'entretien ? La minimisation plaide pour
   la seconde option.
4. **Durée du journal d'accès.** 12 mois est proposé. Une durée plus courte
   (6 mois) est plus protectrice, une durée plus longue peut être demandée par
   l'assureur ou l'auditeur de sécurité.
5. **Sort des demandes converties en dossier.** Le CRM devient-il la seule source
   après conversion, ou la plateforme conserve-t-elle un historique ? Le schéma
   permet les deux ; le choix change la durée applicable.
6. **Historique des changements de statut.** Le schéma retient aujourd'hui la
   seule date d'entrée en statut terminal (`terminee_le`). Une table
   d'historique complète (qui a changé quoi, quand) serait utile en cas de
   contestation sur un rendez-vous manqué ou annulé. À arbitrer : elle allonge la
   liste des données conservées.
7. **Analyse antivirus.** Le schéma prévoit le statut ; le prestataire ou l'outil
   retenu reste à choisir, et son intervention sur des pièces couvertes par le
   secret professionnel doit être encadrée par un contrat de sous-traitance
   (RGPD art. 28), comme les prestataires de signature et de paiement.
8. **Système CRM cible.** `systeme_cible` est un libellé libre tant que le CRM
   n'est pas arrêté. Le choix conditionne la table de correspondance des statuts
   (`src/rendez-vous/crm/correspondances.ts`).
