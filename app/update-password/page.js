'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div className="wrap" style={{ maxWidth: 400, paddingTop: 80 }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Nouveau mot de passe</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.88rem', marginBottom: 24 }}>
        Choisissez un nouveau mot de passe pour votre espace.
      </p>
      {done ? (
        <p style={{ color: 'var(--green)' }}>Mot de passe mis à jour — redirection…</p>
      ) : (
        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '.82rem' }}>{error}</p>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Enregistrement…' : 'Valider'}</button>
        </form>
      )}
    </div>
  );
}
