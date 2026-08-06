# 04 — Conformité et sécurité

**Objet.** Énoncer ce qui doit être réglé **avant** toute mise en production de la plateforme de prise de rendez-vous, et signaler honnêtement les points sur lesquels le travail engagé entre en tension avec le cahier des charges.

**Avertissement.** Ce document ne sert pas à rassurer. Il sert à décider. Il est écrit en partant du §2 du `CLAUDE.md`, dont les exigences de sécurité sont qualifiées de **non négociables**, et il constate quand elles ne sont pas satisfaites.

**En un mot.** Aucune des exigences du §2 n'est aujourd'hui satisfaite, pour une raison simple : rien de ce qui les concerne n'est encore construit. Ce qui existe est le cœur métier — motifs, questions, moteur d'évaluation, catalogue de pièces, règles d'affectation et de créneaux — auquel s'ajoutent une ébauche d'interface, un schéma de base de données cible et des modèles d'e-mails. Mais il n'y a **aucune base de données créée, aucune migration, aucune authentification, aucun stockage de fichiers, aucune journalisation des accès, aucun envoi d'e-mail possible**, et aucune des dépendances correspondantes n'est installée. La plateforme n'est donc pas en état d'être mise en ligne, et ce document décrit le chemin qui reste.

---

## 1. Position de la plateforme dans le cahier des charges

Avant toute considération technique, un constat de méthode.

Le §11 du `CLAUDE.md` fixe un plan de travail en six phases, à suivre **dans l'ordre, sans anticiper**. Les phases 1 à 5 concernent le site vitrine ; la phase 6, l'espace client, ne commence qu'**après la mise en ligne du site vitrine**, en sous-lots ordonnés : modèle de données et infrastructure → authentification (MFA) → dossiers et suivi → dépôt de documents chiffrés → signature électronique → paiement.

Une plateforme qui recueille des coordonnées, des données de situation familiale et patrimoniale, et des copies de pièces déposées par les clients relève de cette phase 6. Elle en relève même doublement : par la nature des données et par les exigences qui s'y attachent.

**Conséquence** : le travail en cours anticipe sur l'ordre fixé par le notaire. Ce n'est pas nécessairement une faute — travailler la modélisation métier en amont a du sens, et le cœur qui est écrit est précisément la partie qui dépend le moins de l'infrastructure. Mais cela doit être dit, et cela impose une règle : **rien de ce parcours ne peut être mis en ligne, même en test avec de vraies personnes, avant que les phases 1 à 5 soient achevées et que les exigences ci-dessous soient satisfaites.** Une préproduction accessible publiquement avec de vraies données est une mise en production, quel que soit le nom qu'on lui donne.

---

## 2. Exigences préalables à toute mise en production

Chaque exigence reprend le §2 du cahier des charges. La colonne « état » décrit la situation au jour de rédaction, sans complaisance.

### 2.1 Hébergement, données et journaux en Union européenne

**Exigé.** Hébergement, base de données, stockage de fichiers **et journaux** exclusivement en Union européenne.

**État : partiellement préparé pour le site vitrine, non traité pour la plateforme.** Le fichier `vercel.json` fixe bien `"regions": ["cdg1"]` (Paris), ce qui détermine où s'exécutent les fonctions. Cela ne dit rien de trois autres endroits où des données circulent :

- **Les journaux de la plateforme d'hébergement.** L'exécution en région parisienne n'implique pas que les journaux techniques, les métriques et les traces soient conservés en Union européenne. Ce point doit être vérifié contractuellement, pas supposé.
- **La base de données.** Elle n'existe pas encore. Sa région sera un critère de choix éliminatoire.
- **Le stockage des pièces déposées.** Idem.

**À faire :**

1. Obtenir du prestataire d'hébergement une confirmation écrite du lieu de conservation des journaux et de la durée pendant laquelle ils y sont conservés.
2. Choisir une base PostgreSQL dont la région est en Union européenne, et le vérifier après création (le document 05 décrit comment).
3. Choisir un stockage de fichiers en Union européenne.
4. Vérifier que le service d'envoi d'e-mails traite et journalise en Union européenne — c'est le point le plus souvent négligé, car les e-mails contiennent au minimum une adresse et un nom.
5. Pour chaque prestataire, documenter les éventuels transferts hors Union européenne (support technique, filiales, sous-traitants ultérieurs) et les garanties associées.

**Point d'attention.** « Serveur en Europe » et « entreprise soumise au seul droit européen » sont deux choses différentes. Un prestataire de droit non européen peut héberger en Europe tout en étant soumis à des injonctions de communication de son droit d'origine. Ce n'est pas un obstacle absolu, mais c'est un élément d'appréciation que le notaire doit avoir en main, et à faire figurer dans l'analyse d'impact.

### 2.2 Chiffrement en transit et au repos

**Exigé.** Chiffrement en transit et au repos.

**État : le transit est couvert pour le site vitrine, le repos n'est pas traité.** Le `vercel.json` impose HTTPS strict (`Strict-Transport-Security` avec `preload`), ce qui couvre le trajet entre le navigateur et le serveur.

**À faire :**

1. **Transit** : imposer TLS sur la connexion à la base (`sslmode=require` au minimum) et sur tout appel à un prestataire. Vérifier qu'aucune retombée en clair n'est possible.
2. **Repos, base de données** : activer le chiffrement du volume. C'est le minimum. Il protège contre le vol d'un disque, pas contre un accès applicatif compromis.
3. **Repos, fichiers déposés** : chiffrement côté serveur au minimum. Un chiffrement applicatif supplémentaire — les fichiers sont chiffrés par la plateforme avant d'être remis au stockage — offre une protection réelle si le stockage lui-même est compromis. Il a un coût : la gestion des clés devient critique, et une clé perdue signifie des fichiers définitivement illisibles. **Ce choix appartient au notaire**, au vu du niveau de sensibilité qu'il attache aux pièces déposées.
4. **Secrets** : aucune clé, aucun mot de passe dans le dépôt de code (§12). Les secrets vivent dans la configuration du service d'hébergement, avec une rotation documentée.
5. **Sauvegardes** : le chiffrement des sauvegardes est traité au §2.8 ; il n'est pas acquis du seul fait que la base est chiffrée.

### 2.3 Authentification forte

**Exigé.** Authentification forte (MFA) pour les clients comme pour les collaborateurs ; sessions courtes ; moindre privilège ; aucun compte partagé.

**État : rien.** Aucune bibliothèque d'authentification n'est présente dans `package.json`. Le tableau de bord interne n'existe pas, et l'ébauche de parcours client ne comporte à ce jour aucun contrôle d'accès.

**Côté collaborateurs — non négociable, sans exception :**

1. Authentification forte à deux facteurs pour tout accès au tableau de bord interne. Le second facteur peut être une application d'authentification ou une clé physique ; le SMS est déconseillé.
2. Un compte nominatif par personne. **Aucun compte partagé, aucun compte « accueil » ou « secrétariat ».** Sans nominativité, la journalisation des accès aux documents (§2.4) ne vaut rien : un journal qui indique qu'« un collaborateur » a consulté une pièce n'établit rien.
3. Sessions courtes, avec déconnexion automatique après inactivité. Une durée de l'ordre de trente minutes est un point de départ à valider par le notaire ; une session qui reste ouverte toute la journée sur un poste d'accueil est un risque.
4. Moindre privilège : distinguer au minimum la consultation des demandes, l'accès aux pièces déposées, l'administration des professionnels et créneaux, et l'export des données. Tout le monde n'a pas besoin de tout.
5. Journalisation des connexions, des échecs de connexion et des changements de droits.

**Côté clients — un arbitrage est nécessaire, et il n'a pas été rendu.**

Le §2 impose l'authentification forte pour les clients de l'espace client. Or un parcours de prise de rendez-vous en neuf étapes qui exigerait la création d'un compte avec double facteur **avant** de pouvoir demander un rendez-vous se heurterait à un taux d'abandon considérable, et l'objectif de conversion du §1 en pâtirait.

Trois options, à trancher par le notaire :

- **(a) Parcours anonyme jusqu'à la confirmation, sans compte.** Le visiteur remplit, dépose ses pièces, confirme. Aucun accès ultérieur en ligne : pour modifier ou annuler, il appelle l'étude. C'est l'option la plus simple et la plus sûre — il n'y a pas de compte à protéger. Elle interdit la reprise du parcours sur un autre appareil et la consultation en ligne de la demande.
- **(b) Parcours anonyme, puis compte pour le suivi.** Le rendez-vous se prend sans compte ; la consultation ultérieure du dossier suppose la création d'un compte avec authentification forte. Le dépôt des pièces peut être reporté après création du compte, ce qui est plus protecteur.
- **(c) Compte obligatoire dès le départ.** La lecture la plus stricte du §2. La plus protectrice, la plus dissuasive.

**Recommandation technique** : (b), en reportant le dépôt des pièces après création du compte pour les motifs qui en réclament. Elle respecte l'esprit du §2 — les documents sont derrière une authentification forte — sans faire d'un formulaire de rendez-vous une barrière. **La décision revient au notaire, et elle doit être écrite**, car elle détermine l'architecture du parcours.

Un point ne se négocie pas, quelle que soit l'option : **un lien envoyé par e-mail n'est pas une authentification.** Si un lien de reprise ou de consultation est mis en place, il doit être à usage unique, de très courte durée de vie, et ne jamais donner accès aux pièces déposées.

### 2.4 Journalisation des accès aux documents

**Exigé.** Journalisation des accès aux documents.

**État : rien.**

**À faire.** Chaque dépôt, chaque consultation, chaque téléchargement, chaque suppression d'une pièce doit produire une entrée comportant : date et heure, identité nominative de l'auteur, identifiant de la pièce, référence de la demande, nature de l'opération, adresse d'origine de la connexion.

Trois propriétés sont indispensables :

- **Non modifiable** : le journal ne s'édite pas et ne se supprime pas depuis l'application. Un journal modifiable ne prouve rien.
- **Consultable** : un collaborateur habilité doit pouvoir répondre à « qui a vu cette pièce ? » sans intervention technique. C'est ce qui permet de traiter une demande d'accès d'une personne concernée ou un soupçon d'accès indu.
- **Conservé selon une durée écrite**, puis purgé. Un journal conservé indéfiniment est lui-même un traitement de données à justifier.

**À décider par le notaire** : la durée de conservation du journal des accès, et la fréquence de sa revue.

### 2.5 Analyse d'impact (AIPD) et registre des traitements

**Exigé.** AIPD réalisée et registre des traitements mis à jour **avant** la mise en production.

**État : non engagée, à la connaissance de la présente rédaction.**

**Pourquoi une AIPD est ici difficilement évitable.** Le traitement cumule plusieurs facteurs qui, pris ensemble, appellent une analyse d'impact : collecte à grande échelle de données relatives à la situation familiale et patrimoniale de personnes ; croisement de ces données avec des pièces justificatives ; personnes en situation de vulnérabilité possible (successions, divorces) ; données couvertes par le secret professionnel ; et, selon la configuration retenue, un score d'urgence et de complexité calculé automatiquement qui oriente le traitement de la demande.

Ce dernier point mérite une précision. Le moteur de qualification **ne prend pas de décision produisant des effets juridiques** : il ne refuse rien, ne conseille rien, ne fixe aucun droit. Il classe un dossier pour l'étude — durée, interlocuteur pressenti, pièces à réunir, ordre de traitement — et l'étude reste libre de tout modifier. Cette limite est structurelle dans le code, et elle doit être maintenue, décrite dans l'AIPD, et vérifiée à chaque évolution des règles. Le jour où un score déciderait seul qu'une demande est classée sans suite, l'analyse changerait de nature.

**À faire :**

1. Inscrire le traitement « prise de rendez-vous en ligne » au registre : finalité, base légale, catégories de données, catégories de personnes, destinataires, sous-traitants, durées de conservation, mesures de sécurité.
2. Conduire l'AIPD, avec le délégué à la protection des données si l'étude en a désigné un, ou avec un conseil extérieur.
3. Rédiger l'information des personnes propre à la plateforme — la politique de confidentialité du site vitrine ne la couvre pas : elle a été écrite pour un site sans base de données.
4. Prévoir la procédure d'exercice des droits (accès, rectification, effacement, limitation) et son articulation avec les obligations de conservation propres à l'activité notariale. Cette articulation n'est pas triviale et relève du notaire, pas de la technique.
5. Déterminer la base légale de chaque finalité, en distinguant la prise de rendez-vous elle-même du dépôt de pièces.

**Le point le plus important de cette section** : l'AIPD n'est pas une formalité de fin de chantier. Ses conclusions peuvent imposer des choix d'architecture — durée de conservation, chiffrement applicatif, obligation de compte pour déposer une pièce. La conduire **avant** de construire le parcours coûte beaucoup moins cher que de la conduire après.

### 2.6 Politique de rétention et de purge

**Exigé.** Politique de rétention et de purge des documents écrite et appliquée.

**État : évoquée dans le code, non écrite, non appliquée.** Le fichier `src/rendez-vous/documents.ts` mentionne une « durée de conservation courte » et renvoie au présent document. Cette durée n'est fixée nulle part, et aucun mécanisme de purge n'existe.

**À écrire, poste par poste.** Le tableau ci-dessous est une **proposition de départ**, pas une décision. Chaque ligne doit être arbitrée par le notaire.

| Donnée | Proposition | Remarque |
|---|---|---|
| Brouillon abandonné avant saisie des coordonnées | Quelques jours | Ne contient rien d'identifiant |
| Brouillon abandonné après saisie des coordonnées | Quelques jours, avec purge des pièces déposées | Le plus sensible : des pièces peuvent y être attachées |
| Pièces déposées, demande sans suite | Suppression rapide après clôture | La finalité a disparu |
| Pièces déposées, rendez-vous réalisé | Suppression après reprise dans le dossier de l'étude | La plateforme n'est pas un lieu de conservation |
| Demande convertie en dossier | Purge de la plateforme après reprise ; le dossier vit dans les outils de l'étude | Statut `converti-en-dossier` |
| Coordonnées, demande sans rendez-vous | Durée courte, à fixer | Prospect non converti |
| Journal des accès aux documents | Durée à fixer, plus longue que les données elles-mêmes | Sa raison d'être est de survivre à l'accès |
| Journaux techniques | Durée courte | Vérifier ce que le prestataire d'hébergement conserve de son côté |

**Trois règles de mise en œuvre :**

- La purge doit être **automatique**. Une purge manuelle n'est pas exécutée.
- La purge doit être **vérifiable** : un compte rendu périodique indiquant ce qui a été supprimé et quand. Une politique annoncée mais non exécutée est plus grave qu'une absence de politique, car elle rend inexacte la déclaration au registre.
- La suppression doit être **effective**, y compris dans les sauvegardes. Une donnée supprimée de la base mais présente dans une sauvegarde conservée un an n'est pas supprimée. Le traitement des sauvegardes dans la politique de purge doit être écrit explicitement.

### 2.7 Audit de sécurité ou test d'intrusion

**Exigé.** Audit de sécurité (ou test d'intrusion) avant ouverture au public.

**État : prématuré — il n'existe aucun système déployé à auditer.**

**À faire, dans cet ordre :**

1. Revue de sécurité interne de chaque sous-lot avant fusion, comme le prévoit le §10 : authentification, contrôle d'accès, chiffrement, journalisation.
2. Audit externe portant au minimum sur : contrôle d'accès aux demandes et aux pièces (peut-on lire la demande d'un autre en changeant un identifiant dans l'adresse ?), robustesse de l'authentification, traitement des fichiers déposés (type réel, contenu actif, taille, nom), limitation de débit sur les points d'entrée publics, exposition de données dans les réponses techniques, configuration des en-têtes de sécurité.
3. Correction des constats, puis **contre-vérification**. Un audit dont les constats ne sont pas revérifiés ne conclut rien.
4. Conservation du rapport et du compte rendu de correction : ce sont des pièces de l'AIPD.

**Point de vigilance particulier.** Le dépôt de fichiers est la fonctionnalité la plus exposée de toute la plateforme. Analyse antivirus systématique, contrôle du type réel du fichier et non du type déclaré, nom de fichier régénéré, service de fichiers depuis une origine qui n'exécute rien, aucun affichage direct d'un fichier reçu dans le contexte du site. Ce point doit être explicitement au périmètre de l'audit.

### 2.8 Sauvegardes chiffrées et testées

**Exigé.** Sauvegardes chiffrées, testées par des restaurations régulières.

**État : rien, faute de données à sauvegarder.**

**À faire :**

1. Sauvegarde automatique de la base et du stockage de fichiers, à une fréquence en rapport avec la perte de données acceptable — cette dernière est une décision du notaire, pas un paramètre technique.
2. Sauvegardes **chiffrées** et conservées en Union européenne, dans un emplacement distinct de la production.
3. **Restaurations d'essai régulières**, tracées, avec mesure du temps de remise en service. C'est l'exigence la plus souvent négligée. Une sauvegarde jamais restaurée est une hypothèse, pas une sauvegarde.
4. Durée de conservation des sauvegardes **cohérente avec la politique de purge** (§2.6). Une sauvegarde conservée un an fait vivre un an les données qu'on croyait supprimées.
5. Contrôle des accès aux sauvegardes : elles contiennent tout, elles sont donc au moins aussi sensibles que la production.

### 2.9 Contrats de sous-traitance RGPD et validation écrite du notaire

**Exigé.** Prestataires : choix soumis à validation écrite du notaire, contrats de sous-traitance RGPD (art. 28) vérifiés.

**État : aucun prestataire choisi, aucun contrat.**

**Prestataires à qualifier** : hébergement et exécution, base de données, stockage de fichiers, envoi d'e-mails transactionnels, éventuellement calendrier, éventuellement CRM, éventuellement antivirus, éventuellement supervision.

**Pour chacun, avant tout usage avec de vraies données :**

1. Contrat de sous-traitance conforme à l'article 28 du RGPD, signé.
2. Localisation des traitements et des journaux, en Union européenne, écrite au contrat.
3. Liste des sous-traitants ultérieurs et procédure d'information en cas de changement.
4. Engagements de sécurité : chiffrement, contrôle d'accès, notification de violation et délai.
5. Sort des données en fin de contrat : restitution, suppression, délai.
6. **Validation écrite du notaire**, conservée. Le §2 l'exige expressément.

**Règle intermédiaire.** Aucun prestataire ne doit être branché sur de vraies données avant que ces six points soient réglés. Un essai « juste pour voir si ça marche » avec les coordonnées d'un vrai client est un transfert de données à un sous-traitant non contractualisé.

### 2.10 Secret professionnel dans les notifications

**Exigé.** Les e-mails et notifications ne contiennent jamais le contenu d'un dossier, seulement une invitation à se connecter.

**État : modèles écrits, aucun envoi possible.** Des modèles d'e-mails existent dans `src/rendez-vous/emails/`, mais aucun service d'envoi n'est configuré. Chaque modèle, chaque objet de message et chaque libellé d'événement de calendrier doit être relu au regard de la règle ci-dessous et validé par le notaire avant le premier envoi réel.

**À faire :**

1. Modèles d'e-mails limités à : référence de la demande, date, heure, format ou lieu, interlocuteur, et invitation à joindre l'étude ou à se connecter. **Jamais** le motif détaillé, les réponses aux questions, la liste des pièces, ni un score d'urgence ou de complexité.
2. **Objets d'e-mails neutres.** Un objet est visible sur un écran verrouillé, dans un aperçu, sur la montre du destinataire. « Votre rendez-vous du 12 mars — référence RDV-2026-0042 » convient ; toute mention du motif ne convient pas. C'est le point le plus facile à manquer.
3. Même règle pour les événements de calendrier (§8 du document 01) : un calendrier professionnel est souvent partagé plus largement qu'on ne le croit.
4. Même règle pour les alertes internes et les éventuelles notifications d'exploitation.
5. Aucune donnée personnelle dans les messages de journal technique. Une adresse électronique dans un message d'erreur est une fuite, d'autant plus durable qu'elle est conservée par le prestataire d'hébergement.
6. Vérification de cette règle **à chaque ajout ou modification d'un modèle d'e-mail**, inscrite à la recette du §10.

---

## 3. Points de conflit avec le cahier des charges

Trois tensions réelles entre ce qui est demandé et ce qui est écrit. Elles sont exposées ici parce qu'elles appellent une décision, pas parce qu'elles se résolvent d'elles-mêmes.

### 3.1 Le §2 exclut toute conservation en ligne d'actes authentiques, et le parcours prévoit le dépôt de pièces

**Le texte.** Le §2 exclut « toute conservation en ligne d'actes authentiques : le minutier reste dans les systèmes agréés de la profession ».

**Le fait.** Le parcours prévoit, à l'étape 5, le dépôt de pièces. Le catalogue `documents.ts` comprend des pièces qui sont ou peuvent être des actes authentiques ou des copies d'actes : titre de propriété, actes de donations antérieures, promesse ou compromis lorsqu'il a été reçu en la forme authentique. Le motif « succession » comporte une question sur l'existence d'un testament, et un testament déposé par un héritier est le cas le plus délicat que puisse rencontrer cette plateforme.

**La limite retenue, et il faut qu'elle soit tenue en pratique et pas seulement écrite :**

1. **Copies uniquement.** La plateforme reçoit des copies transmises par le demandeur — des fichiers, des photographies, des numérisations. Elle ne reçoit jamais d'original, ne se substitue à aucun dépôt, ne produit aucun effet de conservation. Le champ `copieUniquement` du catalogue existe pour que ce rappel soit affiché au demandeur au moment du dépôt ; il doit effectivement l'être, dans un libellé clair et non dans une mention en petits caractères.
2. **Finalité strictement limitée à la préparation du rendez-vous.** Les pièces servent à ce que le professionnel arrive préparé. Elles ne servent ni de preuve, ni d'archive, ni de version de référence.
3. **Conservation courte, et purge effective.** Les pièces sont supprimées dès qu'elles ont été reprises dans le dossier tenu par l'étude, ou dès que la demande est close sans suite, selon les durées à arrêter au §2.6. La plateforme n'est **pas** un lieu de conservation, et ne doit jamais devenir le seul endroit où se trouve une pièce.
4. **Aucun acte authentique électronique.** La plateforme ne reçoit, ne produit et n'affiche aucun acte authentique électronique. Elle ne comporte aucune fonction qui pourrait le laisser croire, conformément à la position déjà prise au §2 sur la signature électronique.
5. **Le testament, cas particulier.** Aucun dépôt de testament n'est **demandé** par le système : le catalogue ne comporte pas de pièce « testament », et la règle correspondante se contente d'augmenter la complexité du dossier. Mais un demandeur peut en déposer une copie de sa propre initiative, sous un autre intitulé. Deux mesures s'imposent : un rappel explicite à l'étape 5 indiquant que le dépôt porte sur des copies et que les originaux se remettent en main propre à l'étude ; et une consigne interne de traitement rapide et de suppression des pièces de cette nature.

**Ce qui reste ouvert.** Cette limite est cohérente avec le §2 tant que la purge est réellement automatique et réellement effective, sauvegardes comprises. Si le notaire estime que le risque demeure trop élevé, une position plus stricte est parfaitement défendable : restreindre le dépôt aux seules pièces d'identité et justificatifs administratifs à l'étape 5, et renvoyer tout le reste à l'espace client authentifié de la phase 2, voire au rendez-vous lui-même. **C'est une décision du notaire, et elle est structurante** : elle change la valeur du parcours pour l'étude, puisque c'est le dépôt anticipé des pièces qui fait gagner du temps au premier rendez-vous.

### 3.2 Cette plateforme relève de la phase 6, et la phase 6 n'a pas commencé

Le point est exposé au §1 du présent document. Il n'est pas répété ici, mais il ne doit pas être perdu de vue : il ne s'agit pas d'un détail d'ordonnancement.

Trois conséquences pratiques :

- **Aucune mise en ligne, même partielle, même « en test », avant l'achèvement des phases 1 à 5** et la satisfaction des exigences du §2. Une adresse de préproduction publiquement accessible avec de vraies données est une mise en production.
- **L'ordre des sous-lots du §11 doit être respecté** : modèle de données et infrastructure d'abord, authentification ensuite, dépôt de documents seulement après. Construire le parcours client avant l'authentification conduirait à devoir le reprendre entièrement.
- **La variable `NEXT_PUBLIC_BOOKING_URL` continue de pointer vers l'outil externe** jusqu'à décision contraire du notaire. Le lien de prise de rendez-vous du site vitrine ne bascule vers la plateforme qu'au terme de tout ce qui précède.

### 3.3 Le §9 interdit de rédiger du contenu juridique : huit motifs sur douze restent sans questions

**Le texte.** Le §9 est sans ambiguïté : « Ne jamais rédiger de contenu juridique de fond. » Les textes sont fournis par le notaire.

**Le fait.** Douze motifs sont déclarés. Quatre seulement — achat immobilier, vente immobilière, succession, donation — portent des questions issues des indications du notaire et sont marqués `etatContenu: "validé"`. Les huit autres — contrat de mariage, PACS, divorce ou séparation, entreprise, procuration, conseil patrimonial, question générale, autre — sont marqués `"à valider"` et n'ont **aucune** question.

**Pourquoi c'est un choix et non un manque.** Une question de qualification n'est pas un libellé neutre. Demander « Existe-t-il un testament ? » ou « Ce domicile se situait-il hors de France ? », c'est déjà désigner ce qui est juridiquement pertinent, et l'orientation qui en découle produit un effet concret : la durée du rendez-vous, l'interlocuteur, les pièces réclamées. Rédiger ces questions sans le notaire reviendrait à écrire du contenu juridique de fond sous une forme interrogative. La fonction `parcoursDisponible` du moteur tire les conséquences de cette limite : pour un motif non validé, le parcours **n'invente pas** un questionnaire, il propose une demande de rappel où l'étude qualifie elle-même.

**Ce que cela signifie concrètement.** Les deux tiers du catalogue affiché ne bénéficient pas de la qualification automatique. Un visiteur qui vient pour un PACS ou un contrat de mariage laisse ses coordonnées et attend un rappel. C'est correct sur le plan déontologique et honnête envers le visiteur, mais la valeur de la plateforme est très inférieure à ce qu'elle serait avec les douze motifs qualifiés.

**Ce qui est attendu du notaire, motif par motif** : la liste des questions, leur ordre, les options des questions à choix, celles qui sont obligatoires, les embranchements (« ne poser cette question que si… »), les pièces à réclamer selon les réponses, ce qui rend un dossier urgent, ce qui le rend complexe, et la compétence à laquelle il doit être affecté. Le format existe et il est réutilisable : les quatre motifs validés servent de modèle.

**Une option intermédiaire** consiste à n'afficher que les quatre motifs validés, plus une entrée « autre demande », plutôt que de présenter douze motifs dont huit conduisent à un simple rappel. C'est plus sobre et cela évite une promesse implicite non tenue. **Décision du notaire.**

---

## 4. Décisions relevant du notaire

Par ordre de dépendance : chaque décision conditionne les suivantes. Les cinq premières bloquent la construction ; les suivantes bloquent la mise en production.

1. **Confirmer l'ordonnancement.** Cette plateforme relève de la phase 6. Confirmer qu'elle est engagée, ou suspendre le travail jusqu'à l'achèvement des phases 1 à 5. *(§3.2)*
2. **Arbitrer l'authentification des clients** : parcours anonyme sans compte, compte pour le suivi seulement, ou compte obligatoire dès le départ. Cette décision détermine l'architecture du parcours et ne se rattrape pas après coup. *(§2.3)*
3. **Fixer le périmètre du dépôt de pièces** : toutes les pièces du catalogue, ou seulement les justificatifs administratifs, le reste étant renvoyé à l'espace client ou au rendez-vous. Décider aussi du sort réservé à une pièce sensible déposée spontanément. *(§3.1)*
4. **Choisir le mode d'intégration** : page dédiée, sous-domaine ou module embarqué. Choix difficilement réversible une fois le parcours construit. *(document 01, §4)*
5. **Fournir les questions des huit motifs restants**, ou décider de n'afficher que les quatre motifs validés. *(§3.3)*
6. **Décider du chiffrement applicatif des pièces déposées**, au-delà du chiffrement du stockage, en connaissance du risque de perte de clé. *(§2.2)*
7. **Fixer les durées de conservation et de purge**, poste par poste, sauvegardes comprises, et la durée de conservation du journal des accès. *(§2.4 et §2.6)*
8. **Choisir les prestataires** — hébergement, base de données, stockage, e-mails, calendrier — sur critère de localisation en Union européenne, **et les valider par écrit**. *(§2.1 et §2.9)*
9. **Faire signer les contrats de sous-traitance RGPD (art. 28)** avant tout usage avec de vraies données. *(§2.9)*
10. **Engager l'AIPD et la mise à jour du registre des traitements**, en désignant qui la conduit et sous quel délai. Ses conclusions peuvent modifier les décisions 2, 3, 6 et 7 : la conduire tôt. *(§2.5)*
11. **Arrêter la politique d'accès interne** : qui voit les demandes, qui ouvre les pièces, qui administre les créneaux, avec quel second facteur d'authentification et quelle durée de session. *(§2.3)*
12. **Décider de la règle de confirmation automatique** : quels rendez-vous sont confirmés sans intervention humaine, lesquels passent par `rendez-vous-a-valider`. *(document 01, §10)*
13. **Commander l'audit de sécurité ou le test d'intrusion**, et fixer le principe qu'aucune ouverture au public n'a lieu avant la contre-vérification des corrections. *(§2.7)*
14. **Valider la fréquence des sauvegardes, la perte de données acceptable et le rythme des restaurations d'essai.** *(§2.8)*
15. **Valider les modèles d'e-mails, leurs objets et le libellé des événements de calendrier**, au regard du secret professionnel. *(§2.10)*

---

*Documents liés : `01-architecture.md` (découpage, parcours, statuts), `05-deploiement-et-variables.md` (variables d'environnement, hébergement, vérifications après déploiement).*
