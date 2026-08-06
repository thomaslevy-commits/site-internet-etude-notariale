# Intégration CRM — architecture, branchement et exploitation

> **État au jour de rédaction : aucun CRM n'est connu.** Le notaire fournira le
> produit, le lien et les accès. Rien de rigide n'a donc été codé : la
> plateforme fonctionne de bout en bout sans CRM, et le jour du branchement se
> résume à écrire un adaptateur et à remplir une table de correspondance.

---

## 1. Principe : port et adaptateur

Le module de rendez-vous ne connaît qu'un **port** — une interface décrivant ce
dont il a besoin — et jamais un produit particulier.

```
parcours / tableau de bord
          │
          ▼
   AdaptateurCrm  ...............  le port (src/rendez-vous/crm/adaptateur.ts)
          ▲
    ┌─────┴───────────────┐
    │                     │
adaptateur-journalisant   adaptateur du CRM retenu (à écrire)
(par défaut, hors ligne)
```

Conséquences pratiques :

- le parcours client, le moteur de qualification et le tableau de bord interne
  ne changeront pas le jour du branchement ;
- un changement de CRM ultérieur coûte un fichier, pas une refonte ;
- l'intégration est testable sans accès à aucun service externe.

### Fichiers du module

| Fichier | Rôle |
| --- | --- |
| `src/rendez-vous/crm/adaptateur.ts` | Le port : opérations, charges utiles, erreurs typées, noms des variables d'environnement. |
| `src/rendez-vous/crm/correspondances.ts` | Table de correspondance configurable (champs, statuts, propriétaires) et son chargement. |
| `src/rendez-vous/crm/journal.ts` | Journal des synchronisations et politique de nouvelle tentative. |
| `src/rendez-vous/crm/adaptateur-journalisant.ts` | Implémentation de secours : journalise ce qui *serait* envoyé, n'appelle rien. |

### Opérations du port

`verifierConfiguration`, `rechercherContact`, `enregistrerContact`,
`creerDossier`, `creerOpportunite`, `attribuer`, `envoyerQualification`,
`transmettreReferencesDocuments`, `synchroniserStatut`,
`synchroniserRendezVous`.

Aucune ne lève d'exception pour un échec attendu : chacune rend un
`ResultatCrm<T>`, c'est-à-dire une valeur ou une `ErreurCrm`.

---

## 2. Secret professionnel — limite structurelle

Le CLAUDE.md §2 pose que le secret professionnel prime sur tout. Trois règles
sont donc inscrites dans le code, pas seulement dans cette page :

1. **Les pièces ne quittent pas l'étude.** Le port ne transporte que des
   `ReferenceDocument` : identifiant de catalogue, identifiant de stockage,
   type MIME, taille, empreinte SHA-256, date de dépôt. Ni contenu, ni extrait,
   ni URL téléchargeable. Le CRM sait qu'une pièce existe ; pour la consulter,
   un collaborateur se connecte à la plateforme.
2. **Aucune notification ne contient de contenu de dossier.** Les messages
   émis par la plateforme se limitent à une invitation à se connecter. Cette
   règle vaut aussi pour l'objet des événements d'agenda créés dans le CRM
   (`RendezVousEntrant.objet`) : un agenda de CRM est souvent largement
   partagé, il porte donc un libellé neutre — motif et référence de demande.
3. **Le journal ne contient que des métadonnées.** Opération, référence de
   demande, code d'erreur, nombre de champs, identifiants de questions et de
   pièces. Jamais une valeur saisie, jamais un nom, jamais une adresse.
   `resumerReponses` (journal.ts) est l'unique porte d'entrée pour décrire des
   réponses, et elle ne laisse passer que les clés.

La transmission des **réponses de qualification** au CRM est possible mais non
automatique : elle suppose que la table `champsQualification` ait été remplie
question par question. Une question absente de la table n'est pas transmise —
la position par défaut est de ne rien remonter.

---

## 3. Ce qu'il faudra demander au notaire

À poser en une seule fois, dès que le CRM sera choisi.

### 3.1 Identification et accès

- Nom exact du produit, éditeur, version ou édition souscrite.
- URL de l'instance (`CRM_URL_BASE`) et existence d'un **environnement de
  test** distinct de la production — indispensable : la première mise au point
  ne se fait pas sur des fiches réelles.
- Interlocuteur technique côté éditeur ou intégrateur, et son délai de réponse.

### 3.2 Type d'API

- REST, SOAP, GraphQL, ou dépôt de fichiers ? Documentation publique ou sur
  demande ?
- Format des charges utiles (JSON, XML) et encodage des dates (ISO 8601 ?
  fuseau ?).
- L'API accepte-t-elle une **clé d'idempotence** ? Sans elle, une nouvelle
  tentative après un délai réseau crée un doublon ; il faudra alors une clé
  fonctionnelle (la référence de demande, stockée dans un champ dédié).
- Le CRM sait-il émettre des **webhooks** vers la plateforme ? Cela déterminera
  si la synchronisation est à sens unique ou dans les deux sens (voir §7).

### 3.3 Mode d'authentification

- Jeton statique, OAuth 2.0 `client_credentials`, OAuth utilisateur, mTLS,
  clé d'API par utilisateur ?
- Durée de validité des jetons, procédure de renouvellement, procédure de
  révocation en cas d'incident.
- Le compte de service doit être **dédié à la plateforme**, nominatif, avec les
  droits strictement nécessaires (moindre privilège, CLAUDE.md §2) — jamais le
  compte personnel d'un collaborateur.

### 3.4 Schéma des champs

- Liste des objets (contact, dossier/affaire, opportunité, activité, événement)
  et de leurs champs, avec pour chacun : nom technique, type, obligation,
  longueur maximale.
- Listes de valeurs fermées : statuts, motifs, formats de rendez-vous. Il faut
  les valeurs **techniques**, pas les libellés affichés.
- Identifiants des utilisateurs CRM correspondant aux professionnels de
  l'étude (`professionnels.ts` : `notaire-titulaire`, `notaire-assistant`,
  `clerc-immobilier`).
- Champs personnalisés que l'étude souhaite alimenter, et lesquels elle
  préfère **ne pas** alimenter (le port n'oblige à rien).

### 3.5 Limites de débit et volumétrie

- Nombre d'appels autorisés par minute, par heure, par jour.
- Comportement en cas de dépassement : code de statut, en-tête `Retry-After`,
  blocage temporaire du compte ?
- Existence d'appels par lot, qui éviteraient de multiplier les requêtes.

### 3.6 Conformité — préalable, pas formalité

- **Localisation de l'hébergement** du CRM. Un CRM hors Union européenne
  suppose un examen des transferts (CLAUDE.md §2) avant toute transmission de
  donnée personnelle.
- Contrat de sous-traitance RGPD (art. 28) signé et vérifié.
- Durée de conservation côté CRM et procédure de suppression, cohérentes avec
  la politique de rétention de l'étude.
- Inscription du CRM au registre des traitements et à l'AIPD.

---

## 4. Variables d'environnement

Aucun secret n'est écrit dans le code. Les noms sont figés dans
`VARIABLES_ENVIRONNEMENT_CRM` (adaptateur.ts) et à reporter dans `.env.example`
le jour du branchement. **Aucune n'est préfixée `NEXT_PUBLIC_`** : un jeton
exposé au navigateur serait un incident de sécurité.

| Variable | Rôle |
| --- | --- |
| `CRM_FOURNISSEUR` | Identifiant de l'adaptateur à activer. Absent ou `journal` → adaptateur de secours. |
| `CRM_URL_BASE` | Racine de l'API, sans barre oblique finale. |
| `CRM_JETON_API` | Jeton, pour les CRM à authentification statique. |
| `CRM_CLIENT_ID` / `CRM_CLIENT_SECRET` | Identifiants OAuth 2.0. |
| `CRM_ESPACE` | Identifiant d'organisation ou de compte, si le CRM en exige un. |
| `CRM_CORRESPONDANCES_JSON` | Table de correspondance au format JSON (voir §5). |

---

## 5. Table de correspondance

`correspondances.ts` est une **donnée**, pas de la logique. Elle est livrée
complète en structure et vide en valeurs : chaque case vaut la marque
`À REMPLIR`, volontairement invalide. Un nom de champ plausible mais faux se
découvre en production ; une marque `À REMPLIR` se découvre au premier
contrôle.

Trois familles :

1. **Champs** — `champsContact`, `champsDossier`, `champsQualification`
   (cette dernière est ouverte : une ligne par question à remonter).
2. **Valeurs** — `statuts`, `motifs`, `competences`, `formats`, `urgences`,
   `complexites`.
3. **Personnes** — `proprietaires` (professionnel de l'étude → utilisateur
   propriétaire côté CRM) et `proprietaireParDefaut`.

### Modifier la table sans toucher au code

Renseigner `CRM_CORRESPONDANCES_JSON` avec une surcharge partielle ; elle est
validée puis fusionnée avec la table par défaut :

```json
{
  "version": "2026-09-01",
  "crm": { "identifiant": "exemple-crm", "libelle": "CRM de l'étude" },
  "champsContact": {
    "email": { "champ": "À REMPLIR", "obligatoire": true },
    "telephone": { "champ": "À REMPLIR" }
  },
  "statuts": { "rendez-vous-confirme": "À REMPLIR" },
  "proprietaires": { "notaire-titulaire": "À REMPLIR" }
}
```

- Les sections inconnues sont **refusées** (faute de frappe visible
  immédiatement) ; les clés inconnues à l'intérieur d'une section fermée sont
  ignorées et **signalées** dans `clesInconnues`.
- `cheminsIncomplets()` liste ce qui reste à remplir ; `verifierConfiguration()`
  le remonte au tableau de bord interne.
- Les fonctions de résolution (`resoudreStatut`, `resoudreProprietaire`…)
  rendent `undefined` plutôt qu'une marque `À REMPLIR` : rien n'est transmis à
  moitié.

---

## 6. Ajouter un adaptateur

1. **Créer** `src/rendez-vous/crm/adaptateur-<nom>.ts` exportant une fabrique
   `creerAdaptateur<Nom>(options)` qui rend un `AdaptateurCrm`. Ne pas modifier
   le port pour un besoin propre à un produit : si le port doit évoluer, c'est
   qu'un besoin *métier* a changé.
2. **Lire les accès** depuis les variables d'environnement, côté serveur
   uniquement, et jamais à l'import du module (une valeur absente ne doit pas
   faire échouer le build).
3. **Traduire les erreurs** avec `erreurCrm()` et, pour les API REST,
   `codeDepuisStatutHttp()`. Ne jamais inventer la nature d'une erreur : elle
   se déduit du code via `NATURE_PAR_CODE`. Respecter l'en-tête `Retry-After`
   en le reportant dans `attendreMs`.
4. **Résoudre les correspondances** avant l'appel. Une correspondance absente
   donne une erreur `correspondance-manquante` (définitive) : mieux vaut ne
   rien écrire qu'écrire au mauvais endroit.
5. **Poser la clé d'idempotence** fournie dans `OptionsAppel`
   (`cleIdempotence(reference, operation)`) sur toute opération d'écriture.
6. **Journaliser** chaque tentative via `journal.ts`, sans donnée de dossier.
7. **Déclarer** l'adaptateur dans le point d'entrée de sélection, activé par
   `CRM_FOURNISSEUR`, l'adaptateur journalisant restant le repli.
8. **Vérifier** : `npm run typecheck`, `npm run lint`, puis une passe complète
   sur l'environnement de test du CRM avant toute écriture en production, et
   revue de sécurité du sous-lot (CLAUDE.md §10).

---

## 7. Gestion des doublons

L'étude ne veut ni fiches en double, ni fusion hasardeuse de deux clients
distincts. La règle retenue est prudente et se décide **en amont** de
l'adaptateur, jamais à l'intérieur :

1. Recherche par **e-mail** (comparaison insensible à la casse, après
   normalisation). Une correspondance unique → la fiche est mise à jour.
2. À défaut, recherche par **téléphone** normalisé au format E.164. Une
   correspondance unique → mise à jour.
3. **Plusieurs correspondances** ou correspondances contradictoires entre les
   deux critères → aucune écriture automatique. Une nouvelle fiche est créée et
   marquée « doublon possible » pour arbitrage humain. Deux personnes d'un même
   foyer partagent souvent une adresse ou une ligne : la machine ne tranche
   pas.
4. **Aucune fusion automatique de fiches**, jamais. Une fusion supprime de
   l'information ; elle relève de l'étude.
5. Une fiche existante n'est jamais **écrasée** : les champs vides côté demande
   ne remplacent pas des champs renseignés côté CRM.
6. La référence de demande (`RDV-AAAA-NNNN`) est écrite dans un champ dédié :
   elle permet de rapprocher fiche et demande sans dépendre du nom.

Le champ `ResultatRechercheContact.critere` conserve la trace du critère
appliqué, ce qui rend une décision de rapprochement explicable a posteriori.

---

## 8. Traitement des échecs

### 8.1 Un échec CRM n'interrompt jamais le parcours

La prise de rendez-vous est confirmée au demandeur dès qu'elle est enregistrée
côté plateforme. La synchronisation CRM est un traitement **postérieur** : sa
défaillance produit une entrée de journal et une alerte interne, pas un message
d'erreur au client.

### 8.2 Deux natures d'erreur

- **Transitoire** — `reseau`, `delai-depasse`, `limite-de-debit`,
  `service-indisponible`, `conflit`. Réessayée automatiquement.
- **Définitive** — `non-configure`, `authentification`, `autorisation`,
  `validation`, `introuvable`, `correspondance-manquante`,
  `reponse-illisible`, `inconnue`. Aucune reprise automatique : réessayer
  n'y changerait rien et masquerait le problème.

La table `NATURE_PAR_CODE` est explicite pour que la frontière reste lisible.

### 8.3 Temporisation exponentielle plafonnée

`delaiAvantNouvelleTentative()` applique la politique par défaut : 5 essais,
délai initial 1 s, facteur 2, plafond 60 s, gigue ±20 %.

- Le **plafond** évite qu'une panne longue produise des attentes absurdes.
- La **gigue** désynchronise les reprises : sans elle, toutes les demandes
  bloquées par une indisponibilité repartiraient à la même seconde et
  reproduiraient la panne.
- Un `Retry-After` renvoyé par le CRM l'emporte toujours s'il est plus long.
- La fonction est pure : l'aléa est injecté, donc la politique est
  reproductible en test et rejouable lors d'une analyse d'incident.
  `planifierTentatives()` et `dureeTotaleAvantAbandon()` permettent de montrer
  au notaire combien de temps une panne peut rester invisible.

### 8.4 Après épuisement des essais

L'entrée passe en `echec-definitif`. `synthetiser()` en dresse la liste
(`aReprendre`) pour le tableau de bord interne, où l'étude relance l'opération
manuellement. Les écritures étant idempotentes (clé d'idempotence, ou référence
de demande à défaut), une relance ne crée pas de doublon.

### 8.5 Ordre des opérations

Les opérations sont dépendantes : contact → dossier → opportunité →
attribution → qualification → références de pièces → statut → rendez-vous. Si
une étape échoue définitivement, les suivantes ne sont pas tentées — elles
manqueraient de référence — et la reprise repart de l'étape fautive.

---

## 9. Points ouverts

À trancher avec le notaire au moment du branchement :

- Le CRM doit-il recevoir le **détail** des réponses de qualification, ou
  seulement la synthèse (`motifsDeclenches`, urgence, complexité) ?
- Synchronisation à sens unique (plateforme → CRM) ou dans les deux sens ? Un
  rendez-vous déplacé directement dans le CRM doit-il redescendre dans la
  plateforme ?
- Qui est propriétaire d'une fiche tant que le professionnel n'est pas
  désigné (`proprietaireParDefaut`) ?
- Que faire d'une demande restée « sans suite » : suppression côté CRM,
  archivage, ou conservation jusqu'à la purge prévue par la politique de
  rétention ?
