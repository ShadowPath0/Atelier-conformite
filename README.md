# Atelier Conformité — Application web

Application Next.js avec comptes utilisateurs (Supabase Auth), abonnement Stripe,
et les 5 registres de conformité connectés à une vraie base de données.

## Ce qui est déjà fait

- Inscription / connexion (Supabase Auth)
- Blocage de l'accès si l'abonnement n'est pas actif
- Les 5 registres (produits, traçabilité, nettoyage, non-conformités, auto-audit)
  branchés sur Supabase, avec les règles d'auditabilité (pas de suppression,
  horodatage automatique, responsable obligatoire)
- Webhook Stripe qui active/désactive l'abonnement automatiquement

## Ce qu'il vous reste à faire (aucune ligne de code, juste de la configuration)

### 1. Créer le projet Supabase
1. Compte gratuit sur [supabase.com](https://supabase.com) → New Project
2. Une fois créé : SQL Editor → coller le contenu de `supabase-schema.sql` (fourni séparément) → Run
3. Project Settings → API : notez `Project URL`, `anon public key`, `service_role key`

### 2. Configurer les variables d'environnement
1. Dupliquez `.env.local.example` en `.env.local`
2. Remplissez avec les valeurs Supabase (étape 1) et vos clés Stripe
   (Dashboard Stripe → Développeurs → Clés API)

### 3. Déployer sur Vercel (gratuit)
1. Créez un compte sur [vercel.com](https://vercel.com)
2. Importez ce projet (via GitHub, ou glisser-déposer le dossier)
3. Dans les réglages du projet Vercel → Environment Variables : collez le contenu
   de votre `.env.local`
4. Déployez — vous obtenez une URL du type `atelier-conformite.vercel.app`

### 4. Connecter le webhook Stripe
1. Dashboard Stripe → Développeurs → Webhooks → Ajouter un endpoint
2. URL : `https://VOTRE-DOMAINE.vercel.app/api/stripe-webhook`
3. Évènements à écouter : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Stripe vous donne un "Signing secret" (`whsec_...`) → ajoutez-le comme
   `STRIPE_WEBHOOK_SECRET` dans les variables d'environnement Vercel
5. Redéployez le projet pour que la nouvelle variable soit prise en compte

### 5. Tester
1. Créez un compte sur votre site déployé
2. Depuis le tableau de bord, cliquez "S'abonner" (mode test Stripe : carte `4242 4242 4242 4242`)
3. Vérifiez que le statut passe à "actif" et que les registres s'affichent

## Limitations connues de cette première version

- Pas d'export CSV (présent dans le prototype de démonstration, pas encore ici — à ajouter si besoin)
- Le mot de passe oublié n'a pas d'interface dédiée (Supabase le supporte, il manque juste l'écran)
- Aucun test automatisé

## Besoin d'aide pour la mise en ligne ?

Chacune de ces étapes est une configuration dans une interface web (Supabase, Vercel,
Stripe) — aucune ne nécessite d'écrire du code. Si un freelance reprend ce projet,
ce README suffit comme point de départ.
