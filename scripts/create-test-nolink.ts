// Checkout test 0,50€ SANS Link — pour voir les autres moyens de paiement clairement
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
    payment_method_types: ['card', 'paypal'], // PAS de link
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Test sans Link — Mystora' },
        unit_amount: 50,
      },
      quantity: 1,
    }],
    success_url: 'https://mystora.fr/success?test=1',
    cancel_url: 'https://mystora.fr',
  });

  console.log('\n✓ Lien test SANS Link :');
  console.log(session.url);
  console.log('\nCeci force l\'affichage des autres méthodes (Carte + PayPal attendus).');
  console.log('Si PayPal n\'apparaît toujours pas → capability PayPal vraiment cassée côté Stripe.');
})();
