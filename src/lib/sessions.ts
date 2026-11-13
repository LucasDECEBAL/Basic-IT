export type FormatKey = "force" | "cardio" | "mobilite";

export type Format = {
  key: FormatKey;
  name: string;
  short: string;
  coach: string;
  duration: number;
  description: string;
  days: string;
  intensity: string;
  image: string;
};

export const FORMATS: Record<FormatKey, Format> = {
  force: {
    key: "force",
    name: "Force & Posture",
    short: "Force",
    coach: "Camille Roux",
    duration: 50,
    description:
      "Construire une force utile, loin des charges inutiles. Gainage, tirage, posture : on corrige le mouvement avant d'ajouter du poids.",
    days: "Lundi, mercredi, vendredi",
    intensity: "Soutenue",
    image: "/photos/force.jpg",
  },
  cardio: {
    key: "cardio",
    name: "HIIT Précision",
    short: "Cardio",
    coach: "Malik Haddad",
    duration: 50,
    description:
      "Des intervalles courts, une exécution nette. Le cardio le plus efficace est celui qu'on peut répéter sans se blesser.",
    days: "Mardi, jeudi, samedi",
    intensity: "Intense",
    image: "/photos/hiit.jpg",
  },
  mobilite: {
    key: "mobilite",
    name: "Mobilité & Yoga Athlétique",
    short: "Mobilité",
    coach: "Inès Moreau",
    duration: 50,
    description:
      "Récupérer n'est pas s'arrêter. On ouvre les hanches, on libère les épaules, on gagne l'amplitude qui manque aux autres séances.",
    days: "Lundi, jeudi, dimanche",
    intensity: "Douce",
    image: "/photos/mobilite.jpg",
  },
};

export const SESSION_TEMPLATES: { time: string; format: FormatKey }[] = [
  { time: "07:15", format: "force" },
  { time: "08:15", format: "cardio" },
  { time: "12:15", format: "mobilite" },
  { time: "18:00", format: "force" },
  { time: "19:00", format: "cardio" },
  { time: "20:00", format: "mobilite" },
];

export const CAPACITY = 8;
export const PRICE = 25;

export const FILTERS: { key: "tous" | FormatKey; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "force", label: "Force" },
  { key: "cardio", label: "Cardio" },
  { key: "mobilite", label: "Mobilité" },
];

export type Day = {
  iso: string;
  weekday: string;
  weekdayLong: string;
  day: number;
  month: string;
  closed: boolean;
};

export function buildDays(): Day[] {
  const today = new Date();
  const days: Day[] = [];

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const weekdayLong = date.toLocaleDateString("fr-FR", { weekday: "long" });
    days.push({
      iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`,
      weekday: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
      weekdayLong: weekdayLong.charAt(0).toUpperCase() + weekdayLong.slice(1),
      day: date.getDate(),
      month: date.toLocaleDateString("fr-FR", { month: "long" }),
      closed: date.getDay() === 0,
    });
  }

  return days;
}

export function bookedCount(dayIndex: number, slotIndex: number): number {
  return (dayIndex * 5 + slotIndex * 3) % (CAPACITY + 1);
}

export type Slot = {
  id: string;
  dateIso: string;
  dateLong: string;
  time: string;
  format: FormatKey;
  name: string;
  coach: string;
  duration: number;
  remaining: number;
};
