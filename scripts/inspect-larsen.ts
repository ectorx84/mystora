// Diagnostic : récupère la session Stripe de Larsen et inspecte la metadata
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

const EMAIL = 'larsen.oopa@hotmail.com';

(async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Chercher les sessions du 17/04/2026 (unix timestamps)
  const gte = Math.floor(new Date('2026-04-17T00:00:00Z').getTime() / 1000);
  const lte = Math.floor(new Date('2026-04-18T00:00:00Z').getTime() / 1000);

  const sessions = await stripe.checkout.sessions.list({
    created: { gte, lte },
    limit: 100,
  });

  const matches = sessions.data.filter(s => {
    const e = (s.customer_details?.email || s.metadata?.email || '').toLowerCase();
    return e === EMAIL.toLowerCase();
  });

  console.log(`Sessions du 17/04 : ${sessions.data.length}, matches Larsen : ${matches.length}\n`);

  for (const s of matches) {
    console.log('=== Session', s.id, '===');
    console.log('  created     :', new Date(s.created * 1000).toISOString());
    console.log('  paid        :', s.payment_status);
    console.log('  amount      :', s.amount_total, s.currency);
    console.log('  email stripe:', s.customer_details?.email);
    console.log('  metadata    :', JSON.stringify(s.metadata, null, 2));
  }
})();
