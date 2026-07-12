'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      setLoading(false);
      if (error) { setError(error.message); return; }
      setInfo('Email envoyé — vérifiez votre boîte de réception pour réinitialiser votre mot de passe.');
      return;
    }

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/dashboard');
  };

  const titles = { login: 'Connexion à votre espace', signup: 'Créer votre espace', reset: 'Réinitialiser votre mot de passe' };

  return (
    <div className="wrap" style={{ maxWidth: 400, paddingTop: 80 }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Atelier Conformité</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.88rem', marginBottom: 24 }}>{titles[mode]}</p>
      <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {mode !== 'reset' && (
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        )}
        {error && <p style={{ color: 'var(--red)', fontSize: '.82rem' }}>{error}</p>}
        {info && <p style={{ color: 'var(--green)', fontSize: '.82rem' }}>{info}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? "S'inscrire" : "Envoyer le lien"}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        {mode !== 'signup' && (
          <button onClick={() => { setMode('signup'); setError(''); setInfo(''); }} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '.82rem', cursor: 'pointer', textAlign: 'left' }}>
            Pas encore de compte ? S'inscrire
          </button>
        )}
        {mode !== 'login' && (
          <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '.82rem', cursor: 'pointer', textAlign: 'left' }}>
            Déjà un compte ? Se connecter
          </button>
        )}
        {mode !== 'reset' && (
          <button onClick={() => { setMode('reset'); setError(''); setInfo(''); }} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '.78rem', cursor: 'pointer', textAlign: 'left' }}>
            Mot de passe oublié ?
          </button>
        )}
      </div>
    </div>
  );
}
