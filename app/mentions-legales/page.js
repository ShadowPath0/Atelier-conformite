export default function MentionsLegales() {
  const ph = { color: 'var(--red)', fontWeight: 600, background: '#FEF6E7', padding: '1px 4px', borderRadius: 3 };
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 50, paddingBottom: 60 }}>
      <h1 style={{ fontSize: '1.5rem' }}>Mentions légales</h1>

      <h2 style={{ fontSize: '1.1rem' }}>Éditeur du site</h2>
      <p> Hugo JACOB, auto-entrepreneur <br/>
      Email de contact : conformiteatelier@gmail.com <br/>
      Directeur de la publication : Hugo JACOB </p>

      <h2 style={{ fontSize: '1.1rem' }}>Hébergement</h2>
      <p>
        Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (à vérifier sur vercel.com/legal)<br/>
        Base de données hébergée par Supabase, région Union Européenne
      </p>

      <h2 style={{ fontSize: '1.1rem' }}>Propriété intellectuelle</h2>
      <p>L'ensemble des contenus présents sur ce site (textes, kits, modèles de documents, code, éléments visuels) est la propriété exclusive de l'éditeur, sauf mention contraire. Toute reproduction, distribution ou revente sans autorisation écrite préalable est interdite.</p>

      <h2 style={{ fontSize: '1.1rem' }}>Données personnelles</h2>
      <p>Le traitement des données personnelles est détaillé dans la <a href="/confidentialite" style={{ color: 'var(--blue)' }}>Politique de confidentialité</a>.</p>
    </div>
  );
}
