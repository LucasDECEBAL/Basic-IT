# Basic IT

Site vitrine et module de réservation du studio **Basic IT**, un club de coaching
« boutique gym » à Paris 11e. Projet MVP réalisé pour une démonstration devant un jury
d'école d'ingénieurs.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- React 19
- GSAP + `@gsap/react` (hero, révélations au scroll, animations du tableau de bord)
- lucide-react
- Back-end local : routes API Next.js et fichier JSON verrouillé

## Lancer le projet

```bash
bun install
bun dev
```

Le site est alors disponible sur [http://localhost:3000](http://localhost:3000).
Avec Portless, `portless basic-it bun run dev` expose la même application sur
`https://basic-it.localhost`.

Production :

```bash
bun run build
bun run start
```

Vérifications :

```bash
bun run lint
bunx tsc --noEmit
```

## Le parcours de démonstration

1. La page vitrine présente le concept, les trois formats et les trois coachs.
2. La section **Réserver** propose les sept prochains jours, des filtres par format
   et six créneaux par jour, avec la jauge des huit places restantes.
3. Un clic sur un créneau ouvre une modale : coordonnées, carte bancaire simulée,
   puis confirmation avec un code du type `BIT-2027-X89`.
4. La réservation est enregistrée par le serveur et apparaît dans l'espace admin
   sur [`/admin`](http://localhost:3000/admin).
5. Les autres appareils connectés au même serveur voient la réservation et les
   places mises à jour au plus tard au bout de dix secondes, ou immédiatement au
   retour sur l'onglet.

Le dimanche est fermé et affiche un état dédié.

## Back-end local

Les réservations vivent dans `data/bookings.json`. Le fichier est créé au premier
enregistrement et n'est pas versionné.

- `GET /api/bookings` : liste les réservations actives.
- `POST /api/bookings` : crée une réservation après validation du créneau et des
  places restantes.
- `DELETE /api/bookings/[id]` : supprime une réservation.
- `DELETE /api/bookings` : vide la démo.

Les écritures passent par une file d'attente dans le processus, puis par un fichier
verrou (`bookings.json.lock`) qui protège aussi deux processus distincts. Le fichier
est remplacé par un `rename` atomique après `fsync`, donc un lecteur voit toujours
l'ancienne version complète ou la nouvelle, jamais un fichier à moitié écrit. Un
verrou abandonné est considéré comme périmé après dix secondes.

Pour repartir d'une base vide, supprimer `data/bookings.json` ou appeler
`DELETE /api/bookings`. La variable `BOOKINGS_FILE` permet de pointer vers un autre
fichier si besoin.

Ce montage suppose un serveur Node local avec un disque inscriptible. Il n'est pas
adapté à un déploiement serverless.

## Démonstration, pas production

- Le paiement est **simulé** : aucune carte n'est débitée, aucun email n'est envoyé.
- L'espace `/admin` est une démonstration sans authentification et ne doit pas être
  exposé tel quel en production.
- L'adresse, les horaires, les coachs, les certifications et les tarifs sont des
  contenus d'exemple à valider avant une mise en ligne réelle.

## Photographies

Les photographies sont issues de [Pexels](https://www.pexels.com) et créditées dans
le pied de page : Assomyron, Engin Akyurt, Ron Lach, Andres Ayrton, Dave Garcia,
Tima Miroshnichenko et KoolShooters. Elles illustrent une salle de sport et ne
représentent pas le studio Basic IT.
