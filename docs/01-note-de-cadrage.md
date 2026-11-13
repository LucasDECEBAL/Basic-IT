# Note de cadrage — Basic IT

| | |
|---|---|
| **Projet** | Création du site web de Basic IT |
| **Maître d'ouvrage** | Basic IT — salle de sport et coaching, 20 salariés |
| **Équipe projet** | 4 personnes, en interne |
| **Budget** | 20 000 € maximum |
| **Durée** | 12 semaines — du lundi 4 janvier 2027 au vendredi 26 mars 2027 |
| **Version** | 1.0 |

---

## 1. Contexte

Basic IT est une salle de sport et de coaching de 20 salariés. L'entreprise n'a **aucun site web** : l'ensemble des inscriptions, des réservations de séances et des demandes d'information se fait par téléphone ou directement à l'accueil.

Résultat : l'accueil est saturé, les créneaux se remplissent mal et les prospects qui cherchent une salle en ligne ne trouvent rien.

## 2. Problème

| Symptôme | Mesure | Conséquence |
|---|---|---|
| Réservation en ligne impossible | 0 réservation web | Le client doit appeler pendant les heures d'ouverture |
| Clients qui renoncent | **50 par semaine** | ≈ 200 / mois, ≈ 2 400 / an |
| Appels manqués | ≈ 20 / jour | Leads perdus, accueil saturé |
| Visibilité | Aucune présence web | Image dégradée face aux salles concurrentes |

## 3. Coût du problème

Hypothèses à valider en semaine 1 par les entretiens clients :

- Panier moyen d'une séance : **20 €**
- 50 clients perdus / semaine × 20 € = **1 000 € / semaine**
- Soit **≈ 52 000 € de chiffre d'affaires manqué par an**

**Retour sur investissement** : un budget de 20 000 € est amorti en **moins de 5 mois** de CA récupéré.

## 4. Pitch du projet

> « Pour les sportifs qui ne pouvaient réserver qu'au téléphone, Basic IT est le site de réservation en ligne qui capte 50 clients par semaine, contrairement au standard saturé. »

## 5. Objectifs

| Objectif | Indicateur | Cible | Échéance |
|---|---|---|---|
| Rendre la réservation possible 24h/24 | Réservations en ligne / semaine | 50 puis 80 | S+4 / S+8 |
| Récupérer les clients perdus | Clients récupérés / semaine | 30 (60 %) | 3 mois |
| Désengorger l'accueil | Appels manqués / jour | −50 % | 1 mois |
| Réduire les absences | Taux de no-show | ≤ 10 % | 1 mois |
| Fiabiliser le planning | Créneaux saisis dans le back-office | 100 % | Semaine 11 |

## 6. Périmètre

### Dans le périmètre (MVP — livré le 26 mars 2027)

1. Site vitrine : accueil, offres et abonnements, planning des cours, coachs, contact.
2. Réservation d'une séance en ligne en 3 clics.
3. Paiement en ligne (Stripe) : séance à l'unité ou abonnement mensuel.
4. Espace client : historique, annulation gratuite jusqu'à 24 h avant.
5. Back-office : gestion des créneaux, liste des réservations, export CSV.
6. Emails automatiques : confirmation et rappel J-1.
7. Site responsive (consultable depuis mobile via navigateur).
8. Conformité : HTTPS, RGPD, mentions légales.

### Hors périmètre

| Élément | Décision | Raison |
|---|---|---|
| Application mobile native (iOS / Android) | **Exclu** | Coût, stores, double maintenance — un site responsive couvre le besoin |
| Programme de fidélité / parrainage | Phase 2 | Confort, pas critique |
| Cartes cadeaux, paiement en 3× | Phase 2 | Complexité financière |
| Espace coach, blog, avis clients | Phase 2 | Après stabilisation |
| Réservation par téléphone | Conservée | Canal de secours pour les clients non connectés |

## 7. Livrables

| Livrable | Responsable | Échéance |
|---|---|---|
| Note de cadrage validée | Chef de projet | J1 — 10 janvier |
| Maquettes des 8 écrans + charte | Designer | J2 — 24 janvier |
| Site vitrine en préprod | Dev front + back | J3 — 14 février |
| Parcours de réservation et paiement | Dev back | J4 — 7 mars |
| Recette validée | Chef de projet | 14 mars |
| Site en ligne + formation des 20 salariés | Chef de projet | 21 mars |
| Dossier de projet et soutenance | Toute l'équipe | J5 — 26 mars |

## 8. Équipe et rôles

| Rôle | Missions | Charge |
|---|---|---|
| Chef de projet interne | Cadrage, planning, budget, arbitrages, recette, soutenance | 8 j |
| UX/UI Designer | Personas, parcours, maquettes, charte, tests utilisateurs | 6 j |
| Développeur front | Intégration responsive, pages, tunnel de réservation | 8 j |
| Développeur back | Base de données, paiement, back-office, sauvegardes | 8 j |

**Total : 30 jours-homme** valorisés à 300 €/jour.

## 9. Gouvernance

| Rituel | Fréquence | Participants | Sortie |
|---|---|---|---|
| Point d'équipe | Lundi 9h, 30 min | Les 4 | Avancement, blocages, priorités de la semaine |
| Revue de jalon | Fin de phase | Les 4 + direction | Validation ou replanification |
| Comité de suivi | Toutes les 3 semaines | Chef de projet + direction | Budget, risques, arbitrages |

Règle d'arbitrage : **tout ce qui n'est pas dans le MVP est refusé** pendant les 12 semaines. Les demandes sont notées pour la phase 2.

## 10. Hypothèses et contraintes

- Les 4 membres de l'équipe restent disponibles environ 2,5 jours / semaine sur le projet.
- Le compte Stripe est créé dès la semaine 1 (délai de validation bancaire).
- Le planning des cours et les tarifs sont fournis par la direction en semaine 1.
- Aucun budget supplémentaire au-delà de 20 000 €.
- Pas d'application mobile, pas de refonte de l'identité visuelle.

## 11. Critères de succès du projet

Le projet est réussi si, **3 mois après la mise en ligne** :

- au moins **50 réservations par semaine** passent par le site ;
- au moins **30 des 50 clients perdus** sont récupérés chaque semaine ;
- les appels manqués à l'accueil ont **baissé de moitié** ;
- le budget de 20 000 € n'est **pas dépassé**.
