# Gabarits d'article — non publiés

Les fichiers de ce dossier ne sont chargés par aucune route : `loadAllArticles`
ne parcourt que les dossiers portant le nom d'une catégorie (`content.ts`), et
la garde de contenu ignore les dossiers préfixés par `_`.

Ils étaient auparavant déposés dans `content/blog/<categorie>/` et donc publiés
en trois pages indexables dont le corps se réduisait à la sentinelle
`[CONTENU À VALIDER — NE PAS PUBLIER]` — trois URL au contenu strictement
identique, servies en production.

Ils sont conservés ici comme modèles de frontmatter. Pour publier un article,
déplacer le fichier dans `content/blog/<categorie>/`, en veillant à ce que le
nom du fichier corresponde au `slug` et le dossier au champ `categorie`.
