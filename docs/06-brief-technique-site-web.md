# Brief technique — site web Basic IT

Document destiné à l'équipe qui développe le site (branche `site-web`).
Il décrit **ce qu'il faut livrer**, pas comment coder.

---

## 1. Cadre

| | |
|---|---|
| Site | `basicit.fr` (nom de domaine à réserver) |
| Type | Site vitrine + réservation en ligne + back-office |
| Techno imposée | Aucune — CMS recommandé (WordPress ou équivalent) pour que les salariés soient autonomes |
| Mobile | Responsive obligatoire, pas d'application |
| Langue | Français |
| Mise en ligne | **Semaine 11 — 21 mars 2027** (gel des fonctionnalités le 7 mars) |

## 2. Pages publiques

| Page | Contenu attendu | Priorité |
|---|---|---|
| Accueil | Proposition de valeur, offres, cours du jour, CTA « Réserver » | MVP |
| Offres et tarifs | Séance à l'unité, abonnements, cartes | MVP |
| Planning | Cours par jour / coach / discipline, places restantes | MVP |
| Réservation | Tunnel en 3 étapes : créneau → coordonnées → paiement | MVP |
| Coachs | Trombinoscope, spécialités | MVP |
| Contact | Formulaire, adresse, horaires, map | MVP |
| Confirmation | Récapitulatif + email | MVP |
| Mon compte | Connexion, historique, annulation > 24 h | MVP |
| Mentions légales / RGPD / CGV | Obligatoire | MVP |
| Blog, avis clients | — | Phase 2 |

## 3. Tunnel de réservation

1. **Étape 1** — choix de la séance : date, cours, créneau, coach. Les créneaux complets sont grisés.
2. **Étape 2** — identification : email + nom, ou connexion. Pas de compte obligatoire pour une séance à l'unité si techniquement possible.
3. **Étape 3** — paiement Stripe (séance ou abonnement), puis confirmation à l'écran + email.

Règles métier :

- 1 place par email et par créneau.
- Annulation gratuite jusqu'à 24 h avant ; au-delà, la séance est due.
- Email de rappel automatique **J-1 à 18h**.
- Si un cours est annulé côté back-office, tous les inscrits reçoivent un email et la séance est remboursée ou reportée.

## 4. Back-office

| Fonction | Détail |
|---|---|
| Créneaux | Créer, modifier, annuler un cours, gérer les places |
| Réservations | Liste filtrable par date / cours / client, export CSV |
| Clients | Fiche client, historique, statut d'abonnement |
| Emails | Modèles de confirmation, rappel, annulation |
| Droits | 2 profils : administrateur (2 personnes) et salarié (18 personnes) |

Simplicité exigée : un salarié doit pouvoir créer un créneau en **moins de 60 secondes**, sans formation autre qu'une fiche d'une page.

## 5. Contraintes techniques

- **HTTPS obligatoire**, redirection HTTP → HTTPS.
- **Aucune donnée bancaire stockée** : tout passe par Stripe (checkout ou éléments hébergés).
- Base de données avec sauvegarde **quotidienne** et restauration testée avant mise en ligne.
- Temps de chargement < 3 s sur mobile en 4G.
- Formulaire de contact protégé contre le spam.
- Analytics respectueux de la vie privée (pas de cookie publicitaire sans consentement).
- Accessibilité de base : contrastes, textes alternatifs, navigation clavier.

## 6. RGPD

- Registre de traitement des données clients (nom, email, téléphone, historique de réservation).
- Durée de conservation définie (3 ans après la dernière réservation).
- Bandeau de consentement pour les cookies non essentiels.
- Page « Politique de confidentialité » et procédure de suppression de compte.

## 7. SEO et lancement

- Balises title / meta description sur toutes les pages.
- Données structurées `LocalBusiness` + `SportActivity`.
- Fiche **Google Business Profile** créée et reliée au site.
- URLs lisibles : `/reservation`, `/planning`, `/tarifs`.

## 8. Critères de recette (à valider en semaine 10)

- [ ] Réserver une séance depuis un mobile en moins de 2 minutes.
- [ ] Payer par carte de test Stripe et recevoir l'email de confirmation.
- [ ] Annuler une réservation à plus de 24 h : la place est libérée.
- [ ] Créer un créneau depuis le back-office en moins de 60 secondes.
- [ ] Exporter la liste des réservations de la semaine en CSV.
- [ ] Le site s'affiche correctement sur mobile, tablette et desktop.
- [ ] Aucune requête en HTTP, certificat valide.
- [ ] Restauration d'une sauvegarde testée avec succès.

## 9. Ce qui n'est pas demandé

Application mobile, espace coach, blog, avis clients, fidélité, cartes cadeaux, paiement en plusieurs fois, réservation multi-salles. **Tout cela relève de la phase 2 (après mars 2027).**

---

Toute demande supplémentaire doit passer par le chef de projet. Le périmètre est figé depuis le jalon J2 (24 janvier 2027).
