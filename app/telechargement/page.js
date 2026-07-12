export default function TelechargementPage({ searchParams }) {
  const sessionId = searchParams?.session_id;

  return (
    <div className="wrap" style={{ maxWidth: 460, paddingTop: 80, textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 10 }}>Merci pour votre achat !</h1>
      {!sessionId ? (
        <p style={{ color: 'var(--red)', fontSize: '.9rem' }}>
          Lien de téléchargement invalide ou incomplet. Si vous venez de payer, contactez-nous en répondant au reçu envoyé par Stripe — nous vous enverrons le kit manuellement.
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>Votre kit de conformité est prêt à télécharger.</p>
          <a href={`/api/download-kit?session_id=${sessionId}`} className="btn" style={{ textDecoration: 'none' }}>
            Télécharger mon kit (Word + PDF)
          </a>
          <p style={{ fontSize: '.78rem', color: 'var(--ink-faint)', marginTop: 18 }}>
            Conservez cette page en favori : vous pouvez retélécharger votre kit à tout moment en y revenant.
          </p>
        </>
      )}
    </div>
  );
}
