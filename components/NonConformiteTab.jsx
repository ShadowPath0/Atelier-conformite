'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { exportCSV, exportExcel } from '@/lib/csv';
import { today, getLastResponsable, rememberResponsable } from '@/lib/prefs';
import { useSavedFlag } from '@/lib/useSavedFlag';

const OTHER = '__autre__';
const NONE = '';

export default function NonConformiteTab({ userId }) {
  const [items, setItems] = useState([]);
  const [gamme, setGamme] = useState([]);
  const [form, setForm] = useState({ produit: NONE, date_constat: today(), description: '', action_corrective: '', responsable: '' });
  const [customProduit, setCustomProduit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(false);
  const [saved, flashSaved] = useSavedFlag();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const nom = getLastResponsable();
    if (nom) setForm(f => ({ ...f, responsable: nom }));
  }, []);

  const load = async () => {
    const [{ data: nc }, { data: produits }] = await Promise.all([
      supabase.from('non_conformites').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('produits').select('id,nom').eq('user_id', userId).order('nom'),
    ]);
    setItems(nc || []);
    setGamme(produits || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const add = async () => {
    if (!form.description || !form.responsable) { setFormError(true); return; }
    setFormError(false);
    setSaving(true);
    const selected = gamme.find(p => p.id === form.produit);
    const produitFinal = form.produit === OTHER ? customProduit : (selected?.nom || null);
    await supabase.from('non_conformites').insert({
      ...form,
      produit: produitFinal,
      produit_id: form.produit === OTHER ? null : (selected?.id ?? null),
      user_id: userId,
    });
    rememberResponsable(form.responsable);
    setForm({ produit: NONE, date_constat: today(), description: '', action_corrective: '', responsable: form.responsable });
    setCustomProduit('');
    setSaving(false);
    flashSaved();
    load();
  };

  const itemsFiltres = items.filter(it => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [it.produit, it.description, it.responsable].some(v => (v || '').toLowerCase().includes(q));
  });

  const toggle = async (item) => {
    await supabase.from('non_conformites')
      .update({ cloture: !item.cloture, cloture_at: !item.cloture ? new Date().toISOString() : null })
      .eq('id', item.id);
    load();
  };

  const doExport = () => exportCSV(
    'non-conformites.csv',
    ['Date', 'Produit', 'Description', 'Action corrective', 'Responsable', 'Statut'],
    items.map(it => [it.date_constat, it.produit, it.description, it.action_corrective, it.responsable, it.cloture ? 'Clôturé' : 'Ouvert'])
  );
  const doExportXlsx = () => exportExcel(
    'non-conformites.xlsx',
    ['Date', 'Produit', 'Description', 'Action corrective', 'Responsable', 'Statut'],
    items.map(it => [it.date_constat, it.produit, it.description, it.action_corrective, it.responsable, it.cloture ? 'Clôturé' : 'Ouvert'])
  );

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Non-conformités & actions correctives</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: form.produit === OTHER ? 10 : 12 }}>
        <div>
          <label className="label">Produit concerné</label>
          <select className="select-field" value={form.produit} onChange={e => setForm(f => ({ ...f, produit: e.target.value }))}>
            <option value={NONE}>Non lié à un produit précis</option>
            {gamme.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            <option value={OTHER}>Autre (préciser)…</option>
          </select>
        </div>
        <input className="input" type="date" value={form.date_constat} onChange={e => setForm(f => ({ ...f, date_constat: e.target.value }))} />
        <input className="input" placeholder="Écart constaté *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <input className="input" placeholder="Action corrective" value={form.action_corrective} onChange={e => setForm(f => ({ ...f, action_corrective: e.target.value }))} />
        <input className="input" placeholder="Responsable *" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} />
      </div>
      {form.produit === OTHER && (
        <div style={{ marginBottom: 12 }}>
          <label className="label">Nom du produit</label>
          <input className="input" placeholder="Nom du produit non répertorié" value={customProduit} onChange={e => setCustomProduit(e.target.value)} />
        </div>
      )}
      {formError && <p className="error-msg">L'écart constaté et le responsable sont obligatoires.</p>}
      {saved && <p className="saved-msg">✓ Enregistré</p>}
      <button className="btn" disabled={saving} onClick={add}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Historique</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="link-btn" onClick={doExport}>Exporter en CSV</button>
          <button className="link-btn" onClick={doExportXlsx}>Exporter en Excel</button>
        </div>
      </div>
      <input
        className="input search-input"
        placeholder="Rechercher (produit, description, responsable)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="hist-wrap">
        <table className="hist-table stack">
          <thead>
            <tr>
              <th>Date</th><th>Produit</th><th>Description</th><th>Action corrective</th><th>Responsable</th><th>Statut</th><th></th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltres.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--ink-faint)' }}>Aucune non-conformité enregistrée — tant mieux.</td></tr>}
            {itemsFiltres.map(it => (
              <tr key={it.id}>
                <td data-label="Date">{it.date_constat || '—'}</td>
                <td data-label="Produit">{it.produit || '—'}</td>
                <td data-label="Description" style={{ whiteSpace: 'normal', minWidth: 160 }}>{it.description}</td>
                <td data-label="Action corrective" style={{ whiteSpace: 'normal', minWidth: 160 }}>{it.action_corrective || '—'}</td>
                <td data-label="Responsable">{it.responsable}</td>
                <td data-label="Statut">{it.cloture ? <span className="chip ok">Clôturé</span> : <span className="chip warn">Ouvert</span>}</td>
                <td data-label="Actions"><button className="link-btn" onClick={() => toggle(it)}>{it.cloture ? 'Rouvrir' : 'Clôturer'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
