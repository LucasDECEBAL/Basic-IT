# Basic IT : livraison du MVP

## Périmètre livré

Application locale de démonstration pour une entreprise fictive de salle de sport et coaching de 20 salariés. La demande initiale employait un autre nom ; le nom définitif demandé est **Basic IT**.

Les interfaces, la base et les règles métier fonctionnent réellement. Les paiements, remboursements et notifications externes restent simulés. Aucun compte de prestataire ni secret de paiement ou de messagerie n’était configuré dans l’environnement.

## Architecture retenue

Un serveur Node.js 24+ avec modules natifs HTTP, crypto et SQLite, un frontend HTML/CSS/JavaScript sans framework. Aucune dépendance d’exécution à installer. Playwright est uniquement une dépendance de développement.

Cette architecture limite les coûts, les mises à jour et la complexité d’exploitation pour une seule salle. Elle nécessite un serveur Node persistant avec disque durable. Elle ne fonctionne pas sur un hébergement exclusivement statique. Les routes d’interface utilisent des fragments (`#/planning`) ; les titres changent par page mais le référencement des pages internes reste limité. Un rendu serveur pourra être ajouté lors de la préparation à la publication.

| Fichier | Responsabilité |
| --- | --- |
| `server.mjs` | Routes publiques et privées, validation, autorisations, transactions, données initiales |
| `public/app.js` | Navigation, formulaires, réservation, simulateur, espace salarié |
| `public/style.css` | Identité, responsive, focus, réduction des animations |
| `public/assets` | Photographies, polices et icône servies localement |
| `data/basic-it.sqlite` | Données locales persistantes, exclues de Git |
| `tests/api.test.mjs` | Scénarios métier et contrôles d’accès sur une base isolée |
| `tests/browser/site.spec.mjs` | Parcours navigateur sur un serveur et une base isolés |

## Fonctions opérationnelles

- Accueil, trois prochaines séances disponibles, six disciplines, trois offres, quatre profils de coachs, FAQ, salle, contact, pages d’information.
- Au démarrage, génération des créneaux manquants sur les quatorze jours à venir, à 10 h et 18 h en Europe/Paris. Au moins 26 séances futures lors d’un démarrage initial, avec plusieurs remplissages, une complète et une annulée. Le coaching individuel reste sur demande, conformément au périmètre MVP.
- Filtres par date, discipline et coach, états disponibles/presque complets/complets/annulés, fiche de séance détaillée.
- Parcours sans compte : séance, coordonnées, récapitulatif et simulation de paiement. Téléphone facultatif. Prix total connu avant le paiement.
- Lien personnel aléatoire de 256 bits par réservation, confirmation téléchargeable et calendrier ICS avec instants UTC. La référence commerciale seule ne donne aucun accès.
- Annulation jusqu’à 24 heures avant le début, libération de la place et remboursement intégral simulé. Refus après la limite. Annulation par la salle : annulation de toutes les réservations actives et remboursement simulé des paiements réussis.
- Connexion salariée réelle côté serveur, mots de passe salés et hachés avec scrypt, session HttpOnly et SameSite=Strict de 8 heures. Les sessions sont enregistrées sous forme hachée.
- Administrateur : création et modification des séances, capacité, coach, annulation, accès salariés, offres, coordonnées et appels manqués saisis manuellement.
- Accueil : consultation et saisie des réservations, recherche, annulation autorisée, présence et CSV.
- Coach : uniquement ses séances et participants, consultation des statuts et saisie des présences.
- Stock commun pour le site et l’accueil. Validation serveur de la date, de la capacité et du statut.
- Formulaire de contact enregistré en base et consultable par l’administrateur.
- Tableau de bord calculé depuis les réservations : origine en ligne/accueil, paiements réussis simulés et présences. Les remboursements ne sont pas comptés comme paiements réussis actifs.
- Événements : consultation du planning et des fiches, début de réservation, début de paiement, confirmation et annulation. Compteurs agrégés sans identifiant visiteur. Les actualisations peuvent compter comme de nouvelles consultations ; ce ne sont pas des visiteurs uniques.

Les nouveaux clients ne sont pas déduits des réservations en ligne. Le tableau de bord montre des e-mails distincts et récurrents, en précisant que cela ne prouve ni une identité ni un nouveau client.

## Éléments simulés ou non connectés

| Élément | Comportement de démonstration |
| --- | --- |
| Paiement | Simulateur explicite proposant réussite, refus et attente. Aucun champ bancaire et aucun débit |
| Remboursement | Changement de statut seulement ; aucun mouvement d’argent |
| E-mail | Aucun envoi. Lien personnel affiché et confirmation téléchargeable |
| Contact | Enregistrement local, aucune transmission à une équipe réelle |
| Carnet / coaching | Demande de renseignements préremplie, pas d’achat en ligne |
| Téléphonie | Nombre d’appels manqués saisi manuellement, aucune statistique générée |
| Infrastructure | Serveur local uniquement, pas de mise en production ni de domaine public |
| Informations légales | Textes de travail et champs à compléter, sans validation juridique |

Ne pas retirer le bandeau de démonstration sans remplacer les simulations. En particulier, `/api/bookings/:token/pay` laisse volontairement le testeur choisir le résultat : cette route est impropre à un paiement réel et doit être retirée lors de l’intégration du prestataire.

## Règles de cohérence et sécurité

Une réservation crée une retenue de place de 10 minutes. Le serveur utilise une transaction SQLite `BEGIN IMMEDIATE` et recompte les réservations confirmées/en attente avant toute insertion. La capacité ne dépend donc pas du stock affiché dans le navigateur. Une clé d’idempotence par tentative et un index unique sur séance/e-mail actif empêchent les doubles réservations accidentelles.

Un paiement réussi confirme une seule fois ; ses répétitions ne créent ni réservation ni événement supplémentaire. Le prix est conservé sur la réservation et ne peut pas être fourni par le client. Un refus libère immédiatement la place. L’expiration est appliquée lors des prochaines consultations ou actions serveur, avant tout calcul de stock. Aucun ordonnanceur externe n’est nécessaire dans la démonstration.

Les requêtes SQL sont paramétrées. Les écritures vérifient l’origine et le type JSON. Les formulaires sensibles sont limités en fréquence ; le contact possède un champ piège. Les données insérées dans le HTML sont échappées. Le CSV neutralise les préfixes de formule. Les en-têtes CSP, nosniff, anti-iframe et Referrer-Policy sont définis. Les réponses API contenant des données ne sont pas mises en cache.

Les données clients sont accessibles seulement à un salarié authentifié autorisé ou au détenteur du lien secret de la réservation concernée. Les coachs sont filtrés côté serveur. Ne jamais diffuser un lien personnel dans une capture publique. En production, ajouter rotation/révocation des liens et récupération par e-mail vérifié, ainsi que la politique d’expiration et de conservation appropriée.

Les comptes de test sont publics et explicitement documentés. L’authentification est réelle, mais leurs mots de passe connus rendent cette installation impropre à une exposition à de vrais clients. Ne saisir aucune donnée personnelle réelle.

## Données et ressources fictives

Alex Martin (force), Sarah Laurent (HIIT), Mehdi Bernard (cycling), Léa Moreau (mobilité) : noms, spécialités et biographies entièrement inventés pour la démonstration. Les portraits sont des compositions typographiques avec initiales, pas des photos de personnes présentées comme coachs. Les participants `Participant N Fictif` et les adresses `@example.test` sont fictifs. Les trois comptes salariés initiaux illustrent les trois niveaux d’accès ; les 20 salariés ne sont pas inventoriés nominativement.

Les horaires sont des exemples. Adresse, téléphone et e-mail sont explicitement à configurer ; aucun faux numéro n’est publié. Les séances et descriptions sont des exemples cohérents.

Photos d’illustration téléchargées et vérifiées HTTP 200, servies localement :

| Fichier | Source |
| --- | --- |
| `hero.jpg` | https://images.unsplash.com/photo-1534438327276-14e5300c3a48 |
| `strength.jpg` | https://images.unsplash.com/photo-1517836357463-d25dfeac3438 |
| `cycling.jpg` | https://images.unsplash.com/photo-1540497077202-7c8a3999166f |
| `mobility.jpg` | https://images.unsplash.com/photo-1518611012118-696072aa579a |

Ces photos ne représentent pas une salle Basic IT réelle ni les profils fictifs. Vérifier les droits et les besoins d’autorisation pour l’usage commercial définitif. Polices Barlow / Barlow Condensed sous SIL Open Font License, texte conservé dans `public/assets/BARLOW-OFL.txt`. Aucun appel à Google Fonts ou Unsplash n’est nécessaire lors de la consultation du site.

## Avant mise en production

1. Installer sur une infrastructure Node 24+ maintenue avec disque durable, HTTPS, domaine vérifié, supervision, rotation des journaux et sauvegardes SQLite testées. Exécuter une seule instance ou partager une base adaptée ; ne pas copier la base dans plusieurs instances indépendantes.
2. Supprimer les comptes/données de démonstration, remplacer le mode de génération initiale, créer les véritables accès avec mots de passe individuels, récupération et idéalement MFA. Activer `COOKIE_SECURE=1` derrière HTTPS et valider la configuration du reverse proxy et des origines autorisées.
3. Brancher un prestataire en environnement de test avec une page de paiement hébergée. Créer la session côté serveur avec prix et identifiant de réservation issus de la base. N’enregistrer aucune donnée bancaire.
4. Remplacer le simulateur par un webhook vérifié cryptographiquement, avec journal d’événements du prestataire à identifiant unique. Ne jamais confirmer sur le simple retour du navigateur. Rendre le traitement idempotent et prévoir les paiements tardifs après expiration de la retenue : ne pas dépasser la capacité, annuler/rembourser selon le résultat du contrôle transactionnel.
5. Intégrer les demandes de remboursement et leurs notifications de résultat. Un remboursement demandé ne doit pas être marqué réussi avant confirmation du prestataire. Tester succès, refus, délai, doublon, panne, remboursement et dernière place à plusieurs clients.
6. Configurer le service e-mail et une file d’envoi avec relances et suivi des échecs. Envoyer les liens personnels de réservation, confirmations, changements et annulations sans exposer les listes de participants.
7. Compléter les coordonnées, l’identité juridique, les conditions définitives et l’information sur les traitements ; faire valider ces textes et les règles de conservation. Ne pas ajouter de traceurs sans réévaluer le consentement.
8. Compléter les audits d’accessibilité sur lecteurs d’écran, sur appareils physiques iOS/Android et sur les navigateurs cibles. Les tests Chromium livrés ne constituent ni certification WCAG ni recette exhaustive.

## Proposition de réalisation sur douze semaines

Période du 4 janvier au 26 mars 2027, quatre intervenants à temps partiel : pilotage/UX, frontend, backend/intégrations, recette/exploitation. Le budget de 20 000 € ne correspond pas à quatre personnes à plein temps pendant douze semaines. Proposition indicative à chiffrer par devis : 30 jours-personnes à 500 € (15 000 €), 2 000 € de préparation infrastructure et intégrations, 1 000 € d’accompagnement juridique/accessibilité, 2 000 € de réserve. Total maximal : 20 000 €, selon périmètre et devis ; frais récurrents et commissions à clarifier contractuellement.

| Période | Résultat attendu |
| --- | --- |
| 4–15 janvier | Cadrage, données réelles, parcours, identité, critères de recette |
| 18–29 janvier | Pages publiques et planning responsive |
| 1–12 février | Réservation, stock transactionnel et accès salariés |
| 15–26 février | Prestataire de paiement test, webhooks et e-mails |
| 1–12 mars | Back-office final, données, sécurité et tests concurrents |
| 15–26 mars | Recette utilisateurs, vérifications juridiques, formation et préparation à la publication |

## Soutenance : parcours de deux minutes

| Temps | Action et message |
| --- | --- |
| 0:00–0:20 | Accueil : montrer le nom Basic IT, le bandeau démo, l’accès au planning et les offres. Aucune statistique commerciale inventée |
| 0:20–0:40 | Planning : filtrer une discipline, montrer une séance complète non réservable, ouvrir une séance disponible dans plus de 24 heures |
| 0:40–1:05 | Saisir Camille Exemple / camille@example.test, montrer les 15 € TTC, puis simuler un paiement réussi |
| 1:05–1:25 | Montrer référence, statut simulé, calendrier et lien personnel. Recharger pour démontrer la persistance |
| 1:25–1:50 | Espace salarié avec l’accueil : retrouver le participant, saisir une réservation accueil, montrer le stock partagé et l’export CSV |
| 1:50–2:00 | Depuis le lien personnel, annuler la séance choisie à plus de 24 h ; montrer le remboursement simulé et expliquer les connexions restantes |

Le mot de passe des comptes de démonstration est dans le README. Préparer un second onglet connecté à l’accueil pour tenir les deux minutes. Le paiement refusé et les droits coach peuvent être présentés en complément si le jury le demande.
