import './globals.css';

export const metadata = {
  title: 'Atelier Conformité — Espace abonné',
  description: 'Votre espace de traçabilité en ligne',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>{children}</div>
          <footer style={{ textAlign: 'center', padding: '20px', fontSize: '.78rem', color: 'var(--ink-faint)', borderTop: '1px solid var(--line)' }}>
            <a href="/mentions-legales" style={{ color: 'var(--ink-faint)', margin: '0 8px' }}>Mentions légales</a>
            ·
            <a href="/cgv" style={{ color: 'var(--ink-faint)', margin: '0 8px' }}>CGV</a>
            ·
            <a href="/confidentialite" style={{ color: 'var(--ink-faint)', margin: '0 8px' }}>Confidentialité</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
