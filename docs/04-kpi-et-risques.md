# KPI et gestion des risques

## 1. Indicateurs clés

| KPI | Situation actuelle | Objectif | Échéance | Source |
|---|---|---|---|---|
| Réservations en ligne / semaine | 0 | 50 puis 80 | S+4 puis S+8 | Back-office |
| Clients perdus récupérés / semaine | 50 perdus | 30 récupérés (60 %) | 3 mois | Comparaison réservations |
| Taux de conversion visiteur → réservation | — | ≥ 3 % | 1 mois | Analytics |
| Appels manqués à l'accueil / jour | ≈ 20 | ≤ 10 | 1 mois | Relevé accueil |
| Taux de no-show | Non mesuré | ≤ 10 % | 1 mois | Back-office |
| Créneaux saisis dans le back-office | Cahier papier | 100 % | Semaine 11 | Audit interne |
| Délai de réponse à une demande | 24 h et plus | < 1 h (email auto) | Semaine 11 | Boîte contact |
| Disponibilité du site | — | ≥ 99,5 % | En continu | Monitorage |

### Comment on mesure

- **Analytics** installé en semaine 11 : visites, pages vues, taux de conversion, appareils.
- **Back-office** : le nombre de réservations est la source de vérité, pas le ressenti de l'accueil.
- **Relevé hebdomadaire** des appels manqués par la personne à l'accueil (une ligne par jour).
- Bilan KPI à **J+30 et J+90** après la mise en ligne, présenté à la direction.

## 2. Risques

| # | Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|---|
| 1 | Compte Stripe non validé à temps | Élevé | Moyenne | Compte ouvert en S1 ; repli « paiement à l'accueil » prêt en J4 |
| 2 | Dérive du périmètre | Élevé | Haute | MVP figé en S3 ; marge de 10 % ; semaine 12 en tampon |
| 3 | Les salariés continuent le cahier papier | Moyen | Haute | Formation S11, 2 référents internes, doc 1 page, rapport hebdo |
| 4 | Fuite de données / non-conformité RGPD | Très élevé | Faible | HTTPS, aucune carte stockée (Stripe), registre de traitement, sauvegardes quotidiennes |
| 5 | Coach absent → créneau fantôme | Moyen | Moyenne | Annulation depuis le back-office, email automatique, règle des 24 h |
| 6 | Faible trafic au lancement | Moyen | Moyenne | Budget communication 2 500 €, Google Business, posts réseaux sociaux, flyers |
| 7 | Perte d'un membre de l'équipe | Élevé | Faible | Documentation continue, chaque module a un binôme référent |

## 3. Plan de repli

Si à la fin de la **semaine 9** le parcours de réservation n'est pas fonctionnel :

1. On met en ligne uniquement la vitrine + un formulaire de demande de séance (sans paiement).
2. La réservation et le paiement basculent en semaine 12 / après le 26 mars.
3. L'objectif « 50 réservations en ligne » est repoussé de 3 semaines, le budget reste intact.

Cette décision se prend en revue de jalon, pas dans l'urgence.
