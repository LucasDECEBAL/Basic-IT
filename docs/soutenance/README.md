# Soutenance — Basic IT

Présentation du projet au format **reveal.js 5.2.1** (HTML/JS), utilisable hors ligne, sans installation.

## Ouvrir la présentation

Double-clique sur `index.html`. C'est tout : aucune dépendance externe, tout est dans le dossier.

## Commandes

| Touche | Action |
|---|---|
| `→` / `Espace` | Slide suivante |
| `←` | Slide précédente |
| `S` | Ouvre la vue présentateur (notes + chrono) |
| `F` | Plein écran |
| `R` | Remet le chronomètre à zéro |
| `Échap` | Vue d'ensemble des slides |
| `?` | Aide |

Le chronomètre en bas à droite passe au rouge au-delà de **15 minutes** : c'est l'outil de répétition.

## Exporter en PDF (pour rendre ou imprimer)

1. Ouvre `index.html?print-pdf` dans **Chrome**.
2. `Ctrl + P` → destination « Enregistrer au format PDF ».
3. Marges : **Aucune** · Graphiques d'arrière-plan : **cochés** · Paysage.

## Contenu

13 slides, alignées sur `docs/05-soutenance.md` :

| Slide | Sujet | Temps |
|---|---|---|
| 1 | Couverture | 1 min |
| 2 | Le pitch en une phrase | — |
| 3 | Le problème chiffré | 2 min 30 |
| 4 | Le coût du problème | — |
| 5 | La solution | 2 min 30 |
| 6 | Parcours client | — |
| 7 | Démonstration | 2 min 30 |
| 8 | Back-office | — |
| 9 | Budget | 2 min |
| 10 | Planning | — |
| 11 | Risques | 1 min 30 |
| 12 | KPI | 1 min 30 |
| 13 | Conclusion | 1 min 30 |

Chaque slide contient des **notes de présentateur** (touche `S`) avec le script et les réponses aux questions probables.

## Structure

```
soutenance/
├── index.html          # la présentation
├── deck.css            # thème Basic IT (noir + vert volt)
└── reveal/             # reveal.js 5.2.1, copie locale (MIT)
    ├── LICENSE
    ├── dist/           # reveal.js, reveal.css, thème black + police
    └── plugin/         # notes (vue présentateur) et search
```

La bibliothèque est **vendorisée** : elle ne dépend pas d'un CDN, donc la présentation fonctionne même sans Wi-Fi le jour J. Seuls les fichiers réellement utilisés ont été conservés (tout le reste a été retiré pour rester sous 1 Mo).

Licence reveal.js : MIT — © Hakim El Hattab, voir `reveal/LICENSE`.
