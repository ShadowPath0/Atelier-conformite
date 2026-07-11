'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { retardEnJours, joursDepuis } from '@/lib/frequence';

// Tendance des scores d'auto-audit — ligne + zone, la forme adaptée à une
// évolution dans le temps (une seule série, pas besoin de légende).
function ScoreTrend({ audits }) {
  const derniers = [...audits].slice(0, 8).reverse();
  if (derniers.length === 0) {
    return <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>Aucun auto-audit enregistré pour le moment.</p>;
  }

  const largeur = 300;
  const hauteur = 130;
  const marge = { haut: 22, bas: 22, gauche: 6, droite: 6 };
  const zoneH = hauteur - marge.haut - marge.bas;
  const zoneL = largeur - marge.gauche - marge.droite;

  const points = derniers.map((a, i) => {
    const pct = Math.min(100, Math.max(0, parseInt(a.score) || 0));
    const x = derniers.length === 1
      ? marge.gauche + zoneL / 2
      : marge.gauche + (i / (derniers.length - 1)) * zoneL;
    const y = marge.haut + zoneH - (pct / 100) * zoneH;
    return { x, y, pct, date: a.created_at, id: a.id };
  });

  const ligne = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const zone = `${ligne} L ${points[points.length - 1].x} ${marge.haut + zoneH} L ${points[0].x} ${marge.haut + zoneH} Z`;
  const dernier = points[points.length - 1];

  const yTicks = [0, 50, 100];

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} width="100%" height={hauteur} role="img" aria-label="Évolution des scores d'auto-audit">
      {yTicks.map(t => {
        const y = marge.haut + zoneH - (t / 100) * zoneH;
        return <line key={t} x1={marge.gauche} y1={y} x2={largeur - marge.droite} y2={y} stroke="var(--line)" strokeWidth="1" />;
      })}

      {points.length > 1 && <path d={zone} fill="var(--blue)" opacity="0.1" stroke="none" />}
      {points.length > 1 && <path d={ligne} fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

      {points.map(p => (
        <g key={p.id}>
          {p === dernier ? (
            <>
              <circle cx={p.x} cy={p.y} r="6" fill="var(--surface)" />
              <circle cx={p.x} cy={p.y} r="4" fill="var(--blue)" />
              <text x={p.x} y={p.y - 10} fontSize="10" fontWeight="600" textAnchor="middle" fill="var(--ink)">{p.pct}%</text>
            </>
          ) : (
            <circle cx={p.x} cy={p.y} r="2.5" fill="var(--blue)" opacity="0.5" />
          )}
          <title>{`${new Date(p.date).toLocaleDateString('fr-FR')} — ${p.pct}%`}</title>
          <text x={p.x} y={hauteur - 6} fontSize="8" textAnchor="middle" fill="var(--ink-faint)">
            {new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Taux de résolution des non-conformités — un ratio contre une cible (100%
// clôturé), donc un mètre plutôt qu'un camembert à 2 parts.
function TauxResolution({ ouvertes, cloturees }) {
  const total = ouvertes + cloturees;
  if (total === 0) {
    return <p style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>Aucune non-conformité enregistrée — tant mieux.</p>;
  }
  const pct = Math.round((cloturees / total) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{pct}%</span>
        <span style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>clôturées</span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: 'var(--surface-alt)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 7, background: 'var(--green)' }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '.8rem' }}>
        <span style={{ color: 'var(--ink-soft)' }}>
          <b style={{ color: ouvertes > 0 ? 'var(--red)' : 'var(--ink)' }}>{ouvertes}</b> ouverte{ouvertes > 1 ? 's' : ''}
        </span>
        <span style={{ color: 'var(--ink-soft)' }}><b>{cloturees}</b> clôturée{cloturees > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

export default function AccueilTab({ userId, onNavigate }) {
  const [plan, setPlan] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [nonConformites, setNonConformites] = useState([]);
  const [audits, setAudits] = useState([]);
  const [lots, setLots] = useState([]);
  const [etapes, setEtapes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: e }, { data: nc }, { data: a }, { data: l }, { data: et }] = await Promise.all([
        supabase.from('plan_nettoyage').select('*').eq('user_id', userId),
        supabase.from('nettoyage').select('*').eq('user_id', userId),
        supabase.from('non_conformites').select('*').eq('user_id', userId),
        supabase.from('audits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('lots_tracabilite').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('haccp_etapes').select('*').eq('user_id', userId),
      ]);
      setPlan(p || []);
      setExecutions(e || []);
      setNonConformites(nc || []);
      setAudits(a || []);
      setLots(l || []);
      setEtapes(et || []);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <p>Chargement…</p>;

  const planActif = plan.filter(p => !p.annule);
  const derniereExecution = (planId) => executions.filter(e => e.plan_id === planId && !e.annule).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const pointsEnRetard = planActif
    .map(p => {
      const derniere = derniereExecution(p.id);
      return { ...p, retard: retardEnJours(p.frequence, derniere ? derniere.created_at : p.created_at) };
    })
    .filter(p => p.retard != null)
    .sort((a, b) => b.retard - a.retard);

  const ncOuvertes = nonConformites.filter(n => !n.cloture);
  const ncCloturees = nonConformites.filter(n => n.cloture);

  const dernierAudit = audits[0] || null;
  const joursDepuisAudit = dernierAudit ? joursDepuis(dernierAudit.created_at) : null;
  const auditARefaire = !dernierAudit || joursDepuisAudit > 90;

  const lotsActifs = lots.filter(l => !l.annule);
  const dernierLot = lotsActifs[0] || null;
  const etapesActives = etapes.filter(e => !e.annule).length;

  const aucuneAlerte = pointsEnRetard.length === 0 && ncOuvertes.length === 0 && !auditARefaire;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Vue d'ensemble</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)', marginBottom: 4 }}>Dernier lot enregistré</div>
          {dernierLot ? (
            <>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{new Date(dernierLot.date_production || dernierLot.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>{dernierLot.produit} · {lotsActifs.length} lot{lotsActifs.length > 1 ? 's' : ''} au total</div>
            </>
          ) : (
            <div style={{ fontSize: '.85rem', color: 'var(--ink-faint)' }}>Aucun lot enregistré</div>
          )}
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{etapesActives}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>Étapes du plan HACCP</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{ncOuvertes.length}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>Non-conformités ouvertes</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{dernierAudit ? dernierAudit.score : '—'}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>Dernier score d'auto-audit</div>
        </div>
      </div>

      <h3>Alertes</h3>
      {aucuneAlerte ? (
        <div className="row-list" style={{ marginBottom: 24 }}>
          <div className="row-item">✓ Rien à signaler pour l'instant.</div>
        </div>
      ) : (
        <div className="row-list" style={{ marginBottom: 24 }}>
          {pointsEnRetard.map(p => (
            <button
              key={p.id}
              className="row-item"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
              onClick={() => onNavigate && onNavigate('nettoyage')}
            >
              <span>Nettoyage — <b>{p.zone}</b> en retard</span>
              <span className="chip warn">{p.retard} j</span>
            </button>
          ))}
          {ncOuvertes.length > 0 && (
            <button
              className="row-item"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
              onClick={() => onNavigate && onNavigate('nc')}
            >
              <span>{ncOuvertes.length} non-conformité{ncOuvertes.length > 1 ? 's' : ''} encore ouverte{ncOuvertes.length > 1 ? 's' : ''}</span>
              <span className="chip warn">À traiter</span>
            </button>
          )}
          {auditARefaire && (
            <button
              className="row-item"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
              onClick={() => onNavigate && onNavigate('audit')}
            >
              <span>{dernierAudit ? `Dernier auto-audit il y a ${joursDepuisAudit} jours` : 'Aucun auto-audit jamais réalisé'}</span>
              <span className="chip warn">À refaire</span>
            </button>
          )}
        </div>
      )}

      <h3>Aperçu</h3>
      <div className="grid2">
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: '.82rem', fontWeight: 600, marginTop: 0, marginBottom: 10 }}>Scores des derniers auto-audits</p>
          <ScoreTrend audits={audits} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: '.82rem', fontWeight: 600, marginTop: 0, marginBottom: 10 }}>Taux de résolution des non-conformités</p>
          <TauxResolution ouvertes={ncOuvertes.length} cloturees={ncCloturees.length} />
        </div>
      </div>
    </div>
  );
}
