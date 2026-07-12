'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { exportCSV, exportExcel } from '@/lib/csv';
import { today, getLastResponsable, rememberResponsable } from '@/lib/prefs';
import { useSavedFlag } from '@/lib/useSavedFlag';
import { FREQUENCES, AUTRE_FREQUENCE, retardEnJours } from '@/lib/frequence';

export default function NettoyageTab({ userId }) {
  const [plan, setPlan] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [planForm, setPlanForm] = useState({ zone: '', frequence: '', produit_habituel: '', responsable: '' });
  const [customFrequence, setCustomFrequence] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [execForm, setExecForm] = useState({ produit_utilise: '', date_intervention: today(), responsable: '' });
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingExec, setSavingExec] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [execError, setExecError] = useState(false);
  const [savedPlan, flashPlan] = useSavedFlag();
  const [savedExec, flashExec] = useSavedFlag();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const nom = getLastResponsable();
    if (nom) {
      setPlanForm(f => ({ ...f, responsable: nom }));
      setExecForm(f => ({ ...f, responsable: nom }));
    }
  }, []);

  const load = async () => {
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('plan_nettoyage').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('nettoyage').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    setPlan(p || []);
    setExecutions(e || []);
    if (!selectedPlanId && p?.some(x => !x.annule)) setSelectedPlanId(p.find(x => !x.annule).id);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const planActif = plan.filter(p => !p.annule);
  const selected = plan.find(p => p.id === selectedPlanId);

  const addPlan = async () => {
    if (!planForm.zone || !planForm.responsable) { setPlanError(true); return; }
    setPlanError(false);
    setSavingPlan(true);
    const frequenceFinale = planForm.frequence === AUTRE_FREQUENCE ? customFrequence : planForm.frequence;
    await supabase.from('plan_nettoyage').insert({ ...planForm, frequence: frequenceFinale, user_id: userId });
    rememberResponsable(planForm.responsable);
    setPlanForm({ zone: '', frequence: '', produit_habituel: '', responsable: planForm.responsable });
    setCustomFrequence('');
    setSavingPlan(false);
    flashPlan();
    load();
  };

  const retirerPlan = async (id) => {
    await supabase.from('plan_nettoyage').update({ annule: true, annule_at: new Date().toISOString() }).eq('id', id);
    if (selectedPlanId === id) setSelectedPlanId(null);
    load();
  };

  const enregistrerExecution = async () => {
    if (!selected || !execForm.responsable) { setExecError(true); return; }
    setExecError(false);
    setSavingExec(true);
    await supabase.from('nettoyage').insert({
      plan_id: selected.id,
      zone: selected.zone,
      produit_utilise: execForm.produit_utilise || selected.produit_habituel,
      frequence: selected.frequence,
      responsable: execForm.responsable,
      date_intervention: execForm.date_intervention,
      user_id: userId,
    });
    rememberResponsable(execForm.responsable);
    setExecForm({ produit_utilise: '', date_intervention: today(), responsable: execForm.responsable });
    setSavingExec(false);
    flashExec();
    load();
  };

  const annulerExecution = async (id) => {
    await supabase.from('nettoyage').update({ annule: true }).eq('id', id);
    load();
  };

  const historiqueDuPoint = selected ? executions.filter(e => e.plan_id === selected.id) : [];
  const derniereExecution = (planId) => executions.find(e => e.plan_id === planId && !e.annule);

  const executionsFiltrees = executions.filter(n => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [n.zone, n.produit_utilise, n.responsable].some(v => (v || '').toLowerCase().includes(q));
  });

  const doExport = () => exportCSV(
    'registre-nettoyage.csv',
    ['Zone', 'Produit', 'Fréquence', 'Responsable', 'Date', 'Saisi le', 'Statut'],
    executions.map(n => [n.zone, n.produit_utilise, n.frequence, n.responsable, n.date_intervention, new Date(n.created_at).toLocaleString('fr-FR'), n.annule ? 'Annulé' : 'Valide'])
  );
  const doExportXlsx = () => exportExcel(
    'registre-nettoyage.xlsx',
    ['Zone', 'Produit', 'Fréquence', 'Responsable', 'Date', 'Saisi le', 'Statut'],
    executions.map(n => [n.zone, n.produit_utilise, n.frequence, n.responsable, n.date_intervention, new Date(n.created_at).toLocaleString('fr-FR'), n.annule ? 'Annulé' : 'Valide'])
  );

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Plan de nettoyage et désinfection</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', marginBottom: 14 }}>
        Définissez une fois vos points de nettoyage habituels, puis enregistrez chaque exécution réelle à côté — avec son propre historique.
      </p>

      <div className="split-2">
        <div>
          <h3 style={{ marginTop: 0 }}>Points du plan</h3>
          <div className="grid2" style={{ gap: 8, marginBottom: 10 }}>
            <input className="input" placeholder="Zone / équipement" value={planForm.zone} onChange={e => setPlanForm(f => ({ ...f, zone: e.target.value }))} />
            <select className="select-field" value={planForm.frequence} onChange={e => setPlanForm(f => ({ ...f, frequence: e.target.value }))}>
              <option value="">— Fréquence —</option>
              {FREQUENCES.map(f => <option key={f.label} value={f.label}>{f.label}</option>)}
              <option value={AUTRE_FREQUENCE}>Autre (préciser)…</option>
            </select>
            <input className="input" placeholder="Produit habituel" value={planForm.produit_habituel} onChange={e => setPlanForm(f => ({ ...f, produit_habituel: e.target.value }))} />
            <input className="input" placeholder="Responsable *" value={planForm.responsable} onChange={e => setPlanForm(f => ({ ...f, responsable: e.target.value }))} />
            {planForm.frequence === AUTRE_FREQUENCE && (
              <input className="input" placeholder="Préciser la fréquence" value={customFrequence} onChange={e => setCustomFrequence(e.target.value)} />
            )}
          </div>
          {planError && <p className="error-msg">Zone et responsable sont obligatoires.</p>}
          {savedPlan && <p className="saved-msg">✓ Enregistré</p>}
          <button className="btn" disabled={savingPlan} onClick={addPlan}>{savingPlan ? 'Ajout…' : 'Ajouter au plan'}</button>

          <div className="row-list" style={{ marginTop: 14 }}>
            {planActif.length === 0 && <div className="row-item">Aucun point défini pour l'instant.</div>}
            {planActif.map(p => {
              const derniere = derniereExecution(p.id);
              const retard = retardEnJours(p.frequence, derniere ? derniere.created_at : p.created_at);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className="row-item"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: 2, background: p.id === selectedPlanId ? 'var(--surface-alt)' : 'transparent' }}
                >
                  <span><b>{p.zone}</b> {p.frequence && `· ${p.frequence}`} {retard != null && <span className="chip warn" style={{ marginLeft: 6 }}>En retard ({retard} j)</span>}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>
                    {derniere ? `Dernier passage : ${new Date(derniere.created_at).toLocaleDateString('fr-FR')}` : 'Jamais encore enregistré'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {!selected ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>Sélectionnez (ou créez) un point du plan pour enregistrer un passage.</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Enregistrer un passage — {selected.zone}</h3>
                <button className="link-btn" onClick={() => retirerPlan(selected.id)}>Retirer ce point du plan</button>
              </div>
              <div className="grid2" style={{ gap: 8, marginBottom: 10 }}>
                <input className="input" placeholder={`Produit (${selected.produit_habituel || 'habituel'})`} value={execForm.produit_utilise} onChange={e => setExecForm(f => ({ ...f, produit_utilise: e.target.value }))} />
                <input className="input" type="date" value={execForm.date_intervention} onChange={e => setExecForm(f => ({ ...f, date_intervention: e.target.value }))} />
                <input className="input" placeholder="Responsable *" value={execForm.responsable} onChange={e => setExecForm(f => ({ ...f, responsable: e.target.value }))} />
              </div>
              {execError && <p className="error-msg">Le responsable est obligatoire.</p>}
              {savedExec && <p className="saved-msg">✓ Enregistré</p>}
              <button className="btn" disabled={savingExec} onClick={enregistrerExecution}>{savingExec ? 'Enregistrement…' : 'Enregistrer ce passage'}</button>

              <h3>Historique de ce point</h3>
              <div className="hist-wrap">
                <table className="hist-table">
                  <thead><tr><th>Date</th><th>Produit</th><th>Responsable</th><th>Saisi le</th><th>Statut</th><th></th></tr></thead>
                  <tbody>
                    {historiqueDuPoint.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--ink-faint)' }}>Aucun passage enregistré pour ce point.</td></tr>}
                    {historiqueDuPoint.map(e => (
                      <tr key={e.id} className={e.annule ? 'annule' : ''}>
                        <td>{e.date_intervention || '—'}</td>
                        <td>{e.produit_utilise || '—'}</td>
                        <td>{e.responsable}</td>
                        <td>{new Date(e.created_at).toLocaleString('fr-FR')}</td>
                        <td>{e.annule ? <span className="chip warn">Annulé</span> : <span className="chip ok">Valide</span>}</td>
                        <td>{!e.annule && <button className="link-btn" onClick={() => annulerExecution(e.id)}>Annuler</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <h3>Historique complet (tous les points)</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="link-btn" onClick={doExport}>Exporter en CSV</button>
          <button className="link-btn" onClick={doExportXlsx}>Exporter en Excel</button>
        </div>
      </div>
      <input
        className="input search-input"
        placeholder="Rechercher (zone, produit, responsable)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="hist-wrap">
        <table className="hist-table stack">
          <thead>
            <tr><th>Zone / équipement</th><th>Produit</th><th>Fréquence</th><th>Responsable</th><th>Date</th><th>Saisi le</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {executionsFiltrees.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--ink-faint)' }}>Aucun passage enregistré.</td></tr>}
            {executionsFiltrees.map(n => (
              <tr key={n.id} className={n.annule ? 'annule' : ''}>
                <td data-label="Zone / équipement">{n.zone}</td>
                <td data-label="Produit">{n.produit_utilise || '—'}</td>
                <td data-label="Fréquence">{n.frequence || '—'}</td>
                <td data-label="Responsable">{n.responsable}</td>
                <td data-label="Date">{n.date_intervention || '—'}</td>
                <td data-label="Saisi le">{new Date(n.created_at).toLocaleString('fr-FR')}</td>
                <td data-label="Statut">{n.annule ? <span className="chip warn">Annulé</span> : <span className="chip ok">Valide</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
