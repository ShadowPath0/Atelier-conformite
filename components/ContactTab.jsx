'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ContactTab({ userId, userEmail }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ sujet: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const send = async () => {
    if (!form.message) return;
    const { error } = await supabase.from('messages').insert({ ...form, user_id: userId, email: userEmail });
    if (error) {
      alert("Erreur lors de l'envoi du message : " + error.message);
      return;
    }
    setForm({ sujet: '', message: '' });
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    load();
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Nous contacter</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', marginBottom: 12 }}>
        Une question, un bug, une suggestion ? Votre message arrive directement à l'équipe.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, marginBottom: 12 }}>
        <div>
          <label className="label">Sujet</label>
          <input className="input" value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))} />
        </div>
        <div>
          <label className="label">Message *</label>
          <textarea
            className="input"
            rows={4}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      </div>
      <button className="btn" onClick={send}>Envoyer</button>
      {sent && <p style={{ color: 'var(--green)', fontSize: '.85rem', marginTop: 10 }}>Message envoyé — merci !</p>}

      {items.length > 0 && (
        <>
          <h3>Vos messages précédents</h3>
          <div className="row-list">
            {items.map(m => (
              <div key={m.id} className="row-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span><b>{m.sujet || '(sans sujet)'}</b> — {new Date(m.created_at).toLocaleString('fr-FR')}</span>
                <span style={{ color: 'var(--ink-soft)', fontSize: '.82rem' }}>{m.message}</span>
                <span style={{ fontSize: '.72rem', color: m.lu ? 'var(--green)' : 'var(--ink-faint)' }}>{m.lu ? 'Lu' : 'En attente de réponse'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
