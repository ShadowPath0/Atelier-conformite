'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const STATUSES = ['active', 'inactive', 'past_due', 'canceled'];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    setMe(session.user);

    const { data: myProfile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
    if (!myProfile?.is_admin) { setIsAdmin(false); setLoading(false); return; }
    setIsAdmin(true);

    const [{ data: profs, error: profsError }, { data: msgs, error: msgsError }, { data: log, error: logError }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (profsError) console.error('Erreur chargement profils :', profsError);
    if (msgsError) console.error('Erreur chargement messages :', msgsError);
    if (logError) console.error('Erreur chargement journal :', logError);
    setProfiles(profs || []);
    setMessages(msgs || []);
    setAuditLog(log || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const logAction = async (action, target_table, target_id, details) => {
    if (!me) return;
    await supabase.from('admin_audit_log').insert({
      admin_id: me.id, admin_email: me.email, action, target_table, target_id, details,
    });
  };

  const marquerLu = async (id) => {
    await supabase.from('messages').update({ lu: true }).eq('id', id);
    await logAction('mark_message_read', 'messages', id, null);
    load();
  };

  const updateStatus = async (id, newStatus) => {
    setSavingId(id);
    await supabase.from('profiles').update({ subscription_status: newStatus }).eq('id', id);
    await logAction('update_subscription_status', 'profiles', id, { new_status: newStatus });
    await load();
    setSavingId(null);
  };

  if (loading) return <div className="wrap">Chargement…</div>;

  if (!isAdmin) {
    return (
      <div className="wrap" style={{ maxWidth: 400, paddingTop: 80, textAlign: 'center' }}>
        <p style={{ fontWeight: 600 }}>Accès réservé</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: '.88rem' }}>Ce compte n'a pas les droits administrateur.</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: '1.2rem' }}>Administration — Abonnés</h1>
      <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginBottom: 20 }}>
        Modifier un statut ici l'écrase immédiatement — à utiliser uniquement pour corriger un problème de paiement.
      </p>
      <div className="row-list">
        {profiles.length === 0 && <div className="row-item">Aucun compte pour l'instant.</div>}
        {profiles.map(p => (
          <div key={p.id} className="row-item" style={{ flexWrap: 'wrap' }}>
            <span>
              <b>{p.email}</b>
              {p.is_admin && <span style={{ marginLeft: 8, fontSize: '.72rem', color: 'var(--blue)' }}>(admin)</span>}
              <br />
              <span style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>
                Client Stripe : {p.stripe_customer_id || '—'} · Créé le {new Date(p.created_at).toLocaleDateString('fr-FR')}
              </span>
            </span>
            <select
              value={p.subscription_status}
              disabled={savingId === p.id}
              onChange={e => updateStatus(p.id, e.target.value)}
              className="input"
              style={{ width: 150 }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      <h1 style={{ fontSize: '1.2rem', marginTop: 32 }}>Messages reçus ({messages.filter(m => !m.lu).length} non lus)</h1>
      <div className="row-list">
        {messages.length === 0 && <div className="row-item">Aucun message pour l'instant.</div>}
        {messages.map(m => (
          <div key={m.id} className="row-item" style={{ flexDirection: 'column', alignItems: 'flex-start', background: m.lu ? 'transparent' : 'var(--surface-alt)' }}>
            <span><b>{m.sujet || '(sans sujet)'}</b> — {m.email} — {new Date(m.created_at).toLocaleString('fr-FR')}</span>
            <span style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>{m.message}</span>
            {!m.lu && <button className="link-btn" onClick={() => marquerLu(m.id)}>Marquer comme lu</button>}
          </div>
        ))}
      </div>

      <h1 style={{ fontSize: '1.2rem', marginTop: 32 }}>Journal des actions admin</h1>
      <p style={{ fontSize: '.82rem', color: 'var(--ink-soft)', marginBottom: 12 }}>
        Trace non modifiable de chaque action effectuée depuis cette page — y compris par vous.
      </p>
      <div className="hist-wrap">
        <table className="hist-table">
          <thead><tr><th>Date</th><th>Admin</th><th>Action</th><th>Cible</th><th>Détail</th></tr></thead>
          <tbody>
            {auditLog.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--ink-faint)' }}>Aucune action enregistrée.</td></tr>}
            {auditLog.map(l => (
              <tr key={l.id}>
                <td>{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                <td>{l.admin_email}</td>
                <td>{l.action}</td>
                <td>{l.target_table} · {l.target_id?.slice(0, 8)}</td>
                <td>{l.details ? JSON.stringify(l.details) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
