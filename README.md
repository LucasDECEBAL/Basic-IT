# Basic IT

Site vitrine et module de réservation du studio **Basic IT**, un club de coaching
« boutique gym » à Paris 11e. Projet MVP réalisé pour une démonstration devant un jury
d'école d'ingénieurs.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- React 19
- lucide-react

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
   puis confirmation immédiate avec un code du type `BIT-2027-X89`.
4. Les places du créneau sont décrémentées dans l'interface après la réservation.

Le dimanche est fermé et affiche un état dédié. Aucun back-end n'est nécessaire :
les dates sont calculées côté client et les réservations vivent en mémoire, elles
sont donc réinitialisées au rechargement de la page.

## Démonstration, pas production

- Le paiement est **simulé** : aucune carte n'est débitée, aucun email n'est envoyé.
- L'adresse, les horaires, les coachs, les certifications et les tarifs sont des
  contenus d'exemple à valider avant une mise en ligne réelle.
- Toute persistance (compte client, annulation, paiement réel) reste à brancher.

## Photographies

Les photographies sont issues de [Pexels](https://www.pexels.com) et créditées dans
le pied de page : Assomyron, Engin Akyurt, Ron Lach, Andres Ayrton, Dave Garcia,
Tima Miroshnichenko et KoolShooters. Elles illustrent une salle de sport et ne
représentent pas le studio Basic IT.
