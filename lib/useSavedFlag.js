import { useRef, useState } from 'react';

// Affiche une confirmation "✓ Enregistré" pendant `duration` ms après un flash().
export function useSavedFlag(duration = 2000) {
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  const flash = () => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), duration);
  };

  return [saved, flash];
}
