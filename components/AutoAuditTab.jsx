'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { exportCSV, exportExcel } from '@/lib/csv';
import { getLastResponsable, rememberResponsable } from '@/lib/prefs';
import { useSavedFlag } from '@/lib/useSavedFlag';

const AUDIT_ITEMS = [
  'Fiches techniques produits à jour',
  'Plan HACCP à jour et cohérent avec l\'activité réelle',
  'Vérifications HACCP faites au rythme prévu dans le plan',
  'Registre de traçabilité renseigné sans interruption',
  'Étiquettes en stock conformes aux fiches actuelles',
  'Plan de nettoyage renseigné et cohérent',
  'Aucune non-conformité restée sans action corrective',
  'Procédure de retrait/rappel rédigée et à jour',
  'Bons de livraison des 3 derniers mois classés',
  'Conditions de stockage conformes',
  'Agencement des locaux cohérent avec la marche en avant',
  'Gestion des déchets conforme',
  'Formation HACCP à jour',
];

export default function AutoAuditTab({ userId }) {
  const [history, setHistory] = useState([]);
  const [checked, setChecked] = useState({});
  const [auditeur, setAuditeur] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [saved, flashSaved] = useSavedFlag();

  const load = async () => {
    const { data } = await supabase.from('audits').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setHistory(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);
  useEffect(() => {
    const nom = getLastResponsable();
    if (nom) setAuditeur(nom);
  }, []);

  const cloreAudit = async () => {
    if (!auditeur) { setError(true); return; }
    setError(false);
    setSaving(true);
    const total = Object.values(checked).filter(Boolean).length;
    const pct = Math.round((total / AUDIT_ITEMS.length) * 100);
    const score = `${pct}%`;
    await supabase.from('audits').insert({ user_id: userId, score, auditeur, details: checked });
    rememberResponsable(auditeur);
    setChecked({});
    setSaving(false);
    flashSaved();
    load();
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <div className="split-2">
      <div>
        <h3 style={{ marginTop: 0 }}>Auto-audit en cours ({Math.round((Object.values(checked).filter(Boolean).length / AUDIT_ITEMS.length) * 100)}%)</h3>
        {AUDIT_ITEMS.map((it, i) => (
          <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.86rem', padding: '5px 0' }}>
            <input type="checkbox" checked={!!checked[i]} onChange={e => setChecked(c => ({ ...c, [i]: e.target.checked }))} />
            {it}
          </label>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input className="input" placeholder="Réalisé par" value={auditeur} onChange={e => setAuditeur(e.target.value)} />
            {error && <p className="error-msg" style={{ margin: '4px 0 0' }}>Le nom de l'auditeur est obligatoire.</p>}
            {saved && <p className="saved-msg" style={{ margin: '4px 0 0' }}>✓ Enregistré</p>}
          </div>
          <button className="btn" disabled={saving} onClick={cloreAudit}>{saving ? 'Enregistrement…' : 'Clôturer'}</button>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Historique</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="link-btn" onClick={() => exportCSV(
              'auto-audits.csv',
              ['Date', 'Réalisé par', 'Score'],
              history.map(h => [new Date(h.created_at).toLocaleString('fr-FR'), h.auditeur, h.score])
            )}>Exporter en CSV</button>
            <button className="link-btn" onClick={() => exportExcel(
              'auto-audits.xlsx',
              ['Date', 'Réalisé par', 'Score'],
              history.map(h => [new Date(h.created_at).toLocaleString('fr-FR'), h.auditeur, h.score])
            )}>Exporter en Excel</button>
          </div>
        </div>
        <div className="hist-wrap">
          <table className="hist-table">
            <thead>
              <tr><th>Date</th><th>Réalisé par</th><th>Score</th></tr>
            </thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={3} style={{ color: 'var(--ink-faint)' }}>Aucun audit archivé.</td></tr>}
              {history.map(h => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleString('fr-FR')}</td>
                  <td>{h.auditeur}</td>
                  <td><span className="chip ok">{h.score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
