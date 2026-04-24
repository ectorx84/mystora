// Calcule les ventes Stripe sur les 14 derniers jours + projette sur 30j
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

  const now = Math.floor(Date.now() / 1000);
  const days14 = now - 14 * 24 * 3600;
  const days30 = now - 30 * 24 * 3600;

  // On récupère tous les PaymentIntents réussis des 30 derniers jours
  let allIntents: Stripe.PaymentIntent[] = [];
  let startingAfter: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: days30 },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    allIntents = allIntents.concat(page.data);
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  const succeeded = allIntents.filter(pi => pi.status === 'succeeded');
  console.log(`Total succeeded sur 30j : ${succeeded.length} paiements`);

  const byDay: Record<string, { count: number; total: number }> = {};
  for (const pi of succeeded) {
    const d = new Date(pi.created * 1000).toISOString().slice(0, 10);
    byDay[d] = byDay[d] || { count: 0, total: 0 };
    byDay[d].count += 1;
    byDay[d].total += pi.amount / 100;
  }

  console.log('\nVentes par jour (Stripe) :');
  const sortedDays = Object.keys(byDay).sort();
  for (const d of sortedDays) {
    console.log(`  ${d} : ${byDay[d].count} ventes = ${byDay[d].total.toFixed(2)}€`);
  }

  // 14 derniers jours
  const last14 = succeeded.filter(pi => pi.created >= days14);
  const last14Total = last14.reduce((s, pi) => s + pi.amount / 100, 0);
  const last14Count = last14.length;

  // 30 derniers jours
  const last30 = succeeded.filter(pi => pi.created >= days30);
  const last30Total = last30.reduce((s, pi) => s + pi.amount / 100, 0);
  const last30Count = last30.length;

  console.log('\n===== SYNTHÈSE =====');
  console.log(`14 derniers jours : ${last14Count} ventes = ${last14Total.toFixed(2)}€`);
  console.log(`  → Moyenne/jour : ${(last14Count / 14).toFixed(1)} ventes = ${(last14Total / 14).toFixed(2)}€/jour`);
  console.log(`  → Projection 30j : ${(last14Count / 14 * 30).toFixed(0)} ventes = ${(last14Total / 14 * 30).toFixed(0)}€`);

  console.log(`\n30 derniers jours : ${last30Count} ventes = ${last30Total.toFixed(2)}€`);
  console.log(`  → Moyenne/jour : ${(last30Count / 30).toFixed(1)} ventes = ${(last30Total / 30).toFixed(2)}€/jour`);

  // Prix moyen
  const priceAvg = last30Total / last30Count;
  console.log(`\nPrix moyen panier : ${priceAvg.toFixed(2)}€`);

  // Split Afrique vs standard
  const africa = last30.filter(pi => pi.amount <= 200); // 1,99€
  const standard = last30.filter(pi => pi.amount >= 400); // 4,99€
  console.log(`  Afrique (1,99€) : ${africa.length} ventes`);
  console.log(`  Standard (4,99€) : ${standard.length} ventes`);
})();
