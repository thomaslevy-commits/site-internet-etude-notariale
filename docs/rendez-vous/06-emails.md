# 06 — E-mails transactionnels du parcours de rendez-vous

Ce document décrit les messages envoyés par la plateforme de prise de
rendez-vous : ce qu'ils contiennent, quand ils partent, avec quelles données,
et quelles règles de confidentialité s'y appliquent.

Fichiers concernés :

- `src/rendez-vous/emails/modeles.ts` — les sept modèles, un par message.
- `src/rendez-vous/emails/rendu.ts` — mise en page commune, échappement,
  formatage des dates, construction des liens porteurs du jeton.

Ces deux fichiers ne font que **rendre** un message. Ils n'envoient rien, ne
planifient rien et n'écrivent aucun journal : la couche d'envoi et
l'ordonnanceur sont hors périmètre et restent à écrire.

---

## 1. Inventaire

| # | Modèle | Fonction | Destinataire | Déclencheur |
|---|--------|----------|--------------|-------------|
| 1 | Confirmation | `emailConfirmation` | Demandeur | Créneau réservé — statut `rendez-vous-confirme` |
| 2 | Rappel à 48 h | `emailRappel48h` | Demandeur | T‑48 h avant le début du créneau |
| 3 | Rappel à 24 h | `emailRappel24h` | Demandeur | T‑24 h avant le début du créneau |
| 4 | Rappel à 2 h — visioconférence | `emailRappel2hVisioconference` | Demandeur | T‑2 h, **uniquement** si `format === "visioconference"` |
| 5 | Relance — pièces manquantes | `emailPiecesManquantes` | Demandeur | Pièces attendues non déposées (voir §4) |
| 6 | Copie interne | `emailCopieInterne` | Étude (`etude.email`) | Même événement que la confirmation, et à chaque changement de statut retenu par l'étude |
| 7 | Remerciement | `emailRemerciement` | Demandeur | Après l'entretien — statut `rendez-vous-realise` |

Toutes les fonctions rendent le même contrat :

```ts
interface EmailRendu { sujet: string; html: string; texte: string }
```

La version texte brut est **systématique** : un message transactionnel doit
rester lisible quand le HTML est bloqué, ou lu par une synthèse vocale.

---

## 2. Déclencheurs et cadencement

Le cadencement proposé, à arrêter avec le notaire :

| Message | Moment | Ne pas envoyer si |
|---------|--------|-------------------|
| Confirmation | immédiatement après la réservation | — |
| Rappel 48 h | T‑48 h | le créneau est à moins de 48 h à la réservation ; demande annulée |
| Rappel 24 h | T‑24 h | demande annulée |
| Rappel 2 h | T‑2 h | format autre que visioconférence ; demande annulée |
| Pièces manquantes | à T‑72 h, puis au plus une seule relance | plus aucune pièce attendue ; demande annulée |
| Copie interne | à la confirmation, à l'annulation, à la modification | — |
| Remerciement | J+1 après le créneau | rendez-vous non tenu, annulé ou sans suite |

Deux garde-fous sont posés dans le code plutôt que confiés à la vigilance de
l'ordonnanceur — ils lèvent une erreur à la construction du message :

- `emailRappel2hVisioconference` refuse un format autre que la
  visioconférence, et refuse l'absence de lien de connexion ;
- `emailPiecesManquantes` refuse une liste de pièces manquantes vide ;
- les modèles qui supposent un créneau (confirmation, rappels, remerciement)
  refusent une demande sans `debut`.

Un message erroné coûte plus cher qu'un message non parti : mieux vaut une
erreur visible en amont.

**Point ouvert :** aucune limite de fréquence globale n'est implémentée ici.
Elle relève de la couche d'envoi, qui doit garantir qu'une même demande ne
génère jamais deux messages identiques (rejeu, reprise après incident).

---

## 3. Variables attendues

### 3.1 `ContexteRendezVous` — l'entrée de tous les modèles

Les modèles ne reçoivent **jamais** un objet `Demande` complet. Ils
travaillent sur `ContexteRendezVous`, dont la composition est volontairement
limitée :

| Champ | Type | Rôle |
|-------|------|------|
| `reference` | `string` | Référence lisible (« RDV-2026-0042 ») |
| `civilite`, `prenom`, `nom` | — | Adresse d'appel |
| `motifLibelle` | `string` | Libellé public du motif — **jamais** le détail des réponses |
| `format` | `FormatRendezVous` | `etude`, `visioconference`, `telephone`, `exterieur` |
| `debut`, `fin` | `string?` (ISO 8601) | Créneau |
| `dureeMinutes` | `number` | Durée annoncée |
| `interlocuteur` | `{ nom, fonction }?` | Personne qui reçoit |
| `documentsAttendus` | `DefinitionDocument[]` | Résolus depuis `documents.ts` |
| `jeton` | `string` | Jeton opaque des liens de gestion |
| `lienVisioconference` | `string?` | Fourni par l'étude au moment de l'envoi |
| `lieuComplement` | `string?` | Précision de lieu pour le format `exterieur` |

`contexteDepuisDemande(demande, options)` construit ce contexte à partir d'une
`Demande` : c'est là que la minimisation s'opère, `reponses` et les scores
étant laissés de côté.

### 3.2 Variables supplémentaires par modèle

| Modèle | Variables supplémentaires | Origine |
|--------|---------------------------|---------|
| Pièces manquantes | `piecesManquantes: DefinitionDocument[]` | Calculé par l'appelant : attendues − fournies |
| Copie interne | `evaluation: Evaluation` | Moteur de qualification |
| | `contact: ContactDemandeur` | Coordonnées réduites (courriel, téléphone, canal préféré, langue) |
| | `statut: StatutDemande` | Parcours |
| | `piecesFournies?`, `lienFicheInterne?` | Tableau de bord interne |
| Remerciement | `prochainesEtapes?: string[]` | **Rédigées par l'étude**, jamais générées (CLAUDE.md §9) |

### 3.3 Données non variables

Toutes les coordonnées — dénomination, adresse, téléphone, courriel, horaires,
URL du site — proviennent de `src/config/etude.ts` et de `src/config/site.ts`.
Aucune n'est écrite en dur (CLAUDE.md §7). Modifier le NAP dans `etude.ts`
suffit à mettre à jour les sept modèles.

---

## 4. Liens et jeton

Les liens de gestion sont construits par `rendu.ts` à partir d'un **jeton
opaque** :

| Lien | Chemin |
|------|--------|
| Modification | `/rendez-vous/modifier/<jeton>` |
| Annulation | `/rendez-vous/annuler/<jeton>` |
| Dépôt des pièces | `/rendez-vous/pieces/<jeton>` |

Propriétés attendues du jeton, à garantir par la couche de persistance :

- **opaque** — chaîne aléatoire en base64url, 16 à 128 caractères ; le format
  est vérifié par `verifierJeton`, qui échoue plutôt que de produire un lien
  inopérant ou d'injecter un segment dans l'URL ;
- **sans donnée personnelle** — il ne doit rien encoder : ni identifiant
  déductible, ni référence, ni adresse ;
- **lié à une seule demande**, non devinable, révoqué à l'annulation ;
- **à durée de vie bornée** — une expiration alignée sur la date du rendez-vous
  (plus une marge) est recommandée.

Les pages visées doivent être en `noindex` et hors sitemap.

`urlSure` valide tout lien avant de le placer dans un `href` et n'admet que
`https:`, `http:` (préproduction locale), `mailto:` et `tel:` — un lien de
visioconférence provenant d'un prestataire ne peut donc pas introduire un
schéma exécutable.

---

## 5. Règles de confidentialité appliquées

Le secret professionnel prime (CLAUDE.md §2 et §3). Une boîte aux lettres
n'est pas un canal maîtrisé par l'étude : les décisions suivantes en découlent.

1. **Aucun contenu de dossier dans un e-mail.** Les modèles ne reçoivent ni
   `reponses`, ni pièces, ni compte rendu d'entretien. La garantie est portée
   par le type `ContexteRendezVous` lui-même, pas par la relecture.
2. **Le sujet ne révèle rien.** Il porte la date, l'heure et, pour la copie
   interne seule, la référence et le motif. Un sujet s'affiche sur un écran
   verrouillé ou dans une notification lue par un tiers : le motif
   (« Divorce », « Succession ») n'y figure jamais pour les messages client.
3. **Le motif n'apparaît que là où il est utile.** Dans la confirmation, il
   permet au demandeur de vérifier que sa demande a été comprise ; les rappels
   s'en passent (ils n'ont besoin que de la date, du lieu et de la personne).
4. **La copie interne est plus détaillée, mais reste factuelle** : niveaux
   d'urgence et de complexité, compétence retenue, intitulés des règles
   déclenchées, état des pièces, coordonnées. Elle **ne reprend pas** les
   réponses au questionnaire et renvoie au tableau de bord, où les accès sont
   journalisés. Elle porte la mention « Copie interne. Ne pas transférer. »
5. **Minimisation des coordonnées internes.** La copie interne n'affiche que
   courriel, téléphone, canal préféré et langue — ni adresse postale, ni date
   de naissance, même lorsqu'elles ont été saisies.
6. **Le lien de visioconférence est traité comme un secret d'accès** : envoyé
   au plus tard (rappel à 2 h), accompagné de la mention qu'il est personnel
   et n'a pas vocation à être transféré. La confirmation se contente d'en
   annoncer l'envoi tant qu'il n'est pas connu.
7. **Rappel « copie suffit ».** Les pièces marquées `copieUniquement` dans
   `documents.ts` portent la mention correspondante, et la relance rappelle que
   les dépôts sont des copies conservées le temps de préparer le rendez-vous.
8. **Mentions de pied** (messages client) : caractère général de
   l'information, et rappel de destination en cas d'erreur d'acheminement.
9. **Aucun pixel de suivi, aucune image distante, aucun script.** Rien ne
   permet de savoir si un message a été ouvert, et rien n'est chargé depuis un
   tiers à l'ouverture.

---

## 6. Choix de rendu HTML

Contraintes retenues pour la compatibilité messagerie :

- tableaux de mise en page, **styles exclusivement en ligne**, aucun `<style>`,
  aucune feuille externe, aucun JavaScript ;
- **aucune image** : l'en-tête est purement typographique — rien à débloquer,
  rien à charger, et le message reste identique quand les images sont coupées ;
- largeur maîtrisée à **600 px**, fluide en dessous ;
- boutons « bulletproof » (lien à `display:inline-block` dans une cellule
  colorée), **empilés** : sans média-queries, l'empilement est le seul
  comportement fiable sur téléphone ;
- messages rendus autour de **13 Ko**, loin du seuil de troncature de Gmail
  (102 Ko).

### Couleurs (CLAUDE.md §5, tokens exclusifs)

`ivory #FAF7F2` (fond) · `paper #FFFFFF` (bloc) · `night #101C2C` (titres,
bouton primaire) · `anthracite #2B2E33` (texte) · `slate-soft #5A6472`
(secondaire, pied) · `gold #A98A4C` (filet d'en-tête, filet vertical du
récapitulatif, puces) · `gold-ink #77613A` (liens, pour le contraste) ·
`line #E4DED4` (séparateurs).

L'or ne sert qu'aux filets et aux accents. **Aucun bouton doré** : le primaire
est en fond `night` texte `ivory`, le secondaire en filet 1 px `night`.

### Typographie

Les polices du site (Cormorant Garamond, Inter) ne sont pas disponibles en
messagerie et aucun webfont n'est chargé. Substituts de même nature :
`Georgia, 'Times New Roman', serif` pour les titres, pile système sans-serif
(`-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`) pour le texte.

### Dates

Toutes les dates sont formatées en français au fuseau **`Europe/Paris`**,
celui du rendez-vous : un client à l'étranger doit lire l'heure à laquelle
l'étude l'attend. La mention « (heure de Paris) » accompagne l'horaire.
Typographie française appliquée : « 14 h 30 », « 14 h » quand les minutes sont
nulles, espaces insécables.

---

## 7. Ton — application du §3

Les textes sont sobres, factuels, descriptifs. Sont proscrits et absents :
superlatifs, promesses de résultat, comparaisons, comptes à rebours, offres
limitées, formules de pression (« dernier rappel », « ne manquez pas »).

Conséquences concrètes sur la rédaction :

- la relance « pièces manquantes » **constate** une absence et précise que
  l'entretien se tient de toute façon — aucune conséquence n'est brandie ;
- les rappels rappellent, ils ne relancent pas, et proposent toujours la
  modification ou l'annulation ;
- le remerciement remercie du temps consacré, sans qualifier l'entretien.

Aucun montant n'apparaît nulle part. La seule mention de coût admise est le
renvoi à la page `/tarif`, placé dans le pied de page des messages client.

---

## 8. Points à faire valider par le notaire

1. **Cadencement** du §2, en particulier : une seule relance pour les pièces,
   remerciement à J+1, et absence de rappel à 2 h pour les rendez-vous à
   l'étude.
2. **Formules d'appel et de politesse** : l'appel retenu est « Madame Dupont, »
   / « Monsieur Dupont, », et « Madame, Monsieur, » lorsque la civilité n'est
   pas précisée. Les messages ne comportent pas de formule de politesse finale
   développée — à confirmer.
3. **Mention de pied adaptée du §3** : « Les informations figurant dans ce
   message ont un caractère général et ne constituent pas une consultation
   juridique. » — transposition, aux e-mails, de la mention prévue pour les
   pages de fond.
4. **Renvoi tarifaire** dans le pied des messages client (« Émoluments, débours
   et honoraires » vers `/tarif`) : à confirmer, y compris son maintien dans
   les rappels.
5. **Présence du motif** dans le corps de la confirmation et dans le sujet de
   la copie interne — et son absence de tout sujet adressé au client.
6. **Niveau de détail de la copie interne** : urgence, complexité et intitulés
   des règles déclenchées circulent par e-mail. Si l'étude préfère une
   notification purement neutre renvoyant au tableau de bord, la copie interne
   doit être réduite en conséquence.
7. **Adresse d'expédition et adresse de réponse** : un client peut répondre à
   ces messages (le remerciement l'y invite explicitement). Il faut décider
   quelle boîte reçoit ces réponses et comment elles sont traitées.
8. **Prochaines étapes** du message de remerciement : elles décrivent la suite
   d'un dossier, donc du contenu de fond. Elles sont fournies par l'étude ;
   faut-il constituer une bibliothèque d'étapes types validées, par motif ?
9. **Langue** : les modèles sont en français seulement, alors que l'étude
   travaille aussi en anglais et en allemand (`etude.langues`) et que la
   demande enregistre une langue préférée. Traduction à décider.
10. **Sous-traitant d'envoi** : le choix du prestataire (routage, données et
    journaux en Union européenne, contrat art. 28 RGPD) reste à arrêter, au
    même titre que les prestataires de signature et de paiement (CLAUDE.md §2).
