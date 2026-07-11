'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { exportCSV, exportExcel } from '@/lib/csv';

export default function VerificationsTab({ userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState('Tous');
  const [tri, setTri] = useState('date_desc');

  const load = async () => {
    const [{ data: net }, { data: haccp }] = await Promise.all([
      supabase.from('nettoyage').select('*').eq('user_id', userId),
      supabase.from('haccp_verifications').select('*').eq('user_id', userId),
    ]);
    const normNet = (net || []).map(n => ({
      id: 'n' + n.id, type: 'Nettoyage', date: n.date_intervention, element: n.zone,
      statut: n.annule ? 'Annulé' : 'Valide', responsable: n.responsable, created_at: n.created_at,
    }));
    const normHaccp = (haccp || []).map(v => ({
      id: 'h' + v.id, type: 'HACCP', date: v.date_verification, element: v.etape,
      statut: v.annule ? 'Annulé' : (v.conforme ? 'Conforme' : 'Non conforme'), responsable: v.responsable, created_at: v.created_at,
    }));
    setRows([...normNet, ...normHaccp]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const filtered = rows.filter(r => filtreType === 'Tous' || r.type === filtreType);
  const sorted = [...filtered].sort((a, b) => {
    if (tri === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
    if (tri === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
    if (tri === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  const doExport = () => exportCSV(
    'verifications.csv',
    ['Type', 'Date', 'Élément', 'Statut', 'Responsable', 'Saisi le'],
    sorted.map(r => [r.type, r.date, r.element, r.statut, r.responsable, new Date(r.created_at).toLocaleString('fr-FR')])
  );
  const doExportXlsx = () => exportExcel(
    'verifications.xlsx',
    ['Type', 'Date', 'Élément', 'Statut', 'Responsable', 'Saisi le'],
    sorted.map(r => [r.type, r.date, r.element, r.statut, r.responsable, new Date(r.created_at).toLocaleString('fr-FR')])
  );

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Vérifications — HACCP & Nettoyage</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', marginBottom: 14 }}>
        Toutes vos vérifications HACCP et tous vos passages de nettoyage réunis au même endroit, pour une vue d'ensemble rapide.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <label className="label">Filtrer par type</label>
          <select className="select-field" style={{ width: 160 }} value={filtreType} onChange={e => setFiltreType(e.target.value)}>
            <option value="Tous">Tous</option>
            <option value="HACCP">HACCP</option>
            <option value="Nettoyage">Nettoyage</option>
          </select>
        </div>
        <div>
          <label className="label">Trier par</label>
          <select className="select-field" style={{ width: 200 }} value={tri} onChange={e => setTri(e.target.value)}>
            <option value="date_desc">Saisi le — plus récent d'abord</option>
            <option value="date_asc">Saisi le — plus ancien d'abord</option>
            <option value="type">Type</option>
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 12 }}>
          <button className="link-btn" onClick={doExport}>Exporter en CSV</button>
          <button className="link-btn" onClick={doExportXlsx}>Exporter en Excel</button>
        </div>
      </div>

      <div className="hist-wrap">
        <table className="hist-table">
          <thead><tr><th>Type</th><th>Date</th><th>Élément</th><th>Statut</th><th>Responsable</th><th>Saisi le</th></tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--ink-faint)' }}>Aucune vérification pour l'instant.</td></tr>}
            {sorted.map(r => (
              <tr key={r.id} className={r.statut === 'Annulé' ? 'annule' : ''}>
                <td><span className="chip" style={{ background: r.type === 'HACCP' ? '#E4E9F0' : '#E9F0E4', color: r.type === 'HACCP' ? 'var(--blue)' : 'var(--green)' }}>{r.type}</span></td>
                <td>{r.date || '—'}</td>
                <td>{r.element}</td>
                <td>{r.statut === 'Non conforme' ? <span className="chip warn">{r.statut}</span> : <span className="chip ok">{r.statut}</span>}</td>
                <td>{r.responsable}</td>
                <td>{new Date(r.created_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
