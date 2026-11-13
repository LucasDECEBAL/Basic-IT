# Recette Basic IT

Vérifications réalisées le **13 novembre 2026**, avec Node.js **25.6.0**, SQLite natif et Playwright **1.65.0** / Chromium **158** sous Windows.

## Résultat

- **16 scénarios serveur réussis**, regroupés dans un test parent, soit 17 tests rapportés par `node --test`.
- **8 scénarios navigateur réussis**, aucun échec lors de la dernière exécution.
- Vérification visuelle des captures de l’accueil sur ordinateur et mobile.
- Aucun service de paiement ni e-mail réel testé : ces connexions ne sont pas configurées et restent explicitement simulées.

## Critères du brief

| Critère | Vérification et résultat |
| --- | --- |
| Trouver une séance et réserver | Fiche → coordonnées → paiement → confirmation, réussi en navigateur |
| Prix avant paiement | Total visible sur la fiche, le formulaire, le récapitulatif et le simulateur |
| Séance complète non réservable | Bouton désactivé, tentative directe rejetée HTTP 409 |
| Refus de paiement sans confirmation | Statut annulé / refusé, stock restauré, reprise avec coordonnées conservées |
| Paiement réussi unique | Deux créations simultanées avec une même clé retournent une référence ; deux confirmations n’en créent pas d’autre |
| Places mises à jour | Retenue à la création, confirmation sans seconde décrémentation, libération au refus / abandon / expiration / annulation |
| Stock partagé accueil / site | Création à l’accueil vérifiée dans la disponibilité publique |
| Droits salariés | HTTP 401 sans session, HTTP 403 sur actions interdites ; coach limité à ses séances, export interdit au coach |
| Erreurs et saisies | Validation serveur et navigateur, scénario de paiement refusé avec conservation des coordonnées |
| Mobile et clavier | Largeur 390 px, menu, 10 pages sans débordement horizontal et coordonnées complétées au clavier jusqu’au paiement |
| Actions visibles | Pages publiques, filtres, liens, calendrier, annulation, contact côté API et écrans salariés vérifiés ; aucun lien vide détecté sur l’accueil |
| Simulations identifiées | Bandeau permanent, simulateur explicite, statuts et reçus marqués « simulation », aucun champ bancaire |
| Dernière place simultanée | Deux demandes concurrentes : une HTTP 201 et une HTTP 409, stock final à zéro |
| Persistance | Même nombre de réservations après deux redémarrages du serveur de test |
| Annulation à 24 h | Autorisée et remboursée en simulation au-delà de 24 h ; HTTP 409 en deçà |
| Calendrier | Téléchargement ICS réussi, UID stable et heures UTC |
| Séance annulée par la salle | Réservations actives annulées et paiements réussis marqués remboursés |
| Présences / recherche | Saisie accueil, recherche participant et présence sauvegardées dans le navigateur |
| Gestion administrateur | Création / modification avec confirmation, pages salariés, offres et paramètres accessibles |
| Ressources | Photos vérifiées HTTP 200, servies localement ; images chargées et polices locales sur l’accueil |

## Reproduire

```powershell
npm test
npm ci
npx playwright install chromium
npm run test:browser
```

Chaque commande utilise des données de test séparées de `data/basic-it.sqlite`. Le test navigateur réserve le port 4173. Le rapport HTML est généré dans `test-results/report/index.html` ; les traces des seuls échecs et les captures sont dans `test-results` (ignoré de Git).

Les premières exécutions ont permis de corriger le ciblage des sélecteurs et l’attente de fin d’enregistrement dans les tests. La dernière exécution complète du navigateur termine avec 8 réussites.

## Limites de recette

Test Chromium local, sans validation sur appareil physique, Safari, Firefox ni lecteur d’écran. Le clavier est vérifié sur le parcours principal ; il ne s’agit pas d’un audit exhaustif WCAG. Les essais de concurrence sont locaux et ne remplacent pas un test de charge multi-instance. Aucune certification d’accessibilité, validation juridique, validation de prestataire de paiement ou capacité de production n’est revendiquée.

L’outil d’aperçu intégré n’était pas disponible dans la session. Le rendu a été vérifié dans Chromium local et capturé ; le site se lance depuis le dépôt avec `npm start`.
