'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { exportCSV, exportExcel } from '@/lib/csv';
import { today, getLastResponsable, rememberResponsable } from '@/lib/prefs';
import { useSavedFlag } from '@/lib/useSavedFlag';

const BLANK = { etape: '', danger: '', mesure_maitrise: '', ccp: false, limite_critique: '', surveillance: '', action_corrective: '', verification: '', responsable: '' };

const ETAPES_TYPES = [
  { etape: 'Réception matières premières', danger: 'Contamination, fruits/légumes non conformes', mesure_maitrise: 'Contrôle visuel et olfactif à réception, contrôle des bons de livraison', ccp: false, limite_critique: 'Absence de moisissure, DLC fournisseur valide', surveillance: 'À chaque réception', action_corrective: 'Refus du lot non conforme, retour fournisseur', verification: 'Trimestrielle' },
  { etape: 'Cuisson / stérilisation', danger: 'Survie de micro-organismes pathogènes', mesure_maitrise: 'Respect du temps et de la température de cuisson selon la recette', ccp: true, limite_critique: 'Température à cœur ≥ seuil défini pour le produit', surveillance: 'À chaque production, sonde thermique', action_corrective: 'Prolonger la cuisson, écarter le lot si doute', verification: 'Mensuelle' },
  { etape: 'Mise en pot / conditionnement', danger: "Contamination croisée, défaut d'étanchéité", mesure_maitrise: 'Pots et couvercles stérilisés, poste de travail désinfecté', ccp: true, limite_critique: 'Pot fermé hermétiquement, absence de choc thermique anormal', surveillance: 'Contrôle visuel de chaque lot', action_corrective: 'Isoler et réanalyser les pots suspects', verification: 'Mensuelle' },
  { etape: 'Étiquetage', danger: "Erreur d'allergène ou de DLC induisant le consommateur en erreur", mesure_maitrise: "Vérification de la fiche technique avant impression des étiquettes", ccp: false, limite_critique: 'Conformité totale avec la fiche technique produit', surveillance: "À chaque nouveau lot d'étiquettes", action_corrective: "Retrait et réétiquetage du lot concerné", verification: 'Trimestrielle' },
  { etape: 'Stockage', danger: 'Rupture de chaîne du froid pour les produits concernés, nuisibles', mesure_maitrise: 'Zone de stockage propre, sèche, à l\'abri de la lumière', ccp: false, limite_critique: 'Température ambiante stable, absence de nuisibles constatés', surveillance: 'Contrôle visuel hebdomadaire', action_corrective: 'Déplacement des produits, traitement de la zone', verification: 'Trimestrielle' },
];

const TEMPLATE_RAPPEL = `1. Dès qu'un doute sur la sécurité d'un produit est identifié (réclamation client, alerte fournisseur, résultat d'auto-audit), retrouver le ou les numéros de lot concernés dans le registre de traçabilité.
2. Isoler immédiatement le stock restant du ou des lots concernés, ne plus le vendre.
3. Identifier les clients ayant acheté ce lot si vente à des professionnels/revendeurs, les prévenir sans délai.
4. Consigner l'incident dans le registre de non-conformités (description, cause, action corrective).
5. Si le danger est avéré pour la santé du consommateur, informer la DDPP du département sans délai.
6. Conserver toutes les preuves des actions menées (dates, personnes contactées, quantités retirées).`;

export default function HaccpTab({ userId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [procedureRappel, setProcedureRappel] = useState('');
  const [savingProcedure, setSavingProcedure] = useState(false);
  const [verifs, setVerifs] = useState([]);
  const [verifForm, setVerifForm] = useState({ etape: '', date_verification: today(), conforme: true, observation: '', responsable: '', type_action: 'verification' });
  const [savingVerif, setSavingVerif] = useState(false);
  const [verifError, setVerifError] = useState(false);
  const [stepError, setStepError] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [savedStep, flashStep] = useSavedFlag();
  const [savedVerif, flashVerif] = useSavedFlag();
  const [search, setSearch] = useState('');

  const load = async () => {
    const [{ data }, { data: prof }, { data: v }] = await Promise.all([
      supabase.from('haccp_etapes').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('profiles').select('procedure_retrait_rappel').eq('id', userId).single(),
      supabase.from('haccp_verifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    setItems(data || []);
    setProcedureRappel(prof?.procedure_retrait_rappel || '');
    setVerifs(v || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);
  useEffect(() => {
    const nom = getLastResponsable();
    if (nom) {
      setForm(f => ({ ...f, responsable: nom }));
      setVerifForm(f => ({ ...f, responsable: nom }));
    }
  }, []);

  const enregistrerVerif = async () => {
    if (!verifForm.etape || !verifForm.responsable) { setVerifError(true); return; }
    setVerifError(false);
    setSavingVerif(true);
    await supabase.from('haccp_verifications').insert({ ...verifForm, user_id: userId });
    rememberResponsable(verifForm.responsable);
    setVerifForm({ etape: '', date_verification: today(), conforme: true, observation: '', responsable: verifForm.responsable, type_action: 'verification' });
    setSavingVerif(false);
    flashVerif();
    load();
  };

  const verifsFiltres = verifs.filter(v => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [v.etape, v.responsable, v.observation].some(val => (val || '').toLowerCase().includes(q));
  });

  const saveProcedure = async () => {
    setSavingProcedure(true);
    await supabase.from('profiles').update({ procedure_retrait_rappel: procedureRappel }).eq('id', userId);
    setSavingProcedure(false);
  };

  const actives = items.filter(i => !i.annule);
  const archivees = items.filter(i => i.annule);

  const startEdit = (item) => {
    setForm({ ...item });
    setEditingId(item.id);
  };
  const cancelEdit = () => { setForm({ ...BLANK, responsable: getLastResponsable() }); setEditingId(null); };

  const save = async () => {
    if (!form.etape || !form.responsable) { setStepError(true); return; }
    setStepError(false);
    setSavingStep(true);
    if (editingId) {
      await supabase.from('haccp_etapes').update({ annule: true, annule_at: new Date().toISOString() }).eq('id', editingId);
    }
    const { id, created_at, annule, annule_at, ...payload } = form;
    await supabase.from('haccp_etapes').insert({ ...payload, user_id: userId });
    rememberResponsable(form.responsable);
    setForm({ ...BLANK, responsable: form.responsable });
    setEditingId(null);
    setSavingStep(false);
    flashStep();
    load();
  };

  const retirer = async (id) => {
    await supabase.from('haccp_etapes').update({ annule: true, annule_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const chargerTypes = async () => {
    const responsable = form.responsable || prompt('Votre nom (obligatoire pour tracer cette initialisation) :');
    if (!responsable) return;
    await supabase.from('haccp_etapes').insert(ETAPES_TYPES.map(e => ({ ...e, responsable, user_id: userId })));
    load();
  };

  const doExport = () => exportCSV(
    'plan-haccp.csv',
    ['Étape', 'Danger', 'Mesure de maîtrise', 'CCP', 'Limite critique', 'Surveillance', 'Action corrective', 'Vérification', 'Responsable', 'Statut'],
    items.map(i => [i.etape, i.danger, i.mesure_maitrise, i.ccp ? 'Oui' : 'Non', i.limite_critique, i.surveillance, i.action_corrective, i.verification, i.responsable, i.annule ? 'Archivée' : 'Active'])
  );
  const doExportXlsx = () => exportExcel(
    'plan-haccp.xlsx',
    ['Étape', 'Danger', 'Mesure de maîtrise', 'CCP', 'Limite critique', 'Surveillance', 'Action corrective', 'Vérification', 'Responsable', 'Statut'],
    items.map(i => [i.etape, i.danger, i.mesure_maitrise, i.ccp ? 'Oui' : 'Non', i.limite_critique, i.surveillance, i.action_corrective, i.verification, i.responsable, i.annule ? 'Archivée' : 'Active'])
  );

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Plan de maîtrise sanitaire (HACCP)</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', marginBottom: 12 }}>
        Analyse des dangers propre à votre activité. Modifier une étape ne l'efface jamais : l'ancienne version est archivée, une nouvelle la remplace.
      </p>

      {actives.length === 0 && (
        <button className="btn" style={{ marginBottom: 16 }} onClick={chargerTypes}>Charger les étapes types (confiture/conserve)</button>
      )}

      <div className="grid2" style={{ marginBottom: 10 }}>
        <div><label className="label">Étape *</label><input className="input" value={form.etape} onChange={e => setForm(f => ({ ...f, etape: e.target.value }))} /></div>
        <div><label className="label">Danger identifié</label><input className="input" value={form.danger} onChange={e => setForm(f => ({ ...f, danger: e.target.value }))} /></div>
        <div><label className="label">Mesure de maîtrise</label><input className="input" value={form.mesure_maitrise} onChange={e => setForm(f => ({ ...f, mesure_maitrise: e.target.value }))} /></div>
        <div><label className="label">Limite critique</label><input className="input" value={form.limite_critique} onChange={e => setForm(f => ({ ...f, limite_critique: e.target.value }))} /></div>
        <div><label className="label">Surveillance</label><input className="input" value={form.surveillance} onChange={e => setForm(f => ({ ...f, surveillance: e.target.value }))} /></div>
        <div><label className="label">Action corrective</label><input className="input" value={form.action_corrective} onChange={e => setForm(f => ({ ...f, action_corrective: e.target.value }))} /></div>
        <div><label className="label">Vérification (fréquence)</label><input className="input" value={form.verification} onChange={e => setForm(f => ({ ...f, verification: e.target.value }))} /></div>
        <div><label className="label">Responsable *</label><input className="input" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} /></div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', marginBottom: 12 }}>
        <input type="checkbox" checked={form.ccp} onChange={e => setForm(f => ({ ...f, ccp: e.target.checked }))} />
        Cette étape est un point critique de contrôle (CCP)
      </label>
      {stepError && <p className="error-msg">L'étape et le responsable sont obligatoires.</p>}
      {savedStep && <p className="saved-msg">✓ Enregistré</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" disabled={savingStep} onClick={save}>{savingStep ? 'Enregistrement…' : editingId ? 'Enregistrer la nouvelle version' : "Ajouter l'étape"}</button>
        {editingId && <button className="link-btn" onClick={cancelEdit}>Annuler la modification</button>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Plan actuel ({actives.length} étape{actives.length > 1 ? 's' : ''})</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="link-btn" onClick={doExport}>Exporter en CSV</button>
          <button className="link-btn" onClick={doExportXlsx}>Exporter en Excel</button>
        </div>
      </div>
      {actives.length === 0 ? (
        <div className="hist-wrap"><div style={{ padding: 14, color: 'var(--ink-faint)', fontSize: '.85rem' }}>Aucune étape définie pour l'instant.</div></div>
      ) : (
        <div className="haccp-plan">
          {actives.map(i => (
            <div key={i.id} className="haccp-card">
              <div className="haccp-card-head">
                <span className="haccp-card-title">
                  {i.etape}
                  {i.ccp && <span className="chip warn" style={{ marginLeft: 8 }}>CCP</span>}
                </span>
                <div className="haccp-card-actions">
                  <button className="link-btn" onClick={() => startEdit(i)}>Modifier</button>
                  <button className="link-btn" onClick={() => retirer(i.id)}>Retirer</button>
                </div>
              </div>
              <div className="haccp-detail-grid">
                <div><span className="label">Danger identifié</span><p>{i.danger || '—'}</p></div>
                <div><span className="label">Mesure de maîtrise</span><p>{i.mesure_maitrise || '—'}</p></div>
                <div><span className="label">Limite critique</span><p>{i.limite_critique || '—'}</p></div>
                <div><span className="label">Surveillance</span><p>{i.surveillance || '—'}</p></div>
                <div><span className="label">Action corrective</span><p>{i.action_corrective || '—'}</p></div>
                <div><span className="label">Vérification (fréquence)</span><p>{i.verification || '—'}</p></div>
              </div>
              <div className="haccp-card-footer">Responsable : <b>{i.responsable}</b></div>
            </div>
          ))}
        </div>
      )}

      {archivees.length > 0 && (
        <>
          <button className="link-btn" style={{ marginTop: 14 }} onClick={() => setShowHistory(s => !s)}>
            {showHistory ? 'Masquer' : 'Voir'} les {archivees.length} version{archivees.length > 1 ? 's' : ''} archivée{archivees.length > 1 ? 's' : ''}
          </button>
          {showHistory && (
            <div className="hist-wrap" style={{ marginTop: 8 }}>
              <table className="hist-table">
                <thead><tr><th>Étape</th><th>Limite critique</th><th>Responsable</th><th>Archivée le</th></tr></thead>
                <tbody>
                  {archivees.map(i => (
                    <tr key={i.id} className="annule">
                      <td>{i.etape}</td><td>{i.limite_critique || '—'}</td><td>{i.responsable}</td>
                      <td>{i.annule_at ? new Date(i.annule_at).toLocaleString('fr-FR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <h3 style={{ marginTop: 28 }}>Journal de vérification</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', marginBottom: 10 }}>
        Enregistrez ici chaque vérification ou surveillance réelle d'une étape — c'est la preuve que les contrôles prévus sont vraiment effectués.
      </p>
      
      {/* Modification de gridTemplateColumns pour s'adapter dynamiquement aux 6 éléments désormais présents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
        <select className="select-field" value={verifForm.etape} onChange={e => setVerifForm(f => ({ ...f, etape: e.target.value }))}>
          <option value="">— Étape —</option>
          {actives.map(i => <option key={i.id} value={i.etape}>{i.etape}</option>)}
        </select>
        
        {/* Nouveau sélecteur pour le type de contrôle */}
        <select className="select-field" value={verifForm.type_action} onChange={e => setVerifForm(f => ({ ...f, type_action: e.target.value }))}>
          <option value="verification">Vérification</option>
          <option value="surveillance">Surveillance</option>
        </select>
        
        <input className="input" type="date" value={verifForm.date_verification} onChange={e => setVerifForm(f => ({ ...f, date_verification: e.target.value }))} />
        <select className="select-field" value={verifForm.conforme ? '1' : '0'} onChange={e => setVerifForm(f => ({ ...f, conforme: e.target.value === '1' }))}>
          <option value="1">Conforme</option>
          <option value="0">Non conforme</option>
        </select>
        <input className="input" placeholder="Observation (optionnel)" value={verifForm.observation} onChange={e => setVerifForm(f => ({ ...f, observation: e.target.value }))} />
        <input className="input" placeholder="Responsable *" value={verifForm.responsable} onChange={e => setVerifForm(f => ({ ...f, responsable: e.target.value }))} />
      </div>
      {verifError && <p className="error-msg">L'étape et le responsable sont obligatoires.</p>}
      {savedVerif && <p className="saved-msg">✓ Enregistré</p>}
      <button className="btn" disabled={savingVerif} onClick={enregistrerVerif}>{savingVerif ? 'Enregistrement…' : "Enregistrer l'action"}</button>

      <input
        className="input search-input"
        style={{ marginTop: 14 }}
        placeholder="Rechercher (étape, responsable, observation)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="hist-wrap">
        <table className="hist-table stack">
          <thead><tr><th>Date</th><th>Étape</th><th>Type</th><th>Résultat</th><th>Observation</th><th>Responsable</th></tr></thead>
          <tbody>
            {verifsFiltres.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--ink-faint)' }}>Aucun enregistrement.</td></tr>}
            {verifsFiltres.map(v => (
              <tr key={v.id} className={v.annule ? 'annule' : ''}>
                <td data-label="Date">{v.date_verification || '—'}</td>
                <td data-label="Étape">{v.etape}</td>
                <td data-label="Type">
                  <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
                    {v.type_action === 'surveillance' ? '👁️ Surveillance' : '✅ Vérification'}
                  </span>
                </td>
                <td data-label="Résultat">{v.conforme ? <span className="chip ok">Conforme</span> : <span className="chip warn">Non conforme</span>}</td>
                <td data-label="Observation">{v.observation || '—'}</td>
                <td data-label="Responsable">{v.responsable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 28 }}>Procédure de retrait/rappel produit</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', marginBottom: 10 }}>
        Ce document explique comment réagir en cas de doute sur la sécurité d'un produit déjà vendu — une pièce attendue dans tout plan de maîtrise sanitaire.
      </p>
      {!procedureRappel && (
        <button className="link-btn" style={{ marginBottom: 10 }} onClick={() => setProcedureRappel(TEMPLATE_RAPPEL)}>Charger un modèle de procédure</button>
      )}
      <textarea
        className="input"
        rows={8}
        style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '.85rem' }}
        value={procedureRappel}
        onChange={e => setProcedureRappel(e.target.value)}
      />
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={saveProcedure} disabled={savingProcedure}>{savingProcedure ? 'Enregistrement…' : 'Enregistrer la procédure'}</button>
      </div>
    </div>
  );
}
