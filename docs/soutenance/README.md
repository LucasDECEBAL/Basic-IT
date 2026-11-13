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

## Version PowerPoint

`Basic-IT-soutenance.pptx` est la même présentation au format natif PowerPoint (16:9, 292 Ko), pour les cas où seule une salle avec PowerPoint est disponible.

| Point | Détail |
|---|---|
| Format | `.pptx` 13,333 × 7,5 in (16:9) |
| Slides | 13, contenu et chiffres identiques à la version reveal.js |
| Notes | Les notes de présentateur sont dans la zone « Commentaires » de chaque slide |
| Police | Segoe UI (installée par défaut sur Windows) |
| Thème | Palette du site : fond écrue `#F7F8F5`, vert forêt `#0B2B20`, sauge `#8EA89D` |

À privilégier : la version reveal.js pour la projection, le `.pptx` si l'établissement impose PowerPoint. Les deux se mettent à jour séparément — toute modification de contenu doit être reportée dans les deux.

## Animations

Les deux supports animent l'arrivée des éléments, sans jamais masquer de contenu (une impression ou un export PDF reste complet).

**Version web** — en CSS pur, déclenché par la classe `.present` de reveal :

- titres et textes : montée de 18 px avec fondu, 0,55 s ;
- cartes, chiffres et étapes : même effet, décalé de 80 ms par élément (effet cascade) ;
- barres des étapes du parcours : croissance horizontale depuis la gauche ;
- citation du pitch : fondu simple, 0,7 s.

Les animations se rejouent à chaque retour sur une slide et se désactivent automatiquement si le système demande « réduire les animations » (`prefers-reduced-motion`).

**Version PowerPoint** — animations natives (fondu, 0,45 s, déclenchement « avec la précédente », décalage de 80 ms). Elles sont appliquées par script après génération :

```powershell
powershell -File docs/soutenance/tools/ajouter-animations.ps1 -Path docs/soutenance/Basic-IT-soutenance.pptx
```

Le script nécessite PowerPoint installé. Il supprime les animations existantes avant de les recréer, donc il est réexécutable sans risque. **Attention** : régénérer le `.pptx` depuis le générateur efface les animations, il faut relancer le script.

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

## Aperçus

Captures des 13 slides, générées en 1280×720 dans `apercus/`.

| # | Sujet | Fichier |
|---|---|---|
| 1 | Couverture | [`slide-01.png`](apercus/slide-01.png) |
| 2 | Pitch en une phrase | [`slide-02.png`](apercus/slide-02.png) |
| 3 | Problème chiffré | [`slide-03.png`](apercus/slide-03.png) |
| 4 | Coût du problème | [`slide-04.png`](apercus/slide-04.png) |
| 5 | Solution | [`slide-05.png`](apercus/slide-05.png) |
| 6 | Parcours client | [`slide-06.png`](apercus/slide-06.png) |
| 7 | Démonstration | [`slide-07.png`](apercus/slide-07.png) |
| 8 | Back-office | [`slide-08.png`](apercus/slide-08.png) |
| 9 | Budget | [`slide-09.png`](apercus/slide-09.png) |
| 10 | Planning | [`slide-10.png`](apercus/slide-10.png) |
| 11 | Risques | [`slide-11.png`](apercus/slide-11.png) |
| 12 | KPI | [`slide-12.png`](apercus/slide-12.png) |
| 13 | Conclusion | [`slide-13.png`](apercus/slide-13.png) |

Régénération (Chrome installé) :

```powershell
$base = "file:///C:/Users/lucas/Desktop/Basic%20IT/Basic-IT/docs/soutenance/index.html"
0..12 | ForEach-Object {
  $n = "{0:D2}" -f ($_ + 1)
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
    --headless=new --disable-gpu --hide-scrollbars --window-size=1280,720 `
    --screenshot="apercus\slide-$n.png" --virtual-time-budget=4000 "$base#/$_"
}
```

## Structure

```
soutenance/
├── index.html          # la présentation
├── deck.css            # thème Basic IT (écru, forêt, sauge)
├── apercus/            # captures PNG des 13 slides (1280×720)
├── tools/              # script d'animations PowerPoint
└── reveal/             # reveal.js 5.2.1, copie locale (MIT)
    ├── LICENSE
    ├── dist/           # reveal.js, reveal.css, thème black + police
    └── plugin/         # notes (vue présentateur) et search
```

La bibliothèque est **vendorisée** : elle ne dépend pas d'un CDN, donc la présentation fonctionne même sans Wi-Fi le jour J. Seuls les fichiers réellement utilisés ont été conservés (tout le reste a été retiré pour rester sous 1 Mo).

Licence reveal.js : MIT — © Hakim El Hattab, voir `reveal/LICENSE`.
