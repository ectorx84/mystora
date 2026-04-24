// Cherche Hélène Normandin dans les Checkout Sessions Stripe
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

  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  console.log(`${sessions.data.length} Checkout Sessions récupérées\n`);

  const matches = sessions.data.filter(s => {
    const meta = JSON.stringify(s.metadata || {}).toLowerCase();
    const cd = JSON.stringify(s.custom_fields || []).toLowerCase();
    const email = (s.customer_email || s.customer_details?.email || '').toLowerCase();
    const name = (s.customer_details?.name || '').toLowerCase();
    return meta.includes('helene') || meta.includes('hélène') || meta.includes('normandin')
        || cd.includes('helene') || cd.includes('hélène') || cd.includes('normandin')
        || email.includes('helene') || email.includes('normandin')
        || name.includes('helene') || name.includes('hélène') || name.includes('normandin');
  });

  console.log(`=== ${matches.length} match(s) ===\n`);
  for (const s of matches) {
    console.log({
      id: s.id,
      amount: (s.amount_total || 0) / 100,
      currency: s.currency,
      status: s.status,
      payment_status: s.payment_status,
      created: new Date(s.created * 1000).toISOString(),
      email: s.customer_email || s.customer_details?.email,
      name: s.customer_details?.name,
      metadata: s.metadata,
    });
  }

  // Si 0 match, lister toutes les sessions du 20/04 avec infos utiles
  if (matches.length === 0) {
    console.log('\nPas de match — sessions du 20/04 :\n');
    const day20 = sessions.data.filter(s => {
      const d = new Date(s.created * 1000);
      return d.getUTCDate() === 20 && d.getUTCMonth() === 3;
    });
    for (const s of day20) {
      console.log({
        id: s.id,
        amount: (s.amount_total || 0) / 100,
        currency: s.currency,
        status: s.payment_status,
        created: new Date(s.created * 1000).toISOString(),
        email: s.customer_email || s.customer_details?.email,
        name: s.customer_details?.name,
        metadata: s.metadata,
      });
    }
  }
})();
