'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { exportCSV, exportExcel } from '@/lib/csv';
import { FIELDS, GenericLabel, mergedLayout } from '@/components/ProduitsTab';
import { today, getLastResponsable, rememberResponsable } from '@/lib/prefs';
import { useSavedFlag } from '@/lib/useSavedFlag';

const OTHER = '__autre__';

function lotFieldValue(key, lot, prod, profile) {
  switch (key) {
    case 'nom': return lot.produit;
    case 'poids': return prod?.poids || '';
    case 'poids_egoutte': return prod?.poids_egoutte ? `Poids égoutté : ${prod.poids_egoutte}` : '';
    case 'ingredients': return `Ingrédients : ${prod?.ingredients || '—'}`;
    case 'pourcentage_principal': return prod?.pourcentage_principal ? `Teneur : ${prod.pourcentage_principal}` : '';
    case 'allergenes': return `Allergènes : ${prod?.allergenes || 'aucun'}`;
    case 'origine': return prod?.origine ? `Origine : ${prod.origine}` : '';
    case 'numero_lot': return `N° de lot : ${lot.numero_lot}`;
    case 'dlc': return `${prod?.type_date === 'DDM' ? 'DDM' : 'DLC'} : ${lot.dlc || 'à compléter'}`;
    case 'quantite': return lot.quantite ? `Quantité : ${lot.quantite} unités` : '';
    case 'conservation': return `Conservation : ${prod?.conservation || '—'}`;
    case 'exploitant': return (profile?.nom_exploitant || profile?.adresse_exploitant) ? `${profile?.nom_exploitant || ''} — ${profile?.adresse_exploitant || ''}` : '';
    case 'declaration_nutritionnelle': return prod?.declaration_nutritionnelle ? `Valeurs nutritionnelles : ${prod.declaration_nutritionnelle}` : '';
    case 'consignes_tri': return prod?.consignes_tri ? `Tri : ${prod.consignes_tri}` : '';
    default: return '';
  }
}

export default function TracabiliteTab({ userId }) {
  const [items, setItems] = useState([]);
  const [gamme, setGamme] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ produit: '', date_production: today(), dlc: '', quantite: '', fournisseur: '', lot_fournisseur: '', temperature_releve: '', destinataires: '', responsable: '' });
  const [customProduit, setCustomProduit] = useState('');
  const [labelLot, setLabelLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(false);
  const [saved, flashSaved] = useSavedFlag();
  const [search, setSearch] = useState('');
  const [dossierLot, setDossierLot] = useState(null);
  const [etapesHaccp, setEtapesHaccp] = useState([]);
  const [verifsHaccp, setVerifsHaccp] = useState([]);
  const [nettoyages, setNettoyages] = useState([]);
  const [nonConformites, setNonConformites] = useState([]);

  useEffect(() => {
    const nom = getLastResponsable();
    if (nom) setForm(f => ({ ...f, responsable: nom }));
  }, []);

  const load = async () => {
    const [{ data: lots }, { data: produits }, { data: prof }, { data: etapes }, { data: verifs }, { data: nett }, { data: nc }] = await Promise.all([
      supabase.from('lots_tracabilite').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('produits').select('*').eq('user_id', userId).order('nom'),
      supabase.from('profiles').select('nom_exploitant, adresse_exploitant').eq('id', userId).single(),
      supabase.from('haccp_etapes').select('*').eq('user_id', userId),
      supabase.from('haccp_verifications').select('*').eq('user_id', userId),
      supabase.from('nettoyage').select('*').eq('user_id', userId),
      supabase.from('non_conformites').select('*').eq('user_id', userId),
    ]);
    setItems(lots || []);
    setGamme(produits || []);
    setProfile(prof || null);
    setEtapesHaccp(etapes || []);
    setVerifsHaccp(verifs || []);
    setNettoyages(nett || []);
    setNonConformites(nc || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const nextLotNumber = String(items.length + 1).padStart(3, '0');

  const add = async () => {
    const selected = gamme.find(p => p.id === form.produit);
    const produitNom = form.produit === OTHER ? customProduit : selected?.nom;
    if (!produitNom || !form.responsable) { setFormError(true); return; }
    setFormError(false);
    setSaving(true);
    await supabase.from('lots_tracabilite').insert({
      ...form,
      produit: produitNom,
      produit_id: form.produit === OTHER ? null : selected?.id ?? null,
      numero_lot: nextLotNumber,
      user_id: userId,
    });
    rememberResponsable(form.responsable);
    setForm({ produit: '', date_production: today(), dlc: '', quantite: '', fournisseur: '', lot_fournisseur: '', temperature_releve: '', destinataires: '', responsable: form.responsable });
    setCustomProduit('');
    setSaving(false);
    flashSaved();
    load();
  };

  const itemsFiltres = items.filter(l => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [l.produit, l.numero_lot, l.fournisseur, l.responsable, l.destinataires].some(v => (v || '').toLowerCase().includes(q));
  });

  const annuler = async (id) => {
    await supabase.from('lots_tracabilite').update({ annule: true, annule_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const doExport = () => exportCSV(
    'registre-tracabilite.csv',
    ['Date', 'Produit', 'N° lot', 'DLC / DDM', 'Quantité', 'Fournisseur', 'Lot fournisseur', 'Température relevée', 'Destinataires', 'Responsable', 'Saisi le', 'Statut'],
    items.map(l => [l.date_production, l.produit, l.numero_lot, l.dlc, l.quantite, l.fournisseur, l.lot_fournisseur, l.temperature_releve, l.destinataires, l.responsable, new Date(l.created_at).toLocaleString('fr-FR'), l.annule ? 'Annulé' : 'Valide'])
  );
  const doExportXlsx = () => exportExcel(
    'registre-tracabilite.xlsx',
    ['Date', 'Produit', 'N° lot', 'DLC / DDM', 'Quantité', 'Fournisseur', 'Lot fournisseur', 'Température relevée', 'Destinataires', 'Responsable', 'Saisi le', 'Statut'],
    items.map(l => [l.date_production, l.produit, l.numero_lot, l.dlc, l.quantite, l.fournisseur, l.lot_fournisseur, l.temperature_releve, l.destinataires, l.responsable, new Date(l.created_at).toLocaleString('fr-FR'), l.annule ? 'Annulé' : 'Valide'])
  );

  // Lien fiable par identifiant — fonctionne même si le nom du produit a été
  // retapé différemment (majuscules, espaces...) au moment de la saisie du lot.
  const matchedProduit = labelLot?.produit_id ? gamme.find(p => p.id === labelLot.produit_id) : null;

  // Reconstitue tout ce qui est lié à un lot : la fiche produit, le plan
  // HACCP tel qu'il était en vigueur à la date de production (grâce au
  // versionnage annule/annule_at des étapes), les vérifications et le
  // nettoyage du jour de production, et les non-conformités du produit.
  const dossierDuLot = (lot) => {
    const refDate = new Date(lot.date_production || lot.created_at);
    const produit = lot.produit_id
      ? gamme.find(p => p.id === lot.produit_id)
      : gamme.find(p => p.nom === lot.produit);

    const etapesEnVigueur = etapesHaccp
      .filter(e => new Date(e.created_at) <= refDate && (!e.annule || (e.annule_at && new Date(e.annule_at) > refDate)))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const verifsDuJour = lot.date_production
      ? verifsHaccp.filter(v => v.date_verification === lot.date_production && !v.annule)
      : [];

    const nettoyagesDuJour = lot.date_production
      ? nettoyages.filter(n => n.date_intervention === lot.date_production && !n.annule)
      : [];

    const ncLiees = lot.produit_id
      ? nonConformites.filter(n => n.produit_id === lot.produit_id)
      : nonConformites.filter(n => n.produit === lot.produit);

    return { produit, etapesEnVigueur, verifsDuJour, nettoyagesDuJour, ncLiees };
  };

  const dossierData = dossierLot ? dossierDuLot(dossierLot) : null;

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Registre de traçabilité des lots</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', marginBottom: 10 }}>
        Couvre la traçabilité amont (d'où vient la matière première) et aval (à qui le lot a été distribué) — les deux sont nécessaires pour un vrai rappel produit.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
        <div>
          <label className="label">Produit (gamme)</label>
          <select className="select-field" value={form.produit} onChange={e => setForm(f => ({ ...f, produit: e.target.value }))}>
            <option value="">— Choisir —</option>
            {gamme.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            <option value={OTHER}>Autre (préciser)…</option>
          </select>
        </div>
        <div><label className="label">N° lot (automatique)</label><input className="input" value={nextLotNumber} disabled style={{ color: 'var(--ink-soft)', background: 'var(--surface-alt)' }} /></div>
        <div><label className="label">Date de production</label><input className="input" type="date" value={form.date_production} onChange={e => setForm(f => ({ ...f, date_production: e.target.value }))} /></div>
        <div><label className="label">DLC / DDM de ce lot</label><input className="input" type="date" value={form.dlc} onChange={e => setForm(f => ({ ...f, dlc: e.target.value }))} /></div>
        <div><label className="label">Quantité produite (unités)</label><input className="input" type="number" min="0" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} /></div>
        <div><label className="label">Responsable *</label><input className="input" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} /></div>
      </div>

      <p className="label" style={{ marginTop: 4, marginBottom: 6 }}>Traçabilité amont (matière première)</p>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div><label className="label">Fournisseur</label><input className="input" value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} /></div>
        <div><label className="label">N° de lot chez ce fournisseur</label><input className="input" value={form.lot_fournisseur} onChange={e => setForm(f => ({ ...f, lot_fournisseur: e.target.value }))} /></div>
      </div>

      <p className="label" style={{ marginTop: 4, marginBottom: 6 }}>Preuve de maîtrise & traçabilité aval</p>
      <div className="grid2" style={{ marginBottom: form.produit === OTHER ? 10 : 12 }}>
        <div><label className="label">Température relevée (si CCP)</label><input className="input" placeholder="ex: 104°C" value={form.temperature_releve} onChange={e => setForm(f => ({ ...f, temperature_releve: e.target.value }))} /></div>
        <div><label className="label">Distribué à (revendeurs/marchés)</label><input className="input" placeholder="ex: Épicerie X, Marché du..." value={form.destinataires} onChange={e => setForm(f => ({ ...f, destinataires: e.target.value }))} /></div>
      </div>

      {form.produit === OTHER && (
        <div style={{ marginBottom: 12 }}>
          <label className="label">Nom du produit</label>
          <input className="input" placeholder="Nom du produit non répertorié" value={customProduit} onChange={e => setCustomProduit(e.target.value)} />
        </div>
      )}
      {formError && <p className="error-msg">Le produit et le responsable sont obligatoires.</p>}
      {saved && <p className="saved-msg">✓ Enregistré</p>}
      <button className="btn" disabled={saving} onClick={add}>{saving ? 'Ajout…' : 'Ajouter au registre'}</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Historique</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="link-btn" onClick={doExport}>Exporter en CSV</button>
          <button className="link-btn" onClick={doExportXlsx}>Exporter en Excel</button>
        </div>
      </div>
      <input
        className="input search-input"
        placeholder="Rechercher (produit, n° lot, fournisseur, responsable)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="hist-wrap">
        <table className="hist-table stack">
          <thead>
            <tr>
              <th>Date</th><th>Produit</th><th>N° lot</th><th>DLC / DDM</th><th>Qté</th><th>Fournisseur</th><th>Lot fourn.</th><th>Temp.</th><th>Distribué à</th><th>Responsable</th><th>Saisi le</th><th>Statut</th><th></th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltres.length === 0 && <tr><td colSpan={13} style={{ color: 'var(--ink-faint)' }}>Aucun lot enregistré.</td></tr>}
            {itemsFiltres.map(l => (
              <tr key={l.id} className={l.annule ? 'annule' : ''}>
                <td data-label="Date">{l.date_production || '—'}</td>
                <td data-label="Produit">{l.produit}</td>
                <td data-label="N° lot">{l.numero_lot}</td>
                <td data-label="DLC / DDM">{l.dlc || '—'}</td>
                <td data-label="Qté">{l.quantite ?? '—'}</td>
                <td data-label="Fournisseur">{l.fournisseur || '—'}</td>
                <td data-label="Lot fourn.">{l.lot_fournisseur || '—'}</td>
                <td data-label="Temp.">{l.temperature_releve || '—'}</td>
                <td data-label="Distribué à">{l.destinataires || '—'}</td>
                <td data-label="Responsable">{l.responsable}</td>
                <td data-label="Saisi le">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                <td data-label="Statut">{l.annule ? <span className="chip warn">Annulé</span> : <span className="chip ok">Valide</span>}</td>
                <td data-label="Actions" style={{ display: 'flex', gap: 10 }}>
                  <button className="link-btn" onClick={() => setLabelLot(l)}>Étiquette</button>
                  <button className="link-btn" onClick={() => setDossierLot(l)}>Dossier</button>
                  {!l.annule && <button className="link-btn" onClick={() => annuler(l.id)}>Annuler</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {labelLot && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, maxWidth: 320 }}>
            <h3 style={{ margin: 0 }}>Étiquette — lot {labelLot.numero_lot}</h3>
            <button className="link-btn" onClick={() => window.print()}>Imprimer / Exporter en PDF</button>
          </div>
          {matchedProduit?.etiquette_image_path ? (
            <div id="printable-label" style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', maxWidth: 320 }}>
              <img
                src={supabase.storage.from('etiquettes').getPublicUrl(matchedProduit.etiquette_image_path).data.publicUrl}
                alt="Étiquette" style={{ width: '100%', display: 'block' }}
              />
              {FIELDS.filter(f => {
                const layout = mergedLayout(matchedProduit.etiquette_layout);
                return layout[f.key]?.visible !== false && lotFieldValue(f.key, labelLot, matchedProduit, profile);
              }).map(f => {
                const layout = mergedLayout(matchedProduit.etiquette_layout);
                const cfg = layout[f.key];
                return (
                  <div key={f.key} style={{
                    position: 'absolute', left: `${cfg.x}%`, top: `${cfg.y}%`,
                    fontSize: `${cfg.size}px`, lineHeight: 1.3, maxWidth: '60%',
                    color: cfg.color, fontWeight: cfg.bold ? 700 : 400,
                    fontStyle: cfg.italic ? 'italic' : 'normal', fontFamily: cfg.font,
                  }}>
                    {lotFieldValue(f.key, labelLot, matchedProduit, profile)}
                  </div>
                );
              })}
              {(matchedProduit.etiquette_custom_blocks || []).map(b => (
                <div key={b.id} style={{
                  position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
                  fontSize: `${b.size}px`, lineHeight: 1.3, maxWidth: '60%',
                  color: b.color, fontWeight: b.bold ? 700 : 400,
                  fontStyle: b.italic ? 'italic' : 'normal', fontFamily: b.font,
                }}>
                  {b.text}
                </div>
              ))}
            </div>
          ) : (
            <div id="printable-label">
              <GenericLabel
                nom={labelLot.produit}
                poids={matchedProduit?.poids}
                poidsEgoutte={matchedProduit?.poids_egoutte}
                ingredients={matchedProduit?.ingredients}
                pourcentage={matchedProduit?.pourcentage_principal}
                allergenes={matchedProduit?.allergenes}
                origine={matchedProduit?.origine}
                declarationNutritionnelle={matchedProduit?.declaration_nutritionnelle}
                numeroLot={labelLot.numero_lot}
                dlc={labelLot.dlc}
                quantite={labelLot.quantite}
                conservation={matchedProduit?.conservation}
                consignesTri={matchedProduit?.consignes_tri}
                exploitantNom={profile?.nom_exploitant}
                exploitantAdresse={profile?.adresse_exploitant}
                typeDate={matchedProduit?.type_date}
              />
            </div>
          )}
          {!matchedProduit && (
            <p style={{ fontSize: '.75rem', color: 'var(--ink-faint)', marginTop: 8, maxWidth: 320 }}>
              Ce lot n'est pas relié à une fiche de votre gamme (choisi via "Autre" ou produit supprimé depuis) — les ingrédients et allergènes ne peuvent pas être complétés automatiquement.
            </p>
          )}
        </div>
      )}

      {dossierLot && dossierData && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Dossier — lot {dossierLot.numero_lot}</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="link-btn" onClick={() => window.print()}>Imprimer / Exporter en PDF</button>
              <button className="link-btn" onClick={() => setDossierLot(null)}>Fermer</button>
            </div>
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', marginBottom: 14 }}>
            Tout ce qui est rattaché à ce lot — utile en cas de contrôle ou de rappel produit.
          </p>

          <div id="printable-dossier" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <p className="label" style={{ marginBottom: 6 }}>Identification</p>
              <p style={{ fontSize: '.85rem', margin: 0 }}>
                <b>{dossierLot.produit}</b> — N° lot {dossierLot.numero_lot}
                {dossierLot.date_production && ` — produit le ${new Date(dossierLot.date_production).toLocaleDateString('fr-FR')}`}
                {dossierLot.dlc && ` — DLC/DDM : ${dossierLot.dlc}`}
              </p>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <p className="label" style={{ marginBottom: 6 }}>Fiche produit</p>
              {dossierData.produit ? (
                <div className="haccp-detail-grid">
                  <div><span className="label">Ingrédients</span><p>{dossierData.produit.ingredients || '—'}</p></div>
                  <div><span className="label">Allergènes</span><p>{dossierData.produit.allergenes || 'Aucun'}</p></div>
                  <div><span className="label">Poids</span><p>{dossierData.produit.poids || '—'}</p></div>
                  <div><span className="label">Conservation</span><p>{dossierData.produit.conservation || '—'}</p></div>
                </div>
              ) : (
                <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem', margin: 0 }}>Ce lot n'est pas relié à une fiche produit de la gamme.</p>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <p className="label" style={{ marginBottom: 6 }}>Plan HACCP en vigueur à la production</p>
              {dossierData.etapesEnVigueur.length === 0 ? (
                <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem', margin: 0 }}>Aucune étape HACCP active à cette date.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.82rem' }}>
                  {dossierData.etapesEnVigueur.map(e => (
                    <li key={e.id} style={{ marginBottom: 2 }}>
                      {e.etape} {e.ccp && <span className="chip warn" style={{ marginLeft: 4 }}>CCP</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <p className="label" style={{ marginBottom: 6 }}>Vérifications HACCP ce jour-là</p>
              {dossierData.verifsDuJour.length === 0 ? (
                <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem', margin: 0 }}>Aucune vérification enregistrée à la date de production.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.82rem' }}>
                  {dossierData.verifsDuJour.map(v => (
                    <li key={v.id} style={{ marginBottom: 2 }}>
                      {v.etape} — {v.conforme ? <span className="chip ok">Conforme</span> : <span className="chip warn">Non conforme</span>} ({v.responsable})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <p className="label" style={{ marginBottom: 6 }}>Nettoyage réalisé ce jour-là</p>
              {dossierData.nettoyagesDuJour.length === 0 ? (
                <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem', margin: 0 }}>Aucun passage de nettoyage enregistré à cette date.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.82rem' }}>
                  {dossierData.nettoyagesDuJour.map(n => (
                    <li key={n.id} style={{ marginBottom: 2 }}>{n.zone} — {n.produit_utilise || 'produit habituel'} ({n.responsable})</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <p className="label" style={{ marginBottom: 6 }}>Non-conformités liées à ce produit</p>
              {dossierData.ncLiees.length === 0 ? (
                <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem', margin: 0 }}>Aucune non-conformité connue pour ce produit.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.82rem' }}>
                  {dossierData.ncLiees.map(n => (
                    <li key={n.id} style={{ marginBottom: 2 }}>
                      {n.date_constat || '—'} — {n.description} <span className={n.cloture ? 'chip ok' : 'chip warn'} style={{ marginLeft: 4 }}>{n.cloture ? 'Clôturé' : 'Ouvert'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
