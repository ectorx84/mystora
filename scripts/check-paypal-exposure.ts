// Vérifie ce que Stripe + PayPal exposent au client lors d'un paiement
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

  console.log('===== 1. PROFIL COMPTE STRIPE (ce que voit le client partout) =====\n');
  const account = await stripe.accounts.retrieve();
  console.log({
    business_name: account.business_profile?.name,
    business_url: account.business_profile?.url,
    support_email: account.business_profile?.support_email,
    support_phone: account.business_profile?.support_phone,
    statement_descriptor: account.settings?.payments?.statement_descriptor,
    email_compte_stripe: account.email,
  });

  console.log('\n===== 2. CONFIG PAYPAL LIÉ À STRIPE =====\n');
  try {
    const paymentMethodConfigs = await stripe.paymentMethodConfigurations.list({ limit: 5 });
    for (const cfg of paymentMethodConfigs.data) {
      console.log({
        name: cfg.name,
        active: cfg.active,
        paypal_enabled: cfg.paypal?.available,
      });
    }
  } catch (e: any) {
    console.log('paymentMethodConfigurations non accessible:', e.message);
  }

  console.log('\n===== 3. DERNIER PAIEMENT PAYPAL =====\n');
  const intents = await stripe.paymentIntents.list({ limit: 50 });
  const paypalIntent = intents.data.find(pi =>
    pi.payment_method_types.includes('paypal') && pi.status === 'succeeded'
  );

  if (paypalIntent) {
    console.log('PaymentIntent ID:', paypalIntent.id);
    console.log('Created:', new Date(paypalIntent.created * 1000).toISOString());
    console.log('Amount:', paypalIntent.amount / 100, paypalIntent.currency);
    console.log('Statement descriptor:', paypalIntent.statement_descriptor);
    console.log('Description:', paypalIntent.description);

    // Le charge contient les infos d'affichage
    if (paypalIntent.latest_charge) {
      const chargeId = typeof paypalIntent.latest_charge === 'string'
        ? paypalIntent.latest_charge
        : paypalIntent.latest_charge.id;
      const charge = await stripe.charges.retrieve(chargeId);
      console.log('\n--- Charge associée ---');
      console.log({
        statement_descriptor: charge.statement_descriptor,
        calculated_statement_descriptor: charge.calculated_statement_descriptor,
        payment_method_details_type: charge.payment_method_details?.type,
        paypal_details: charge.payment_method_details?.paypal,
      });
    }
  } else {
    console.log('Aucun paiement PayPal succeeded dans les 50 derniers intents');
  }

  console.log('\n===== 4. RÉSUMÉ POUR LE CLIENT =====\n');
  console.log(`Nom commercial vu côté Stripe : "${account.business_profile?.name || '⚠️ NON CONFIGURÉ'}"`);
  console.log(`Statement descriptor (sur relevé banque client) : "${account.settings?.payments?.statement_descriptor || '⚠️ NON CONFIGURÉ'}"`);
  console.log(`Email support public (affiché sur certains reçus) : "${account.business_profile?.support_email || '(aucun)'}"`);
})();
