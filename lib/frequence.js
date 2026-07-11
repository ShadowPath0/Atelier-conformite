export const FREQUENCES = [
  { label: 'Quotidienne', jours: 1 },
  { label: 'Hebdomadaire', jours: 7 },
  { label: 'Bi-hebdomadaire', jours: 14 },
  { label: 'Mensuelle', jours: 30 },
  { label: 'Trimestrielle', jours: 90 },
  { label: 'Semestrielle', jours: 182 },
  { label: 'Annuelle', jours: 365 },
];

export const AUTRE_FREQUENCE = '__autre__';

export function frequenceEnJours(label) {
  return FREQUENCES.find(f => f.label === label)?.jours ?? null;
}

export function joursDepuis(dateISO) {
  if (!dateISO) return null;
  return Math.floor((Date.now() - new Date(dateISO).getTime()) / 86400000);
}

// Retourne le nombre de jours de retard (>0 si en retard), ou null si la
// fréquence n'est pas reconnue (saisie libre d'avant cette fonctionnalité).
export function retardEnJours(frequence, derniereDateISO) {
  const seuil = frequenceEnJours(frequence);
  if (!seuil || !derniereDateISO) return null;
  const jours = joursDepuis(derniereDateISO);
  return jours > seuil ? jours - seuil : null;
}
