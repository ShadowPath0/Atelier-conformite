const RESPONSABLE_KEY = 'atelier_dernier_responsable';

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getLastResponsable() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(RESPONSABLE_KEY) || '';
}

export function rememberResponsable(nom) {
  if (typeof window === 'undefined' || !nom) return;
  localStorage.setItem(RESPONSABLE_KEY, nom);
}
