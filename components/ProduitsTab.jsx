'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export const FIELDS = [
  { key: 'nom', label: 'Nom du produit' },
  { key: 'poids', label: 'Poids' },
  { key: 'poids_egoutte', label: 'Poids égoutté' },
  { key: 'ingredients', label: 'Ingrédients' },
  { key: 'pourcentage_principal', label: '% ingrédient principal' },
  { key: 'allergenes', label: 'Allergènes' },
  { key: 'origine', label: 'Origine' },
  { key: 'numero_lot', label: 'N° de lot' },
  { key: 'dlc', label: 'DLC / DDM' },
  { key: 'quantite', label: 'Quantité' },
  { key: 'conservation', label: 'Conservation' },
  { key: 'exploitant', label: 'Nom et adresse exploitant' },
  { key: 'declaration_nutritionnelle', label: 'Déclaration nutritionnelle' },
  { key: 'consignes_tri', label: 'Consignes de tri (Info-tri)' },
];

export const FONT_OPTIONS = [
  { value: "'Inter',-apple-system,sans-serif", label: 'Sans (moderne)' },
  { value: "Georgia,'Times New Roman',serif", label: 'Serif (classique)' },
  { value: "'Playfair Display',serif", label: 'Élégante' },
  { value: "'Caveat',cursive", label: 'Manuscrite' },
  { value: "'Poppins',sans-serif", label: 'Ronde' },
];

const FIELD_STYLE_DEFAULT = { font: FONT_OPTIONS[0].value, bold: true, italic: false, color: '#1A2530' };

export const DEFAULT_LAYOUT = {
  nom: { x: 28, y: 4, size: 14, visible: true, ...FIELD_STYLE_DEFAULT },
  poids: { x: 28, y: 13, size: 10, visible: true, ...FIELD_STYLE_DEFAULT },
  poids_egoutte: { x: 28, y: 20, size: 8, visible: false, ...FIELD_STYLE_DEFAULT },
  ingredients: { x: 5, y: 26, size: 9, visible: true, ...FIELD_STYLE_DEFAULT },
  pourcentage_principal: { x: 5, y: 33, size: 8, visible: true, ...FIELD_STYLE_DEFAULT },
  allergenes: { x: 5, y: 40, size: 9, visible: true, ...FIELD_STYLE_DEFAULT },
  origine: { x: 5, y: 47, size: 8, visible: false, ...FIELD_STYLE_DEFAULT },
  numero_lot: { x: 5, y: 54, size: 9, visible: true, ...FIELD_STYLE_DEFAULT },
  dlc: { x: 5, y: 61, size: 9, visible: true, ...FIELD_STYLE_DEFAULT },
  quantite: { x: 5, y: 68, size: 9, visible: true, ...FIELD_STYLE_DEFAULT },
  conservation: { x: 5, y: 75, size: 9, visible: true, ...FIELD_STYLE_DEFAULT },
  declaration_nutritionnelle: { x: 5, y: 82, size: 7, visible: false, ...FIELD_STYLE_DEFAULT },
  consignes_tri: { x: 5, y: 89, size: 7, visible: true, ...FIELD_STYLE_DEFAULT },
  exploitant: { x: 5, y: 95, size: 7, visible: true, ...FIELD_STYLE_DEFAULT },
};

export function mergedLayout(saved) {
  const merged = {};
  for (const k of Object.keys(DEFAULT_LAYOUT)) {
    merged[k] = { ...DEFAULT_LAYOUT[k], ...(saved?.[k] || {}) };
  }
  return merged;
}

function previewValue(key, p, profile) {
  switch (key) {
    case 'nom': return p.nom;
    case 'poids': return p.poids || 'poids';
    case 'poids_egoutte': return p.poids_egoutte ? `Poids égoutté : ${p.poids_egoutte}` : '';
    case 'ingredients': return `Ingrédients : ${p.ingredients || '—'}`;
    case 'pourcentage_principal': return p.pourcentage_principal ? `Teneur : ${p.pourcentage_principal}` : '';
    case 'allergenes': return `Allergènes : ${p.allergenes || 'aucun'}`;
    case 'origine': return p.origine ? `Origine : ${p.origine}` : '';
    case 'numero_lot': return 'N° de lot : au moment de la production';
    case 'dlc': return `${p.type_date === 'DDM' ? 'DDM' : 'DLC'} : définie par lot`;
    case 'quantite': return 'Quantité : définie par lot';
    case 'conservation': return `Conservation : ${p.conservation || '—'}`;
    case 'declaration_nutritionnelle': return p.declaration_nutritionnelle ? `Valeurs nutritionnelles : ${p.declaration_nutritionnelle}` : '';
    case 'consignes_tri': return p.consignes_tri ? `Tri : ${p.consignes_tri}` : '';
    case 'exploitant': return (profile?.nom_exploitant || profile?.adresse_exploitant)
      ? `${profile?.nom_exploitant || ''} — ${profile?.adresse_exploitant || ''}` : "À renseigner ci-dessous";
    default: return '';
  }
}

const INK = '#1A1A1A';
const INK_MUTED = '#6B6B6B';
const LINE = '#DADADA';
const SANS = "'Inter',-apple-system,sans-serif";

export const CONTENANT_INFO = {
  verre: { texte: 'Pot en verre → bac de tri verre.' },
  verre_metal: { texte: 'Pot en verre → bac verre. Couvercle métal → bac emballages.' },
  plastique: { texte: 'Emballage plastique → bac de tri emballages.' },
  metal: { texte: 'Emballage métal → bac de tri emballages.' },
  carton: { texte: 'Emballage carton → bac papier/carton.' },
  autre: { texte: '' },
};

export function GenericLabel({
  nom, poids, poidsEgoutte, ingredients, pourcentage, allergenes, origine,
  declarationNutritionnelle, numeroLot, dlc, quantite, conservation, consignesTri,
  exploitantNom, exploitantAdresse, typeDate, placeholder,
}) {
  const muted = placeholder ? { color: '#B0B0B0', fontStyle: 'italic', fontWeight: 400 } : {};
  const label = typeDate === 'DDM' ? 'DDM' : 'DLC';
  return (
    <div style={{
      background: '#FFFFFF', border: `1px solid ${LINE}`,
      padding: '20px 22px', fontFamily: SANS, color: INK, maxWidth: 320, boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: '.62rem', letterSpacing: '.14em', color: INK_MUTED, fontWeight: 600 }}>FABRICATION ARTISANALE</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2, marginTop: 5 }}>{nom || 'Nom du produit'}</div>
      <div style={{ fontSize: '.76rem', color: INK_MUTED, marginTop: 3 }}>
        {poids || 'poids'}{poidsEgoutte ? ` · égoutté ${poidsEgoutte}` : ''}
      </div>
      <div style={{ height: 1, background: INK, margin: '12px 0' }} />

      <div style={{ fontSize: '.72rem', lineHeight: 1.6, marginBottom: 10 }}>
        <span style={{ fontWeight: 700 }}>Ingrédients : </span>{ingredients || '—'}
        {pourcentage && <span style={{ color: INK_MUTED }}> ({pourcentage})</span>}
      </div>

      <div style={{ border: `1px solid ${INK}`, padding: '7px 10px', marginBottom: 12, fontSize: '.72rem' }}>
        <span style={{ fontWeight: 700 }}>Allergènes : </span>{allergenes || 'aucun'}
      </div>

      {origine && <div style={{ fontSize: '.7rem', marginBottom: 8 }}><b>Origine :</b> {origine}</div>}

      <div style={{ fontSize: '.6rem', letterSpacing: '.1em', color: INK_MUTED, fontWeight: 700, marginTop: 14, marginBottom: 6 }}>INFORMATIONS RÉGLEMENTAIRES</div>
      <div style={{ border: `1px solid ${LINE}`, padding: '9px 10px', fontSize: '.72rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div><span style={{ fontWeight: 700 }}>N° de lot : </span><span style={muted}>{numeroLot}</span></div>
        <div><span style={{ fontWeight: 700 }}>{label} : </span><span style={muted}>{dlc || 'à compléter'}</span></div>
        {quantite && <div><span style={{ fontWeight: 700 }}>Quantité : </span>{quantite} unités</div>}
        <div><span style={{ fontWeight: 700 }}>Conservation : </span>{conservation || '—'}</div>
      </div>

      {declarationNutritionnelle && (
        <div style={{ fontSize: '.65rem', color: INK_MUTED, marginTop: 10 }}>
          <b>Valeurs nutritionnelles (100g) :</b> {declarationNutritionnelle}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 12, paddingTop: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ fontSize: '.62rem', color: INK_MUTED, lineHeight: 1.4 }}>
          {exploitantNom || 'Exploitant à renseigner'}{exploitantAdresse ? ` — ${exploitantAdresse}` : ''}
        </div>
        {consignesTri && (
          <div style={{ fontSize: '.6rem', color: INK_MUTED, textAlign: 'right', maxWidth: '55%', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 700, letterSpacing: '.06em', color: INK }}>TRI</div>
            {consignesTri}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProduitsTab({ userId }) {
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [exploitantForm, setExploitantForm] = useState({ nom_exploitant: '', adresse_exploitant: '' });
  const [form, setForm] = useState({ nom: '', ingredients: '', allergenes: '', poids: '', poids_egoutte: '', pourcentage_principal: '', origine: '', dlc: '', conservation: '', declaration_nutritionnelle: '', consignes_tri: '', type_contenant: '', type_date: 'DLC' });
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [selected, setSelected] = useState(null); // { type: 'field'|'custom', key }
  const wrapRef = useRef(null);
  const dragRef = useRef(null);

  const load = async () => {
    const [{ data }, { data: prof }] = await Promise.all([
      supabase.from('produits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('profiles').select('nom_exploitant, adresse_exploitant').eq('id', userId).single(),
    ]);
    setItems(data || []);
    setProfile(prof || null);
    setExploitantForm({ nom_exploitant: prof?.nom_exploitant || '', adresse_exploitant: prof?.adresse_exploitant || '' });
    if (data?.length && !activeId) setActiveId(data[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const active = items.find(p => p.id === activeId);
  useEffect(() => {
    if (active) {
      setLayout(mergedLayout(active.etiquette_layout));
      setCustomBlocks(active.etiquette_custom_blocks || []);
    }
    setSelected(null);
  }, [activeId, active?.etiquette_layout, active?.etiquette_custom_blocks]);

  const add = async () => {
    if (!form.nom) return;
    const { data } = await supabase.from('produits').insert({ ...form, user_id: userId }).select().single();
    setForm({ nom: '', ingredients: '', allergenes: '', poids: '', poids_egoutte: '', pourcentage_principal: '', origine: '', dlc: '', conservation: '', declaration_nutritionnelle: '', consignes_tri: '', type_contenant: '', type_date: 'DLC' });
    await load();
    if (data) setActiveId(data.id);
  };

  const saveExploitant = async () => {
    await supabase.from('profiles').update(exploitantForm).eq('id', userId);
    load();
  };

  const imageUrl = (path) => path ? supabase.storage.from('etiquettes').getPublicUrl(path).data.publicUrl : null;

  const persistLayout = async (newLayout) => {
    await supabase.from('produits').update({ etiquette_layout: newLayout }).eq('id', active.id);
  };
  const persistCustomBlocks = async (blocks) => {
    await supabase.from('produits').update({ etiquette_custom_blocks: blocks }).eq('id', active.id);
  };

  const uploadEtiquette = async (file) => {
    if (!active || !file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${userId}/${active.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('etiquettes').upload(path, file, { upsert: true });
    if (uploadError) {
      alert("Erreur lors de l'envoi de l'image : " + uploadError.message);
      setUploading(false);
      return;
    }
    const { error: updateError } = await supabase.from('produits').update({ etiquette_image_path: path, etiquette_layout: DEFAULT_LAYOUT, etiquette_custom_blocks: [] }).eq('id', active.id);
    if (updateError) {
      alert("Image envoyée, mais erreur d'enregistrement sur la fiche produit : " + updateError.message);
    } else {
      await load();
    }
    setUploading(false);
  };

  const supprimerEtiquette = async () => {
    await supabase.from('produits').update({ etiquette_image_path: null }).eq('id', active.id);
    load();
  };

  // ---- Glisser (champs ET blocs libres) ----
  const onMouseDownTarget = (type, key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected({ type, key });
    dragRef.current = { type, key };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const xPct = Math.min(95, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.min(97, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
      const { type, key } = dragRef.current;
      if (type === 'field') {
        setLayout(prev => ({ ...prev, [key]: { ...prev[key], x: xPct, y: yPct } }));
      } else {
        setCustomBlocks(prev => prev.map(b => b.id === key ? { ...b, x: xPct, y: yPct } : b));
      }
    };
    const onUp = async () => {
      if (!dragRef.current || !active) { dragRef.current = null; return; }
      const { type } = dragRef.current;
      dragRef.current = null;
      if (type === 'field') await persistLayout(layout);
      else await persistCustomBlocks(customBlocks);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [active, layout, customBlocks]);

  const updateFieldStyle = (key, patch) => {
    const next = { ...layout, [key]: { ...layout[key], ...patch } };
    setLayout(next);
    persistLayout(next);
  };
  const toggleVisible = (key) => updateFieldStyle(key, { visible: !(layout[key]?.visible ?? true) });

  const addCustomBlock = () => {
    const block = { id: 'c' + Date.now(), text: 'Votre texte', x: 40, y: 50, size: 10, font: FONT_OPTIONS[0].value, bold: false, italic: false, color: '#1A2530' };
    const next = [...customBlocks, block];
    setCustomBlocks(next);
    persistCustomBlocks(next);
    setSelected({ type: 'custom', key: block.id });
  };
  const updateCustomBlock = (id, patch) => {
    const next = customBlocks.map(b => b.id === id ? { ...b, ...patch } : b);
    setCustomBlocks(next);
    persistCustomBlocks(next);
  };
  const removeCustomBlock = (id) => {
    const next = customBlocks.filter(b => b.id !== id);
    setCustomBlocks(next);
    persistCustomBlocks(next);
    setSelected(null);
  };

  const selectedFieldCfg = selected?.type === 'field' ? layout[selected.key] : null;
  const selectedBlockCfg = selected?.type === 'custom' ? customBlocks.find(b => b.id === selected.key) : null;
  const selectedCfg = selectedFieldCfg || selectedBlockCfg;
  const applyToSelected = (patch) => {
    if (selected?.type === 'field') updateFieldStyle(selected.key, patch);
    else if (selected?.type === 'custom') updateCustomBlock(selected.key, patch);
  };

  if (loading) return <p>Chargement…</p>;

  const exploitantManquant = !profile?.nom_exploitant || !profile?.adresse_exploitant;

  return (
    <div>
      <div style={{ background: exploitantManquant ? '#FBEFE8' : 'var(--surface-alt)', border: `1px solid ${exploitantManquant ? '#E0B48A' : 'var(--line)'}`, borderRadius: 6, padding: 14, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Vos coordonnées d'exploitant {exploitantManquant && <span style={{ color: 'var(--red)', fontWeight: 400, fontSize: '.8rem' }}>— obligatoires sur toute étiquette, à renseigner</span>}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'end' }}>
          <div><label className="label">Nom / raison sociale</label><input className="input" value={exploitantForm.nom_exploitant} onChange={e => setExploitantForm(f => ({ ...f, nom_exploitant: e.target.value }))} /></div>
          <div><label className="label">Adresse complète</label><input className="input" value={exploitantForm.adresse_exploitant} onChange={e => setExploitantForm(f => ({ ...f, adresse_exploitant: e.target.value }))} /></div>
          <button className="btn" onClick={saveExploitant}>Enregistrer</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>Nouvelle fiche produit</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['nom', 'Nom du produit'], ['poids', 'Poids net'], ['poids_egoutte', 'Poids égoutté (si applicable)'], ['pourcentage_principal', '% ingrédient principal (ex: 55% de fruits)'], ['ingredients', 'Ingrédients'], ['allergenes', 'Allergènes'], ['origine', 'Origine (si nécessaire)']].map(([k, l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label className="label">Type de contenant (pour le texte de tri suggéré)</label>
              <select
                className="select-field"
                value={form.type_contenant}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, type_contenant: val, consignes_tri: f.consignes_tri || CONTENANT_INFO[val]?.texte || f.consignes_tri }));
                }}
              >
                <option value="">— Choisir —</option>
                <option value="verre">Verre (pot)</option>
                <option value="verre_metal">Verre + couvercle métal</option>
                <option value="plastique">Plastique</option>
                <option value="metal">Métal</option>
                <option value="carton">Carton</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="label">Type de date (DLC ou DDM)</label>
              <select className="select-field" value={form.type_date} onChange={e => setForm(f => ({ ...f, type_date: e.target.value }))}>
                <option value="DLC">DLC — Date Limite de Consommation</option>
                <option value="DDM">DDM — Date de Durabilité Minimale</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Conservation (avant et après ouverture)</label>
            <input className="input" placeholder="Ex : à conserver au sec ; après ouverture, au réfrigérateur et à consommer sous 3 semaines" value={form.conservation} onChange={e => setForm(f => ({ ...f, conservation: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Déclaration nutritionnelle (non obligatoire si vous fournissez le consommateur final directement ou en faibles quantités à des commerces locaux)</label>
            <textarea className="input" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} value={form.declaration_nutritionnelle} onChange={e => setForm(f => ({ ...f, declaration_nutritionnelle: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <label className="label">Consignes de tri de l'emballage (Info-tri — obligatoire sur tout emballage vendu aux ménages)</label>
            <textarea className="input" rows={2} placeholder="Ex : Pot en verre → bac verre. Couvercle métal → bac emballages." style={{ resize: 'vertical', fontFamily: 'inherit' }} value={form.consignes_tri} onChange={e => setForm(f => ({ ...f, consignes_tri: e.target.value }))} />
          </div>
          <p style={{ fontSize: '.73rem', color: 'var(--red)', marginTop: -2, marginBottom: 12 }}>
            ⚠ Ce texte ne remplace pas le logo Triman obligatoire, à obtenir via un éco-organisme agréé (ex: citeo.com/telecharger-info-tri-et-fichiers-graphiques) puis à intégrer à votre image d'étiquette importée.
          </p>
          <button className="btn" onClick={add}>Ajouter à la gamme</button>

          <h3>Votre gamme ({items.length})</h3>
          <div className="row-list">
            {items.length === 0 && <div className="row-item">Aucun produit enregistré.</div>}
            {items.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className="row-item"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: p.id === activeId ? 'var(--surface-alt)' : 'transparent', border: 'none', borderBottom: '1px solid var(--line)' }}
              >
                <span><b>{p.nom}</b> — {p.poids}</span>
                <span style={{ color: 'var(--ink-faint)', fontSize: '.78rem' }}>{p.allergenes || 'aucun allergène'}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Aperçu du modèle d'étiquette</h3>
          {!active ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>Sélectionnez un produit dans votre gamme.</p>
          ) : active.etiquette_image_path ? (
            <>
              <div
                ref={wrapRef}
                onClick={() => setSelected(null)}
                style={{ position: 'relative', width: '100%', maxWidth: 340, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', userSelect: 'none' }}
              >
                <img src={imageUrl(active.etiquette_image_path)} alt="Modèle d'étiquette" style={{ width: '100%', display: 'block' }} draggable={false} />
                {FIELDS.filter(f => layout[f.key]?.visible !== false && previewValue(f.key, active, profile)).map(f => {
                  const cfg = layout[f.key];
                  const isSel = selected?.type === 'field' && selected.key === f.key;
                  return (
                    <div
                      key={f.key}
                      onMouseDown={onMouseDownTarget('field', f.key)}
                      onClick={(e) => { e.stopPropagation(); setSelected({ type: 'field', key: f.key }); }}
                      style={{
                        position: 'absolute', left: `${cfg.x}%`, top: `${cfg.y}%`,
                        cursor: 'move', fontSize: `${cfg.size}px`, lineHeight: 1.3,
                        fontWeight: cfg.bold ? 700 : 400, fontStyle: cfg.italic ? 'italic' : 'normal',
                        fontFamily: cfg.font, textShadow: '0 1px 2px rgba(255,255,255,.6), 0 0 6px rgba(255,255,255,.4)',
                        color: cfg.color, maxWidth: '60%',
                        outline: isSel ? '2px dashed var(--blue)' : '1px dashed rgba(0,0,0,.15)',
                        padding: 2, background: 'rgba(255,255,255,.25)', borderRadius: 3,
                      }}
                    >
                      {previewValue(f.key, active, profile)}
                    </div>
                  );
                })}
                {customBlocks.map(b => {
                  const isSel = selected?.type === 'custom' && selected.key === b.id;
                  return (
                    <div
                      key={b.id}
                      onMouseDown={onMouseDownTarget('custom', b.id)}
                      onClick={(e) => { e.stopPropagation(); setSelected({ type: 'custom', key: b.id }); }}
                      style={{
                        position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
                        cursor: 'move', fontSize: `${b.size}px`, lineHeight: 1.3,
                        fontWeight: b.bold ? 700 : 400, fontStyle: b.italic ? 'italic' : 'normal',
                        fontFamily: b.font, textShadow: '0 1px 2px rgba(255,255,255,.6), 0 0 6px rgba(255,255,255,.4)',
                        color: b.color, maxWidth: '60%',
                        outline: isSel ? '2px dashed var(--green)' : '1px dashed rgba(47,107,79,.3)',
                        padding: 2, background: 'rgba(255,255,255,.25)', borderRadius: 3,
                      }}
                    >
                      {b.text}
                    </div>
                  );
                })}
              </div>

              {selected && selectedCfg && (
                <div style={{ padding: 10, background: 'var(--surface-alt)', borderRadius: 4, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 600 }}>
                    {selected.type === 'field' ? FIELDS.find(f => f.key === selected.key)?.label : 'Bloc de texte libre'}
                  </span>

                  {selected.type === 'custom' && (
                    <input className="input" value={selectedCfg.text} onChange={e => applyToSelected({ text: e.target.value })} />
                  )}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="select-field" style={{ width: 150 }} value={selectedCfg.font} onChange={e => applyToSelected({ font: e.target.value })}>
                      {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <button className="btn btn-sm" style={{ padding: '4px 10px' }} onClick={() => applyToSelected({ size: Math.max(6, selectedCfg.size - 1) })}>A−</button>
                    <button className="btn btn-sm" style={{ padding: '4px 10px' }} onClick={() => applyToSelected({ size: Math.min(28, selectedCfg.size + 1) })}>A+</button>
                    <button className="btn btn-sm" style={{ padding: '4px 10px', fontWeight: 700, background: selectedCfg.bold ? 'var(--blue)' : 'var(--surface)', color: selectedCfg.bold ? '#fff' : 'var(--ink)' }} onClick={() => applyToSelected({ bold: !selectedCfg.bold })}>G</button>
                    <button className="btn btn-sm" style={{ padding: '4px 10px', fontStyle: 'italic', background: selectedCfg.italic ? 'var(--blue)' : 'var(--surface)', color: selectedCfg.italic ? '#fff' : 'var(--ink)' }} onClick={() => applyToSelected({ italic: !selectedCfg.italic })}>I</button>
                    <input type="color" value={selectedCfg.color} onChange={e => applyToSelected({ color: e.target.value })} style={{ width: 34, height: 30, padding: 2, border: '1px solid var(--line)', borderRadius: 4 }} />
                    {selected.type === 'field'
                      ? <button className="link-btn" onClick={() => toggleVisible(selected.key)}>Masquer</button>
                      : <button className="link-btn" onClick={() => removeCustomBlock(selected.key)}>Supprimer ce bloc</button>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <p style={{ fontSize: '.75rem', color: 'var(--ink-soft)', margin: 0 }}>
                  Cliquez un élément pour le personnaliser (police, taille, gras, italique, couleur), ou glissez-le pour le repositionner.
                </p>
                <button className="btn btn-sm" onClick={addCustomBlock}>+ Bloc de texte</button>
              </div>

              <div style={{ marginTop: 10 }}>
                <span className="label">Champs affichés</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FIELDS.map(f => (
                    <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem' }}>
                      <input type="checkbox" checked={layout[f.key]?.visible !== false} onChange={() => toggleVisible(f.key)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <button className="link-btn" style={{ marginTop: 10 }} onClick={supprimerEtiquette}>Retirer ce modèle</button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <GenericLabel
                  nom={active.nom} poids={active.poids} poidsEgoutte={active.poids_egoutte}
                  ingredients={active.ingredients} pourcentage={active.pourcentage_principal}
                  allergenes={active.allergenes} origine={active.origine}
                  declarationNutritionnelle={active.declaration_nutritionnelle}
                  numeroLot="au moment de la production" dlc="" quantite=""
                  conservation={active.conservation} consignesTri={active.consignes_tri}
                  exploitantNom={profile?.nom_exploitant} exploitantAdresse={profile?.adresse_exploitant}
                  typeDate={active.type_date}
                  placeholder
                />
              </div>
              <label className="label">Importer votre propre modèle d'étiquette (image vierge)</label>
              <input type="file" accept="image/*" disabled={uploading} onChange={e => uploadEtiquette(e.target.files?.[0])} style={{ fontSize: '.82rem' }} />
              {uploading && <p style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>Envoi en cours…</p>}
            </>
          )}
          <p style={{ fontSize: '.78rem', color: 'var(--ink-soft)', marginTop: 10 }}>
            Le numéro de lot et la DLC/DDM réels sont propres à chaque production. Pour imprimer une vraie étiquette, allez dans <b>Traçabilité des lots</b>, enregistrez le lot, puis cliquez « Étiquette ».
          </p>
        </div>
      </div>
    </div>
  );
}
