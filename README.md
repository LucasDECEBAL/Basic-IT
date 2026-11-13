# Basic IT

Site vitrine, réservation et espace admin du studio **Basic IT**, un club de
coaching « boutique gym » à Paris 11e. Projet MVP pour une démonstration devant
un jury d'école d'ingénieurs.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- React 19
- GSAP + `@gsap/react`
- lucide-react
- Stripe Checkout en mode test
- Back-end local : routes API Next.js et fichier JSON verrouillé

## Lancer le projet

```bash
bun install
bun run dev
```

Le script démarre deux processus :

- Next sur un port disponible choisi automatiquement, ou `PORT=4000 bun run dev`
  pour en imposer un ;
- `stripe listen` sur le même port, avec les événements Checkout. Le secret
  `whsec_...` est injecté dans Next sans être recopié ni affiché en clair.

Il enregistre aussi l'alias Portless `basic-it` vers le port choisi, donc
`https://basic-it.localhost` suit automatiquement. Ne pas envelopper
`bun run dev` dans `portless`.

Options :

```bash
STRIPE_LISTEN=0 bun run dev   # serveur seul, sans Stripe
PORT=4000 bun run dev         # port de départ
```

Si la Stripe CLI est absente, Next démarre quand même. Le listener utilise la
clé `STRIPE_SECRET_KEY` du projet, donc il écoute le même compte Stripe que
l'application, sans dépendre du `stripe login` global.

Production locale :

```bash
bun run build
bun run start
```

Vérifications :

```bash
bun run lint
bunx tsc --noEmit
```

## Parcours de démonstration

1. La vitrine présente le concept, les formats et les coachs.
2. La section **Réserver** propose les sept prochains jours, des filtres et six
   créneaux par jour, avec les places restantes.
3. Un clic sur un créneau ouvre le formulaire : nom, email, téléphone.
4. Le serveur crée une réservation **en attente** qui bloque la place, puis une
   session Stripe Checkout. Le navigateur est redirigé vers Stripe.
5. Payer avec `4242 4242 4242 4242`, une date future et n'importe quel CVC.
6. Stripe revient sur `/reservation/<id>`. La page vérifie le paiement et se met
   à jour dès que le webhook a confirmé la réservation.
7. L'email de confirmation part après la confirmation, si le SMTP est configuré.
8. La réservation apparaît dans `/admin`, protégé par mot de passe.

## Espace admin

`/admin` demande `ADMIN_PASSWORD`, au moins 8 caractères, défini dans
`.env.local`. La session est un cookie HttpOnly signé, valable 8 heures, avec
bouton de déconnexion.

L'admin affiche les réservations confirmées et en attente, avec leur statut, le
revenu confirmé et les coordonnées du client. Les suppressions et l'effacement
global sont protégés par la même session.

- Une réservation en attente ne peut pas être supprimée : elle se libère à
  l'expiration du paiement.
- « Tout effacer » est bloqué tant qu'un paiement est en attente.
- L'API publique `/api/bookings` ne renvoie que les compteurs par créneau, jamais
  les noms ou emails.
- Les données complètes passent par `/api/admin/bookings`, protégé.

Le mot de passe généré pour cette démo locale se trouve dans `.env.local`. Il
n'est pas versionné. Remplacer la valeur pour utiliser le vôtre, puis redémarrer.

## Paiement Stripe

Mode **test uniquement**. L'application refuse une clé `sk_live_` ou `rk_live_`.

Variables dans `.env.local` :

- `STRIPE_SECRET_KEY` : clé `sk_test_...` ou `rk_test_...`
- `STRIPE_WEBHOOK_SECRET` : `whsec_...` du listener CLI. En développement,
  `bun run dev` l'injecte automatiquement. Pour `bun run start`, il faut le
  renseigner.
- `APP_URL` : URL publique locale utilisée par les redirections Checkout, par
  exemple `https://basic-it.localhost`.

Fonctionnement :

1. `POST /api/checkout` valide le créneau, crée une réservation `pending` avec
   une expiration à 35 minutes, puis une session Checkout de 31 minutes.
2. La place est comptée comme prise dès la réservation en attente. Le webhook ne
   refait pas un décrément séparé : il confirme la place déjà tenue, sous verrou.
3. `POST /api/stripe/webhook` vérifie la signature sur le corps brut :
   - `checkout.session.completed` et `checkout.session.async_payment_succeeded`
     confirment la réservation et envoient l'email ;
   - `checkout.session.expired` et `checkout.session.async_payment_failed`
     libèrent la place.
4. Si le webhook est en retard, la page de retour vérifie elle-même la session
   Stripe et confirme la réservation.
5. Le webhook est idempotent : un événement rejoué ne crée pas de doublon et
   n'envoie pas un second email.

Pour lancer le listener manuellement :

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed \
  --forward-to http://localhost:<port>/api/stripe/webhook
```

Le port est celui affiché par `bun run dev`. En développement, le script s'en
occupe déjà.

Cartes de test :

- succès : `4242 4242 4242 4242`
- refus : `4000 0000 0000 9995`
- 3D Secure : `4000 0025 0000 3155`

## Emails

Après confirmation du paiement, le client reçoit le code, la séance, le créneau,
le coach, l'adresse et le montant. Si `STUDIO_EMAIL` est renseigné, le studio
reçoit une copie avec les coordonnées.

Variables SMTP dans `.env.local` :

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
- `SMTP_USER`, `SMTP_PASSWORD` si nécessaire
- `SMTP_FROM`, par exemple `"Basic IT <bonjour@basic-it.fr>"`
- `STUDIO_EMAIL`, optionnel

Sans configuration SMTP, la réservation reste valable : l'erreur est journalisée
et l'email est ignoré.

Pour tester sans fournisseur, Mailpit :

```bash
docker run -d --rm -p 1025:1025 -p 8025:8025 axllent/mailpit
```

```bash
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM="Basic IT <bonjour@basic-it.fr>"
```

Messages sur [http://localhost:8025](http://localhost:8025). Redémarrer après
toute modification de `.env.local`.

## Back-end local

Les réservations vivent dans `data/bookings.json`, non versionné.

- Écriture atomique : fichier temporaire, `fsync`, puis `rename`.
- Verrou dans le processus, puis fichier `bookings.json.lock` pour deux
  processus. Un verrou abandonné est considéré comme périmé après dix secondes.
- Réservations en attente expirées balayées à la lecture.
- Les enregistrements expirés ou annulés sont conservés sept jours puis purgés.

Routes publiques :

- `GET /api/bookings` : compteurs de places par créneau
- `POST /api/checkout` : création de la réservation en attente et de la session
  Stripe
- `POST /api/stripe/webhook` : confirmation ou expiration
- `GET /api/reservations/[id]` : état minimal d'une réservation pour la page de
  retour

Routes admin, protégées :

- `GET /api/admin/bookings`
- `DELETE /api/admin/bookings`
- `DELETE /api/admin/bookings/[id]`

Ce montage suppose un serveur Node local avec un disque inscriptible. Il n'est
pas adapté à un déploiement serverless.

## Démonstration, pas production

- Stripe est en mode test : aucun débit réel.
- L'admin a un mot de passe, mais reste une démonstration sans gestion de comptes,
  sans rate limit distribué et sans audit.
- L'adresse, les horaires, les coachs, les certifications et les tarifs sont des
  contenus d'exemple à valider avant une mise en ligne réelle.

## Photographies

Photographies issues de [Pexels](https://www.pexels.com), créditées dans le pied
de page : Assomyron, Engin Akyurt, Ron Lach, Andres Ayrton, Dave Garcia, Ahmet
Kurt et KoolShooters. Elles illustrent une salle de sport et ne représentent pas
le studio Basic IT.
