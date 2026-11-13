# Basic IT

Site responsive de salle de sport et coaching, avec réservation sans compte et espace salarié. Application fonctionnelle locale avec base SQLite persistante. **Mode démonstration : aucun paiement réel, aucun e-mail envoyé.** Utiliser uniquement des coordonnées fictives.

## Lancer le site

Prérequis : **Node.js 24 ou supérieur**, qui inclut `node:sqlite`.

```powershell
npm start
```

Ouvrir **http://127.0.0.1:3000**. Les modules d’exécution sont natifs : `npm install` n’est pas nécessaire pour lancer le site. Le message expérimental de SQLite peut apparaître selon la version de Node utilisée.

Pour redémarrer automatiquement le serveur après une modification : `npm run dev`.

Les séances sont créées relativement à la date d’exécution, en heure de Paris. Les dates futures manquantes sont complétées au redémarrage sans effacer les réservations. Les données sont conservées dans `data/basic-it.sqlite`, exclu de Git. Pour repartir de zéro, arrêter le serveur et déplacer le dossier `data` dans une sauvegarde, puis relancer.

Configuration facultative : copier `.env.example` vers `.env`, puis adapter `HOST`, `PORT` et `DB_PATH`. Garder le serveur lié à `127.0.0.1` pour les essais locaux. Les variables de prestataire figurent seulement comme connexions à effectuer : les remplir ne branche pas automatiquement un paiement ou un service e-mail.

## Accès salariés de démonstration

Page : **http://127.0.0.1:3000/#/salaries**.

| Profil | E-mail | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@basic-it.test` | `DemoSport2027!` |
| Accueil | `accueil@basic-it.test` | `DemoSport2027!` |
| Coach, Alex Martin | `coach@basic-it.test` | `DemoSport2027!` |

Les contrôles d’accès sont effectués côté serveur. Les identifiants connus ci-dessus restent réservés au test ; cette installation ne doit pas recevoir de données clients réelles.

## Ce qui fonctionne

- Pages publiques, offres, fiches, planning filtrable et 26 à 28 séances sur les quatorze prochains jours.
- Réservation, retenue de place, résultats de paiement simulés, confirmation, lien personnel et calendrier.
- Stock partagé entre site et accueil, contrôles transactionnels, idempotence et expiration des tentatives.
- Annulation à 24 heures et remboursement simulé, avec distinction réservation/paiement.
- Trois profils salariés, gestion du planning et des comptes, réservations accueil, présences, recherche et CSV.
- Formulaire de contact enregistré, paramètres et tableau de bord calculé sur les données de démonstration.

Les paiements, remboursements et e-mails externes ne sont pas connectés. Carnets et coaching individuel sont sur demande. Les mentions juridiques et coordonnées sont à compléter avant publication. Le site n’est pas déclaré prêt pour la production.

## Vérifications

```powershell
npm test
# Pour les tests navigateur uniquement :
npm ci
npx playwright install chromium
npm run test:browser
```

Les tests API utilisent une base temporaire et vérifient aussi les accès non autorisés, la concurrence sur la dernière place et deux redémarrages. Les tests navigateur lancent un serveur isolé sur le port 4173 ; ils ne modifient pas la base de votre aperçu.

Rapport de recette : [docs/VERIFICATIONS.md](docs/VERIFICATIONS.md).

Aperçus enregistrés : [accueil ordinateur](docs/apercus/accueil-desktop.png), [accueil mobile](docs/apercus/accueil-mobile.png), [paiement mobile](docs/apercus/paiement-mobile.png), [espace salarié](docs/apercus/espace-salarie.png).

La [documentation de livraison](docs/LIVRAISON.md) détaille l’architecture, les données fictives, les fonctionnalités, les simulations, les étapes avant production, le cadrage des douze semaines et le **parcours de soutenance de deux minutes**.
