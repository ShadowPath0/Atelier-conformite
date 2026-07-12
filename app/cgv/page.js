export default function CGV() {
  const ph = { color: 'var(--red)', fontWeight: 600, background: '#FEF6E7', padding: '1px 4px', borderRadius: 3 };
  const h2 = { fontSize: '1.1rem', marginTop: 26 };
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 50, paddingBottom: 60 }}>
      <h1 style={{ fontSize: '1.5rem' }}>Conditions Générales de Vente</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>Dernière mise à jour : juillet 2026</p>

      <h2 style={h2}>Article 1 — Objet</h2>
      <p>Les présentes conditions générales de vente (CGV) régissent les ventes réalisées sur ce site :</p>
      <ul>
        <li>Le « Kit seul » : classeur de conformité numérique (Word et PDF), vendu en paiement unique</li>
        <li>Le « Kit + révision » : classeur numérique accompagné d'une session de révision personnalisée de 30 minutes, vendu en paiement unique</li>
        <li>L'abonnement « Conformité continue » : accès à un espace personnel en ligne, facturé mensuellement, résiliable à tout moment</li>
      </ul>

      <h2 style={h2}>Article 2 — Prix et paiement</h2>
      <p>Les prix sont indiqués en euros. Les paiements sont traités par Stripe ; nous ne collectons ni ne stockons aucune donnée bancaire.</p>

      <h2 style={h2}>Article 3 — Livraison du contenu numérique</h2>
      <p>Le Kit seul et le Kit + révision sont livrés immédiatement après paiement, sous forme d'un fichier téléchargeable. L'accès à l'abonnement est activé automatiquement après confirmation du paiement.</p>

      <h2 style={h2}>Article 4 — Droit de rétractation et renoncement pour contenu numérique</h2>
      <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas à la fourniture d'un contenu numérique non fourni sur support matériel dont l'exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.</p>
      <p><strong>En cochant la case d'acceptation des présentes CGV au moment du paiement, le client :</strong></p>
      <ul>
        <li>reconnaît demander expressément la livraison immédiate du contenu numérique dès la confirmation du paiement, avant l'expiration du délai de rétractation de 14 jours</li>
        <li>renonce expressément à son droit de rétractation pour le Kit seul et le Kit + révision, une fois le téléchargement rendu disponible</li>
      </ul>
      <p>Pour l'abonnement, le consommateur dispose d'un délai de 14 jours pour se rétracter à compter de la souscription, sauf s'il a expressément demandé un accès immédiat et renoncé à ce délai dans les mêmes conditions que ci-dessus.</p>

      <h2 style={h2}>Article 5 — Résiliation de l'abonnement</h2>
      <p>L'abonnement Conformité continue est résiliable à tout moment, sans engagement ni préavis, en nous contactant via l'onglet Contact de votre espace personnel. La résiliation prend effet à la fin de la période déjà payée.</p>

      <h2 style={h2}>Article 6 — Nature du contenu et responsabilité</h2>
      <p>Le Kit et l'espace en ligne constituent des outils d'aide à la mise en conformité réglementaire. Ils ne remplacent ni une formation HACCP obligatoire, ni un conseil réglementaire personnalisé pour les cas particuliers. Il appartient au client de vérifier l'adéquation du contenu à sa situation spécifique.</p>

      <h2 style={h2}>Article 7 — Propriété intellectuelle du contenu vendu</h2>
      <p>Le contenu est destiné à un usage strictement personnel par l'acheteur. Toute revente, partage ou distribution à des tiers est interdite.</p>

      <h2 style={h2}>Article 8 — Médiation de la consommation</h2>
      <p>
        Conformément à l'article L616-1 du Code de la consommation, en cas de litige non résolu directement avec nous,
        le consommateur peut recourir gratuitement au service de médiation suivant : CNPM — Médiation de la Consommation
        (<a href="https://cnpm-mediation-consommation.eu">cnpm-mediation-consommation.eu</a>), adresse postale et
        numéro d'adhérent <span style={ph}>[à compléter après inscription au service — fournis par CNPM à l'adhésion]</span>.
      </p>

      <h2 style={h2}>Article 9 — Droit applicable</h2>
      <p>Les présentes CGV sont soumises au droit français.</p>
    </div>
  );
}
