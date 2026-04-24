// Diagnostic complet PayPal sur le compte Stripe
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

  console.log('===== 1. CAPABILITIES DU COMPTE =====');
  const account = await stripe.accounts.retrieve();
  const caps = account.capabilities || {};
  console.log({
    paypal_payments: caps.paypal_payments || 'non listé',
    card_payments: caps.card_payments,
    link_payments: caps.link_payments,
    transfers: caps.transfers,
    country: account.country,
    default_currency: account.default_currency,
  });

  console.log('\n===== 2. DERNIERS PAIEMENTS PAYPAL RÉUSSIS =====');
  const intents = await stripe.paymentIntents.list({ limit: 50 });
  const paypalSuccess = intents.data.filter(pi =>
    pi.payment_method_types.includes('paypal') && pi.status === 'succeeded'
  );
  console.log(`${paypalSuccess.length} paiements PayPal réussis dans les 50 derniers intents`);
  if (paypalSuccess.length > 0) {
    const latest = paypalSuccess[0];
    console.log('Dernier :', {
      date: new Date(latest.created * 1000).toISOString(),
      amount: latest.amount / 100,
    });
  }

  console.log('\n===== 3. SESSIONS DE CHECKOUT RÉCENTES — PAYPAL DISPONIBLE ? =====');
  const sessions = await stripe.checkout.sessions.list({ limit: 10 });
  for (const s of sessions.data.slice(0, 5)) {
    const pm = s.payment_method_types || [];
    console.log({
      id: s.id.slice(0, 30) + '...',
      created: new Date(s.created * 1000).toISOString(),
      status: s.payment_status,
      paypal_in_methods: pm.includes('paypal'),
      methods: pm.join(','),
    });
  }

  console.log('\n===== 4. CRÉATION TEST SESSION = COMPORTEMENT PAYPAL =====');
  try {
    const testSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'paypal', 'link'],
      line_items: [{
        price_data: { currency: 'eur', product_data: { name: 'Diag' }, unit_amount: 499 },
        quantity: 1,
      }],
      success_url: 'https://mystora.fr/success',
      cancel_url: 'https://mystora.fr',
    });
    console.log('Session créée OK, methods demandées:', testSession.payment_method_types);
    console.log('URL:', testSession.url);
    console.log('(Cette URL devrait afficher PayPal si la capability est active)');
  } catch (e: any) {
    console.log('⚠️ ERREUR création session:', e.message);
  }

  console.log('\n===== 5. RÉSUMÉ =====');
  if (!caps.paypal_payments) {
    console.log('❌ paypal_payments non dans capabilities — PayPal potentiellement désactivé au niveau compte');
  } else if (caps.paypal_payments === 'active') {
    console.log('✓ paypal_payments = active — la capability est OK');
    console.log('→ Si PayPal ne s\'affiche pas: vérifier les "domaines de confiance" dans Stripe → Payment methods → PayPal');
  } else {
    console.log(`⚠️ paypal_payments = ${caps.paypal_payments} — non "active"`);
  }
})();
