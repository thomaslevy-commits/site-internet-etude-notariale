# 05 — Déploiement et variables d'environnement

**Objet.** Recenser les paramètres de configuration nécessaires à la plateforme de rendez-vous, décrire la mise en place de l'hébergement, de la base de données, du stockage des pièces et de l'envoi d'e-mails, et fixer la procédure de vérification après déploiement.

**Statut.** Document de préparation. Aucune des ressources décrites ici n'existe à ce jour, et aucune variable listée ne figure dans `.env.example` — ce fichier ne contient que les trois variables du site vitrine. **Ce document ne modifie rien** : il propose une nomenclature et une marche à suivre, à valider avant toute création de ressource.

**Rappel liminaire.** Rien de ce qui suit ne doit être mis en œuvre avec de vraies données avant que les exigences du document `04-conformite-et-securite.md` soient satisfaites. Créer une base de données est facile ; faire signer un contrat de sous-traitance l'est moins, et c'est pourtant l'ordre inverse qui s'impose.

---

## 1. Ce qui existe déjà

Trois variables sont documentées dans `.env.example` pour le site vitrine :

| Variable | Rôle | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_BOOKING_URL` | Adresse de l'outil externe de prise de rendez-vous. Utilisée par `src/components/cta-rdv.tsx` ; si elle est vide, le bouton renvoie vers `/contact`. | Non |
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | Adresse recevant les envois du formulaire de contact. | Non |
| `NEXT_PUBLIC_SITE_URL` | Adresse canonique, pour le flux RSS, le plan de site et les données structurées. Par défaut `src/config/site.ts`. | Non |

Le fichier `vercel.json` fixe déjà la région d'exécution (`cdg1`, Paris), les en-têtes de sécurité et la politique de sécurité de contenu. Ces réglages seront à revoir, et le §3.4 dit précisément où.

**Le préfixe `NEXT_PUBLIC_` a une conséquence qu'il faut avoir en tête** : toute variable ainsi préfixée est incorporée dans le code envoyé au navigateur et donc **lisible par n'importe quel visiteur**. Aucun secret ne doit jamais porter ce préfixe. Dans la liste qui suit, les variables préfixées sont, sans exception, des valeurs publiques.

---

## 2. Variables nécessaires à la plateforme

**Proposition de nomenclature.** Les noms suivent une convention simple : préfixe par domaine fonctionnel, majuscules, tirets bas. Les valeurs d'exemple sont neutres et fictives ; aucune ne doit être reprise telle quelle.

### 2.1 Base de données

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `DATABASE_URL` | Adresse de connexion à la base PostgreSQL. Contient un mot de passe : secret. | Oui | `postgresql://app_rdv:MOT_DE_PASSE@db.exemple-eu.net:5432/rdv?sslmode=require` |
| `DATABASE_URL_DIRECT` | Connexion directe, sans intermédiaire de mutualisation, requise par certains outils de migration. | Selon le prestataire | `postgresql://app_rdv:MOT_DE_PASSE@db-direct.exemple-eu.net:5432/rdv?sslmode=require` |

`sslmode=require` n'est pas facultatif : il impose le chiffrement de la connexion entre l'application et la base (document 04, §2.2).

### 2.2 Application et sessions

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `RDV_BASE_URL` | Adresse publique de la plateforme, sans barre oblique finale. Sert à construire les liens des e-mails et les retours d'authentification. | Oui | `https://rendez-vous.exemple-etude.fr` |
| `RDV_MODE_INTEGRATION` | Mode retenu : `page`, `sous-domaine` ou `embarque`. Conditionne les en-têtes autorisant ou non l'affichage en cadre. | Oui | `sous-domaine` |
| `AUTH_SECRET` | Clé servant à signer les sessions et les jetons. Valeur aléatoire d'au moins 32 octets. **Secret. Une valeur différente par environnement.** | Oui | `<chaîne aléatoire de 32 octets, encodée en base64>` |
| `AUTH_URL` | Adresse de base du service d'authentification, souvent identique à `RDV_BASE_URL`. | Selon la solution retenue | `https://rendez-vous.exemple-etude.fr` |
| `SESSION_DUREE_MINUTES` | Durée d'inactivité au-delà de laquelle une session interne est fermée (document 04, §2.3). | Non (défaut applicatif) | `30` |
| `NEXT_PUBLIC_RDV_URL` | Adresse de la plateforme, utilisée **par le site vitrine** pour le bouton de prise de rendez-vous. Valeur publique. Peut remplacer `NEXT_PUBLIC_BOOKING_URL` le jour de la bascule. | Le jour de la bascule | `https://rendez-vous.exemple-etude.fr` |

### 2.3 Stockage des pièces déposées

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `STOCKAGE_ENDPOINT` | Adresse du service de stockage compatible S3. | Oui | `https://s3.eu-exemple.cloud` |
| `STOCKAGE_REGION` | Région du stockage. **Doit être en Union européenne.** | Oui | `eu-west-1` |
| `STOCKAGE_BUCKET` | Nom du conteneur recevant les pièces. Un conteneur distinct par environnement. | Oui | `etude-rdv-documents-prod` |
| `STOCKAGE_CLE_ID` | Identifiant de la clé d'accès. Secret. | Oui | `<identifiant fourni par le prestataire>` |
| `STOCKAGE_CLE_SECRETE` | Clé d'accès. **Secret.** | Oui | `<clé fournie par le prestataire>` |
| `STOCKAGE_CHIFFREMENT_CLE` | Clé de chiffrement applicatif des fichiers, si cette option est retenue (document 04, §2.2). **Secret. Sa perte rend les fichiers définitivement illisibles.** | Selon décision du notaire | `<clé de 32 octets, encodée en base64>` |
| `STOCKAGE_DUREE_LIEN_SECONDES` | Durée de validité des liens de téléchargement temporaires remis aux collaborateurs. | Non (défaut applicatif) | `120` |

Le conteneur de stockage doit être **privé sans exception** : aucun fichier accessible par une adresse devinable, aucun accès en lecture publique. Les téléchargements passent par des liens temporaires engendrés à la demande, après contrôle des droits et inscription au journal des accès.

### 2.4 Envoi d'e-mails transactionnels

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `EMAIL_API_CLE` | Clé d'accès au service d'envoi. **Secret.** | Oui | `<clé fournie par le prestataire>` |
| `EMAIL_ENDPOINT` | Adresse du service, lorsqu'il propose plusieurs régions. **Choisir la région européenne.** | Selon le prestataire | `https://api.eu.exemple-mail.net` |
| `EMAIL_EXPEDITEUR` | Adresse d'expédition, sur un domaine maîtrisé par l'étude. | Oui | `rendez-vous@exemple-etude.fr` |
| `EMAIL_EXPEDITEUR_NOM` | Nom affiché de l'expéditeur. | Non | `Étude notariale` |
| `EMAIL_REPONSE_A` | Adresse de réponse, si elle diffère de l'expéditeur. | Non | `contact@exemple-etude.fr` |
| `EMAIL_NOTIFICATION_ETUDE` | Boîte interne recevant les alertes de nouvelle demande. Peut contenir plusieurs adresses séparées par des virgules. | Oui | `rdv-interne@exemple-etude.fr` |
| `EMAIL_ACTIF` | Interrupteur général. À `false` en préproduction pour empêcher tout envoi réel. | Oui | `false` |

`EMAIL_ACTIF` n'est pas un confort. C'est ce qui empêche qu'un essai de préproduction envoie un message à une vraie personne.

### 2.5 Calendrier (différé)

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `CALENDRIER_ACTIF` | Active la synchronisation. À `false` tant que le prestataire n'est pas choisi et contractualisé. | Oui | `false` |
| `CALENDRIER_FOURNISSEUR` | Identifiant du service retenu. | Si actif | `<à définir>` |
| `CALENDRIER_CLIENT_ID` | Identifiant de l'application déclarée auprès du service. | Si actif | `<fourni par le prestataire>` |
| `CALENDRIER_CLIENT_SECRET` | Secret associé. **Secret.** | Si actif | `<fourni par le prestataire>` |

### 2.6 CRM (différé)

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `CRM_ACTIF` | Active l'export vers l'outil de l'étude. `false` par défaut. | Oui | `false` |
| `CRM_ENDPOINT` | Adresse du service. | Si actif | `https://crm.exemple-etude.fr/api` |
| `CRM_CLE` | Clé d'accès. **Secret.** | Si actif | `<clé fournie par l'éditeur>` |

### 2.7 Exploitation

| Variable | Rôle | Obligatoire | Exemple neutre |
|---|---|---|---|
| `LIMITE_DEBIT_ACTIVE` | Active la limitation du nombre de requêtes par visiteur (§4 du cahier des charges). | Oui | `true` |
| `LIMITE_DEBIT_STOCKAGE_URL` | Adresse du service de comptage partagé entre instances, si l'hébergement en exécute plusieurs. Sans lui, la limitation est approximative. | Recommandé | `rediss://utilisateur:MOT_DE_PASSE@cache.exemple-eu.net:6379` |
| `RETENTION_BROUILLON_JOURS` | Durée de vie d'un brouillon non converti (document 04, §2.6). | Oui | `7` |
| `RETENTION_DOCUMENTS_JOURS` | Durée de conservation d'une pièce déposée après clôture de la demande. | Oui | `30` |
| `RETENTION_JOURNAL_MOIS` | Durée de conservation du journal des accès aux documents. | Oui | `36` |
| `PURGE_JETON` | Secret protégeant le déclenchement de la tâche de purge planifiée. **Secret.** | Oui | `<chaîne aléatoire de 32 octets>` |
| `NIVEAU_JOURNAL` | Verbosité des journaux techniques. | Non | `info` |
| `ANTIVIRUS_ENDPOINT` | Adresse du service d'analyse des fichiers déposés. | Recommandé | `https://analyse.exemple-eu.net` |
| `ANTIVIRUS_CLE` | Clé d'accès associée. **Secret.** | Si actif | `<clé fournie par le prestataire>` |

Les trois variables `RETENTION_*` **ne sont pas des paramètres techniques** : elles portent des décisions du notaire (document 04, §2.6). Leurs valeurs d'exemple ci-dessus sont des ordres de grandeur, pas des propositions arrêtées.

### 2.8 Récapitulatif des secrets

Ne doivent jamais figurer dans le dépôt de code, jamais être préfixés `NEXT_PUBLIC_`, et doivent être distincts entre production et préproduction :

`DATABASE_URL`, `DATABASE_URL_DIRECT`, `AUTH_SECRET`, `STOCKAGE_CLE_ID`, `STOCKAGE_CLE_SECRETE`, `STOCKAGE_CHIFFREMENT_CLE`, `EMAIL_API_CLE`, `CALENDRIER_CLIENT_SECRET`, `CRM_CLE`, `LIMITE_DEBIT_STOCKAGE_URL`, `PURGE_JETON`, `ANTIVIRUS_CLE`.

Une procédure de rotation doit être écrite : qui change la clé, à quelle fréquence, et que faire en cas de suspicion de divulgation. Sans procédure écrite, une clé n'est jamais changée.

---

## 3. Déploiement sur Vercel, région `cdg1`

### 3.1 Ce que `cdg1` recouvre, et ce qu'il ne recouvre pas

Le fichier `vercel.json` fixe `"regions": ["cdg1"]`, ce qui détermine le lieu d'exécution des fonctions serveur — Paris. **Cela ne garantit pas à soi seul que toutes les données restent en Union européenne.** Trois vérifications restent à faire, et elles relèvent du contrat autant que de la configuration :

1. **Les journaux** de la plateforme d'hébergement : lieu de conservation et durée, à faire confirmer par écrit (document 04, §2.1).
2. **Les fonctions d'exécution périphérique** (« edge »), qui s'exécutent au plus près du visiteur, donc potentiellement hors d'Europe. La plateforme doit s'exécuter en environnement Node classique. Aucun traitement de donnée personnelle ne doit être placé dans une fonction périphérique ou dans le fichier `middleware.ts`.
3. **Les services annexes** activés sur le projet (mesure d'audience, analyse de performance). Le site utilise déjà `@vercel/speed-insights` ; il faut vérifier ce que ce service transmet et où il le conserve avant de l'appliquer aux pages de la plateforme, et l'en exclure au moindre doute.

### 3.2 Organisation des projets et des environnements

**Deux projets si le mode « sous-domaine » est retenu** (document 01, §4) : le site vitrine d'un côté, la plateforme de l'autre, avec des variables, des droits et des journaux séparés. C'est l'intérêt principal de ce mode.

**Trois environnements, avec une règle stricte :**

| Environnement | Base de données | Stockage | E-mails | Données |
|---|---|---|---|---|
| Production | Base de production | Conteneur de production | `EMAIL_ACTIF=true` | Réelles |
| Préproduction | Base **distincte** | Conteneur **distinct** | `EMAIL_ACTIF=false` | **Fictives uniquement** |
| Local | Base locale | Conteneur local ou distinct | `EMAIL_ACTIF=false` | **Fictives uniquement** |

**Aucune donnée réelle en préproduction ni en local. Aucune exception.** Une copie de la base de production sur un poste de développement est une communication de données à un tiers, et le fait qu'elle soit involontaire ne change rien.

Vercel crée automatiquement un déploiement pour chaque proposition de modification. Ces déploiements sont accessibles par une adresse difficile à deviner, mais **publiquement accessibles**. Deux conséquences : ils ne doivent jamais pointer vers la base de production, et ils doivent être protégés par le mécanisme de protection d'accès du prestataire dès lors que la plateforme est en construction.

### 3.3 Enregistrement des variables

1. Enregistrer chaque variable dans la configuration du projet, en distinguant explicitement production, préproduction et local. Une variable enregistrée « pour tous les environnements » est une erreur classique, et elle fait fuiter les identifiants de production dans chaque déploiement d'essai.
2. Ne jamais placer un secret dans une variable préfixée `NEXT_PUBLIC_`.
3. Ne jamais faire figurer un secret dans `vercel.json` ou dans `next.config.ts` : ces fichiers sont versionnés.
4. Mettre à jour `.env.example` avec les **noms** et une description de chaque variable, sans aucune valeur réelle (§12 du cahier des charges). Cette mise à jour interviendra au moment de la construction, pas avant.
5. Vérifier qu'un `.env.local` n'est jamais versionné.

### 3.4 En-têtes de sécurité à revoir

Le `vercel.json` actuel a été écrit pour un site vitrine sans base ni appel externe. Quatre points devront être repris pour la plateforme, et chacun est un point de vigilance :

- **`connect-src 'self'`** interdit tout appel du navigateur vers un autre domaine. Les appels vers le stockage de fichiers ou tout service externe devront être ajoutés explicitement, domaine par domaine. Sans cela, l'échec est **silencieux pour le visiteur** — le fichier ne part pas, et rien ne l'indique. Ce comportement est déjà signalé dans `.env.example` pour le formulaire de contact.
- **`frame-ancestors 'none'` et `X-Frame-Options: DENY`** interdisent l'affichage dans un cadre. En mode « module embarqué », il faudrait les relâcher au profit du seul domaine du site. Une protection relâchée doit être justifiée par écrit.
- **`script-src` avec `'unsafe-inline'`** est une tolérance acceptable pour un site statique, nettement moins pour une application traitant des données personnelles. Le passage à une politique par valeur unique par déploiement (« nonce ») est à prévoir.
- **`img-src 'self' data: https:`** autorise le chargement d'images depuis n'importe quelle adresse sécurisée. À restreindre sur les pages de la plateforme.

Ajouter en outre, pour toutes les adresses de la plateforme : `X-Robots-Tag: noindex, nofollow`, et l'exclusion de ces adresses de `src/app/sitemap.ts` et de `robots.ts` (§6 du cahier des charges).

---

## 4. Préparation de la base PostgreSQL en Union européenne

### 4.1 Choix du prestataire

Plusieurs familles d'offres répondent au critère de localisation, sans qu'aucune ne s'impose :

- **Offres gérées d'éditeurs spécialisés** proposant des régions européennes (Paris, Francfort, Amsterdam, Dublin). Mise en service rapide, sauvegardes intégrées ; vérifier la localisation des sauvegardes et des journaux, et la nationalité de l'éditeur.
- **Fournisseurs d'infrastructure établis en Europe** — Scaleway, OVHcloud, Clever Cloud, Infomaniak et équivalents. Argument de souveraineté plus fort ; exploitation parfois plus manuelle.
- **Grands fournisseurs d'infrastructure avec régions européennes.** Techniquement très solides ; la question de la soumission à un droit non européen doit être posée et documentée dans l'analyse d'impact.

**Le choix appartient au notaire et doit être écrit** (§2 du cahier des charges). Les critères à comparer : région exacte, localisation des sauvegardes, localisation des journaux, contrat de sous-traitance conforme à l'article 28 du RGPD, sous-traitants ultérieurs, engagement de notification en cas de violation, sort des données en fin de contrat, chiffrement au repos, journalisation des accès administrateurs.

### 4.2 Mise en place

1. Créer la base dans une région d'Union européenne, et **vérifier la région après création** plutôt que la supposer.
2. Créer un compte applicatif distinct du compte administrateur, avec les seuls droits nécessaires. Ne jamais faire fonctionner l'application avec le compte administrateur.
3. Imposer le chiffrement de la connexion (`sslmode=require`).
4. Activer le chiffrement au repos.
5. Restreindre les accès réseau autant que le prestataire le permet.
6. Créer une base distincte pour la préproduction, avec ses propres identifiants.
7. Activer les sauvegardes automatiques, vérifier qu'elles sont chiffrées et conservées en Union européenne, et **noter la date de la première restauration d'essai** (document 04, §2.8).
8. Appliquer les migrations versionnées. Aucune modification manuelle du schéma en production : une modification non versionnée est invisible pour l'équipe suivante.

### 4.3 Contrainte à ne pas oublier dans le schéma

La prévention des doubles réservations repose en dernier ressort sur une contrainte au niveau de la base — l'interdiction de deux rendez-vous se chevauchant pour un même professionnel (document 01, §8). Un contrôle applicatif seul ne suffit pas. Cette contrainte doit figurer dans la première migration, pas être ajoutée après le premier incident.

---

## 5. Stockage des pièces déposées

### 5.1 Choix du prestataire

Deux familles d'options :

- **Stockage compatible S3 chez un fournisseur européen** (Scaleway, OVHcloud, Infomaniak et équivalents). Contrôle explicite de la région ; interface d'usage standard.
- **Stockage intégré à la plateforme d'hébergement.** Plus simple à mettre en œuvre ; **la région effective de conservation doit être vérifiée et inscrite au contrat** avant tout usage. Ne pas la supposer.

Là encore, **le choix appartient au notaire, par écrit.**

### 5.2 Configuration exigée

1. Conteneur **privé**, sans aucun accès en lecture publique. À vérifier explicitement après création, en tentant d'accéder à un fichier sans autorisation.
2. Chiffrement au repos activé.
3. Conteneurs distincts pour la production et la préproduction.
4. Règle de suppression automatique en cohérence avec `RETENTION_DOCUMENTS_JOURS`, doublée d'une purge applicative — les deux mécanismes se contrôlent l'un l'autre.
5. Versionnement des objets **désactivé**, ou expiration des versions antérieures alignée sur la politique de purge. Un versionnement actif conserve indéfiniment les fichiers supprimés, ce qui vide la politique de purge de son effet.
6. Journalisation des accès au conteneur, conservée en Union européenne.
7. Téléchargements par liens temporaires de courte durée uniquement, engendrés après contrôle des droits et inscrits au journal des accès.
8. Contrôles au dépôt, côté serveur et non côté navigateur : type réel du fichier et non type déclaré, taille (10 Mo, selon `documents.ts`), extension parmi `.pdf, .jpg, .jpeg, .png, .docx`, nom de fichier régénéré, analyse antivirus avant toute mise à disposition.

---

## 6. Service d'e-mails transactionnels

### 6.1 Choix du prestataire

Le critère éliminatoire est le traitement et la journalisation en Union européenne. Plusieurs services proposent des offres ou des régions européennes — des éditeurs français et européens, ainsi que des offres européennes de fournisseurs d'infrastructure. **Aucun n'est retenu à ce jour ; la comparaison et le choix relèvent du notaire, par écrit.**

Points à comparer : région de traitement et de conservation des journaux d'envoi, durée de conservation du contenu des messages sur les serveurs du prestataire, contrat de sous-traitance conforme à l'article 28, taux de remise, prise en charge de l'authentification du domaine expéditeur, possibilité de désactiver le suivi des ouvertures et des clics.

**Le suivi des ouvertures et des clics doit être désactivé.** Il consiste à insérer une image invisible et à réécrire les liens pour savoir qui ouvre quoi et quand. Sur un message de rendez-vous notarial, c'est une collecte sans finalité légitime pour l'étude, et elle transmet au prestataire des informations sur le comportement du client.

### 6.2 Mise en place

1. Authentifier le domaine expéditeur — enregistrements SPF, DKIM et DMARC. Sans cela, les messages arrivent en indésirables, et le premier rendez-vous manqué sera imputé à la plateforme.
2. Vérifier que l'adresse d'expédition appartient à un domaine maîtrisé par l'étude.
3. Désactiver le suivi des ouvertures et des clics.
4. Rédiger les modèles conformément au document 04, §2.10 : aucun contenu de dossier, objets neutres.
5. Prévoir le traitement des échecs de remise : une confirmation qui n'arrive pas doit être visible dans le tableau de bord interne, et non se perdre silencieusement.
6. En préproduction, `EMAIL_ACTIF=false` et aucune adresse réelle dans les jeux d'essai.

---

## 7. Procédure de vérification après déploiement

À exécuter intégralement à chaque déploiement en production, et à consigner. Une vérification non consignée n'a pas eu lieu.

### 7.1 Avant l'ouverture au public

| # | Vérification | Résultat attendu |
|---|---|---|
| 1 | Région d'exécution des fonctions | `cdg1` confirmé dans la console d'hébergement |
| 2 | Région de la base de données | Union européenne, vérifiée dans la console du prestataire |
| 3 | Région du stockage de fichiers | Union européenne, vérifiée dans la console du prestataire |
| 4 | Région du service d'e-mails | Union européenne, confirmée par écrit |
| 5 | Localisation et durée des journaux d'hébergement | Confirmées par écrit |
| 6 | Connexion à la base | Chiffrée ; connexion non chiffrée refusée |
| 7 | Accès direct à un fichier du conteneur sans autorisation | Refusé |
| 8 | Aucun secret côté navigateur | Recherche des valeurs sensibles dans le code envoyé au navigateur : aucun résultat |
| 9 | En-têtes de sécurité | Présents sur les adresses de la plateforme, valeurs conformes au §3.4 |
| 10 | `X-Robots-Tag: noindex` sur les pages de la plateforme | Présent |
| 11 | Plan de site et `robots.txt` | Aucune adresse de la plateforme |
| 12 | Accès au tableau de bord interne sans authentification | Refusé |
| 13 | Accès à la demande d'un autre en modifiant un identifiant dans l'adresse | Refusé |
| 14 | Double réservation simultanée du même créneau | Une seule confirmée, l'autre informée proprement |
| 15 | Double envoi de la confirmation | Un seul rendez-vous, une seule référence, un seul e-mail |
| 16 | Dépôt d'un fichier de type non autorisé, et d'un fichier renommé pour masquer son type | Refusé dans les deux cas |
| 17 | Dépôt d'un fichier au-delà de 10 Mo | Refusé |
| 18 | Journal des accès aux documents | Une entrée nominative par dépôt et par consultation |
| 19 | Contenu et objet des e-mails | Aucun contenu de dossier, objet neutre |
| 20 | Sauvegarde de la base | Effectuée, chiffrée, en Union européenne |
| 21 | Restauration d'essai | Réalisée avec succès, durée mesurée et consignée |
| 22 | Tâche de purge | Exécutée sur données fictives, compte rendu produit |
| 23 | Limitation de débit sur les points d'entrée publics | Active et efficace |
| 24 | Motifs non validés | Orientation vers la demande de rappel, aucune question inventée |
| 25 | Recette du §10 sur les pages de la plateforme | Lighthouse, Core Web Vitals, accessibilité RGAA/WCAG AA, `tsc --noEmit`, lint |
| 26 | Relecture déontologique (§3) de chaque texte affiché | Aucun superlatif, aucune promesse, aucune sollicitation |
| 27 | Rapport d'audit de sécurité et contre-vérification des corrections | Disponibles |
| 28 | AIPD, registre des traitements, contrats article 28, validations écrites du notaire | Disponibles |

Les lignes 27 et 28 ne sont pas des formalités de clôture : ce sont des conditions d'ouverture posées par le §2 du cahier des charges. **Si l'une des vingt-huit lignes n'est pas satisfaite, l'ouverture au public est reportée.**

### 7.2 Après chaque déploiement ultérieur

Vérification allégée : lignes 9, 10, 12, 13, 19 et 25 ; parcours complet sur un dossier fictif jusqu'à la confirmation ; contrôle qu'aucune donnée personnelle n'apparaît dans les journaux techniques ; contrôle des variables d'environnement modifiées.

### 7.3 Surveillance courante

- Revue périodique du journal des accès aux documents (fréquence à fixer par le notaire).
- Contrôle mensuel de l'exécution effective de la purge.
- Restauration d'essai à intervalle fixé, consignée.
- Surveillance des échecs de remise d'e-mails.
- Suivi de l'échéance des certificats et des clés, avec alerte avant expiration.
- Revue des comptes internes au départ ou au changement de fonction d'un collaborateur. Cette revue doit être inscrite à la procédure de départ de l'étude, sans quoi elle n'aura jamais lieu.

---

*Documents liés : `01-architecture.md` (modes d'intégration, flux de données), `04-conformite-et-securite.md` (exigences préalables et décisions du notaire).*
