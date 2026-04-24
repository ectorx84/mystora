// Crée un Checkout Session Stripe à 0,50€ avec PayPal activé pour tester le branding PayPal
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

(async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'paypal', 'link'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Test PayPal branding — Mystora' },
        unit_amount: 50, // 0,50€ = 50 centimes
      },
      quantity: 1,
    }],
    success_url: 'https://mystora.fr/success?test=1',
    cancel_url: 'https://mystora.fr',
    metadata: { test_purpose: 'paypal_branding_check', country: 'FR' },
  });

  console.log('\n✓ Lien de test créé :');
  console.log(session.url);
  console.log('\nÉtapes :');
  console.log('1. Ouvre ce lien en mode incognito');
  console.log('2. Clique "PayPal" comme moyen de paiement');
  console.log('3. Regarde le gros titre quand PayPal s\'ouvre ("Payer X à ???")');
  console.log('4. Tu peux valider ou annuler — si tu valides, 0,50€ partent mais tu pourras te rembourser depuis Stripe Dashboard');
})();
