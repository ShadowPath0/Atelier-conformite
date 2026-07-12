'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { exportMultiSheetExcel } from '@/lib/csv';
import AccueilTab from '@/components/AccueilTab';
import ProduitsTab from '@/components/ProduitsTab';
import HaccpTab from '@/components/HaccpTab';
import TracabiliteTab from '@/components/TracabiliteTab';
import NettoyageTab from '@/components/NettoyageTab';
import NonConformiteTab from '@/components/NonConformiteTab';
import AutoAuditTab from '@/components/AutoAuditTab';
import VerificationsTab from '@/components/VerificationsTab';
import ContactTab from '@/components/ContactTab';

const TABS = [
  { id: 'accueil', label: 'Accueil', comp: AccueilTab },
  { id: 'produits', label: 'Produits & étiquettes', comp: ProduitsTab },
  { id: 'haccp', label: 'Plan HACCP', comp: HaccpTab },
  { id: 'traca', label: 'Traçabilité des lots', comp: TracabiliteTab },
  { id: 'nettoyage', label: 'Nettoyage', comp: NettoyageTab },
  { id: 'verifications', label: 'Vérifications', comp: VerificationsTab },
  { id: 'nc', label: 'Non-conformités', comp: NonConformiteTab },
  { id: 'audit', label: 'Auto-audit', comp: AutoAuditTab },
  { id: 'contact', label: 'Contact', comp: ContactTab },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('accueil');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(prof);
      setLoading(false);
    })();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const exportTout = async () => {
    setExporting(true);
    const [
      { data: etapes }, { data: verifs }, { data: lots }, { data: nettoyages }, { data: ncs }, { data: audits },
    ] = await Promise.all([
      supabase.from('haccp_etapes').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('haccp_verifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('lots_tracabilite').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('nettoyage').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('non_conformites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('audits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    exportMultiSheetExcel(`export-complet-${new Date().toISOString().slice(0, 10)}.xlsx`, [
      {
        name: 'Plan HACCP',
        headers: ['Étape', 'Danger', 'Mesure de maîtrise', 'CCP', 'Limite critique', 'Surveillance', 'Action corrective', 'Vérification', 'Responsable', 'Statut'],
        rows: (etapes || []).map(i => [i.etape, i.danger, i.mesure_maitrise, i.ccp ? 'Oui' : 'Non', i.limite_critique, i.surveillance, i.action_corrective, i.verification, i.responsable, i.annule ? 'Archivée' : 'Active']),
      },
      {
        name: 'Journal HACCP',
        headers: ['Date', 'Étape', 'Type', 'Résultat', 'Observation', 'Responsable'],
        rows: (verifs || []).map(v => [v.date_verification, v.etape, v.type_action === 'surveillance' ? 'Surveillance' : 'Vérification', v.conforme ? 'Conforme' : 'Non conforme', v.observation, v.responsable]),
      },
      {
        name: 'Traçabilité',
        headers: ['Date', 'Produit', 'N° lot', 'DLC / DDM', 'Quantité', 'Fournisseur', 'Lot fournisseur', 'Température relevée', 'Destinataires', 'Responsable', 'Statut'],
        rows: (lots || []).map(l => [l.date_production, l.produit, l.numero_lot, l.dlc, l.quantite, l.fournisseur, l.lot_fournisseur, l.temperature_releve, l.destinataires, l.responsable, l.annule ? 'Annulé' : 'Valide']),
      },
      {
        name: 'Nettoyage',
        headers: ['Zone', 'Produit', 'Fréquence', 'Responsable', 'Date', 'Statut'],
        rows: (nettoyages || []).map(n => [n.zone, n.produit_utilise, n.frequence, n.responsable, n.date_intervention, n.annule ? 'Annulé' : 'Valide']),
      },
      {
        name: 'Non-conformités',
        headers: ['Date', 'Produit', 'Description', 'Action corrective', 'Responsable', 'Statut'],
        rows: (ncs || []).map(it => [it.date_constat, it.produit, it.description, it.action_corrective, it.responsable, it.cloture ? 'Clôturé' : 'Ouvert']),
      },
      {
        name: 'Auto-audits',
        headers: ['Date', 'Réalisé par', 'Score'],
        rows: (audits || []).map(h => [new Date(h.created_at).toLocaleString('fr-FR'), h.auditeur, h.score]),
      },
    ]);
    setExporting(false);
  };

  if (loading) return <div className="wrap">Chargement…</div>;

  const isActive = profile?.subscription_status === 'active';
  const abonnementUrl = `${process.env.NEXT_PUBLIC_STRIPE_ABONNEMENT_LINK}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email)}`;

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Espace Artisan</h1>
          <p style={{ fontSize: '.8rem', color: 'var(--ink-soft)', margin: 0 }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a
            href="/guide/Guide_Utilisation_Abonnes.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: 'var(--surface-alt)', color: 'var(--blue)', borderColor: 'var(--line)', textDecoration: 'none' }}
          >
            📖 Guide d'utilisation
          </a>
          {isActive && (
            <button
              onClick={exportTout}
              disabled={exporting}
              className="btn"
              style={{ background: 'var(--surface-alt)', color: 'var(--blue)', borderColor: 'var(--line)' }}
            >
              {exporting ? 'Export…' : '📦 Tout exporter'}
            </button>
          )}
          <button onClick={logout} className="btn" style={{ background: 'var(--surface-alt)', color: 'var(--ink-soft)', borderColor: 'var(--line)' }}>
            Se déconnecter
          </button>
        </div>
      </div>

      {!isActive ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Abonnement inactif</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.88rem', marginBottom: 20 }}>
            Activez votre abonnement « Conformité continue » pour accéder à votre espace de traçabilité.
          </p>
          <a href={abonnementUrl} className="btn" style={{ textDecoration: 'none' }}>S'abonner — 20 €/mois</a>
        </div>
      ) : (
        <>
          <div className="tabs">
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="card">
            {TABS.map(t => t.id === tab && <t.comp key={t.id} userId={user.id} userEmail={user.email} onNavigate={setTab} />)}
          </div>
        </>
      )}
    </div>
  );
}
