const h2 = { fontSize: '1.1rem', marginTop: 26 };

export default function Confidentialite() {
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 50, paddingBottom: 60 }}>
      <h1 style={{ fontSize: '1.5rem' }}>Politique de confidentialité</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>Dernière mise à jour : juillet 2026</p>

      <h2 style={h2}>1. Données collectées</h2>
      <ul>
        <li>Email et mot de passe (chiffré) lors de la création de compte</li>
        <li>Données de paiement — traitées exclusivement par Stripe, jamais stockées par nos soins</li>
        <li>Données saisies volontairement dans votre espace personnel (fiches produits, registres de traçabilité, plan HACCP, messages de contact)</li>
        <li>Données techniques de connexion à des fins de sécurité</li>
      </ul>

      <h2 style={h2}>2. Finalités</h2>
      <ul>
        <li>Fourniture du service et facturation</li>
        <li>Support client</li>
        <li>Sécurité et prévention de la fraude</li>
      </ul>

      <h2 style={h2}>3. Durée de conservation</h2>
      <p>Les données de compte sont conservées pendant toute la durée d'utilisation du service, puis archivées 5 ans conformément aux obligations de conservation des données de traçabilité alimentaire.</p>

      <h2 style={h2}>4. Sous-traitants</h2>
      <ul>
        <li>Supabase (base de données et authentification), hébergement en Union Européenne</li>
        <li>Vercel (hébergement du site)</li>
        <li>Stripe (paiements)</li>
      </ul>
      <p>Aucune donnée n'est vendue ni cédée à des tiers à des fins commerciales.</p>

      <h2 style={h2}>5. Vos droits</h2>
      <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition. Vous pouvez exercer ces droits via l'onglet Contact de votre espace personnel.</p>

      <h2 style={h2}>6. Cookies</h2>
      <p>Ce site utilise uniquement les cookies techniques strictement nécessaires à son fonctionnement (maintien de la session de connexion). Aucun cookie de suivi publicitaire ou d'analyse tiers n'est utilisé à ce jour.</p>

      <h2 style={h2}>7. Sécurité</h2>
      <p>L'accès aux données est protégé par des règles de sécurité au niveau de la base de données garantissant qu'un utilisateur ne peut accéder qu'à ses propres données. Les échanges avec le site sont chiffrés (HTTPS).</p>
    </div>
  );
}
