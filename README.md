# Basic IT

Salle de sport et coaching · 20 salariés · Projet : création du site web de l'entreprise

---

## Le problème

Basic IT n'a aujourd'hui **aucun site web**. Toute la réservation passe par le téléphone ou l'accueil.

| Symptôme | Mesure |
|---|---|
| Réservation impossible en ligne | 0 réservation web |
| Clients perdus chaque semaine | **50 / semaine** (≈ 200 / mois, ≈ 2 400 / an) |
| Appels manqués à l'accueil | ≈ 20 / jour |
| Image de marque | En retard sur les salles concurrentes digitalisées |

## Le projet

Créer le site web de Basic IT : vitrine, réservation en ligne, paiement et back-office pour les 20 salariés.

**100 % web — pas d'application mobile.** Le site est responsive et consultable depuis n'importe quel navigateur.

| Élément | Valeur |
|---|---|
| Budget | **20 000 € maximum** |
| Début | lundi **4 janvier 2027** |
| Fin | vendredi **26 mars 2027** (12 semaines) |
| Équipe projet | **4 personnes** en interne |
| Périmètre | MVP figé en semaine 3, le reste en phase 2 |

### Pitch en une phrase

> « Pour les sportifs qui ne pouvaient réserver qu'au téléphone, Basic IT est le site de réservation en ligne qui capte 50 clients par semaine, contrairement au standard saturé. »

## Documentation projet

| Document | Contenu |
|---|---|
| [Note de cadrage](docs/01-note-de-cadrage.md) | Contexte, problème chiffré, objectifs, périmètre, gouvernance |
| [Budget](docs/02-budget.md) | Répartition des 20 000 € et retour sur investissement |
| [Planning](docs/03-planning.md) | 12 semaines, 5 jalons, rituels de suivi |
| [KPI et risques](docs/04-kpi-et-risques.md) | Indicateurs de succès et plan de mitigation |
| [Soutenance](docs/05-soutenance.md) | Déroulé des 15 minutes, script oral, questions probables |
| [Brief technique du site](docs/06-brief-technique-site-web.md) | Spécifications pour l'équipe web |

## Rôles

| Rôle | Périmètre |
|---|---|
| Chef de projet interne | Cadrage, planning, budget, arbitrages, recette |
| UX/UI Designer | Parcours, maquettes, charte graphique |
| Développeur front | Intégration, pages, tunnel de réservation |
| Développeur back | Base de données, paiement, back-office |

## Structure du dépôt

```
Basic-IT/
├── README.md
├── docs/     # pilotage de projet et documentation
└── site/     # site web (géré par l'équipe web, branche site-web)
```

## Statut

- [x] Entreprise et problème définis
- [x] Budget et planning cadrés
- [ ] Maquettes validées (J2 — semaine 3)
- [ ] Vitrine en préprod (J3 — semaine 6)
- [ ] Parcours de réservation complet (J4 — semaine 9)
- [ ] Site en ligne (semaine 11)
- [ ] Livraison finale (J5 — 26 mars 2027)
