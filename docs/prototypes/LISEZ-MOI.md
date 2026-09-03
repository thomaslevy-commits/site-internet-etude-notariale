# Prototypes historiques — ne pas s'y référer

Ces deux pages HTML sont des maquettes antérieures à l'implémentation. Elles
ne sont ni servies, ni construites, et **leur direction artistique diverge de
celle du site** :

| | Prototypes | Site |
|---|---|---|
| Ivoire | `#F7F4EE` | `#FAF7F2` |
| Bleu nuit | `#101C33` | `#101C2C` |
| Or | `#A8894B` | `#A98A4C` |
| Serif | EB Garamond | Cormorant Garamond |
| Sans | Manrope | Inter |
| Polices | chargées depuis Google Fonts | auto-hébergées (`next/font`) |

`tailwind.config.ts` décrit la palette et les typographies effectivement
servies par le site. La règle qui en faisait la « seule source de vérité »
(CLAUDE.md §5) est abrogée par la décision du notaire du 3 septembre 2026 :
ces prototypes redeviennent des pistes exploitables, et non une charte
concurrente à écarter. Le seul point de vigilance, si une valeur en est
reprise, est de la porter dans `tailwind.config.ts` plutôt que de laisser
deux jeux de couleurs coexister dans le code.
