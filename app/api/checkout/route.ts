import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Pays africains — prix adapté 1,99€
const AFRICA_COUNTRIES = [
  'SN','CI','CM','ML','BF','GN','TG','BJ','NE','TD',
  'CG','CD','GA','MG','DJ','KM','MR','RW','BI','CF',
  'GQ','SC','NG','GH','KE','TZ','UG','ET','ZA','MA',
  'DZ','TN','EG','LY','SD','SS','SO','ER','MZ','AO',
  'ZM','ZW','MW','BW','NA','SZ','LS','SL','LR','GM',
  'GW','CV','ST','MU'
];

// Pays PawaPay activés — ISO alpha-2 → alpha-3 + devise
// Seuls les pays activés dans le dashboard PawaPay production
const PAWAPAY_COUNTRIES: Record<string, { alpha3: string; currency: string; amount: string }> = {
  'BJ': { alpha3: 'BEN', currency: 'XOF', amount: '1306' },   // Bénin — 1,99€ × 656.957
  'CM': { alpha3: 'CMR', currency: 'XAF', amount: '1306' },   // Cameroun
  'CI': { alpha3: 'CIV', currency: 'XOF', amount: '1306' },   // Côte d'Ivoire
  'CD': { alpha3: 'COD', currency: 'CDF', amount: '5500' },   // RDC (CDF) — ~1,99€
  'GA': { alpha3: 'GAB', currency: 'XAF', amount: '1306' },   // Gabon
  'KE': { alpha3: 'KEN', currency: 'KES', amount: '280' },    // Kenya — ~1,99€
  'CG': { alpha3: 'COG', currency: 'XAF', amount: '1306' },   // Congo
  'RW': { alpha3: 'RWA', currency: 'RWF', amount: '2700' },   // Rwanda — ~1,99€
  'SN': { alpha3: 'SEN', currency: 'XOF', amount: '1306' },   // Sénégal
  'MG': { alpha3: 'MDG', currency: 'MGA', amount: '9500' },   // Madagascar — ~1,99€
  'SL': { alpha3: 'SLE', currency: 'SLE', amount: '45' },     // Sierra Leone — ~1,99€
  'UG': { alpha3: 'UGA', currency: 'UGX', amount: '7800' },   // Ouganda — ~1,99€
  'ZM': { alpha3: 'ZMB', currency: 'ZMW', amount: '55' },     // Zambie — ~1,99€
};

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, email, question } = await request.json();

  // ✅ VALIDATION — empêcher les sessions sans metadata
  if (!prenom || !dateNaissance) {
    return NextResponse.json(
      { error: 'Prénom et date de naissance requis' },
      { status: 400 }
    );
  }

  // Détection pays via header Vercel
  const country = request.headers.get('x-vercel-ip-country') || '';
  const isAfrica = AFRICA_COUNTRIES.includes(country);
  const pawapayCountry = PAWAPAY_COUNTRIES[country];

  // ====== ROUTE PAWAPAY — pays africains avec mobile money activé ======
  if (pawapayCountry && process.env.PAWAPAY_API_TOKEN) {
    try {
      const depositId = crypto.randomUUID();

      const pawapayRes = await fetch('https://api.pawapay.io/v1/widget/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
        },
        body: JSON.stringify({
          depositId,
          returnUrl: `${process.env.NEXT_PUBLIC_URL}/success?deposit_id=${depositId}`,
          statementDescription: 'Mystora guidance',
          amount: pawapayCountry.amount,
          language: 'FR',
          country: pawapayCountry.alpha3,
          reason: 'Guidance personnalisée Mystora',
          metadata: [
            { fieldName: 'prenom', fieldValue: prenom },
            { fieldName: 'dateNaissance', fieldValue: dateNaissance },
            { fieldName: 'email', fieldValue: email || '', isPII: true },
            { fieldName: 'question', fieldValue: question || '' },
            { fieldName: 'country', fieldValue: country },
            { fieldName: 'priceType', fieldValue: 'africa_momo' },
          ],
        }),
      });

      if (!pawapayRes.ok) {
        const errData = await pawapayRes.text();
        console.error('[PAWAPAY_ERROR]', pawapayRes.status, errData);
        // Fallback vers Stripe si PawaPay échoue
      } else {
        const pawapayData = await pawapayRes.json();
        
        console.log(`[MYSTORA_EVENT] ${JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'pawapay_session_created',
          depositId,
          country,
          amount: pawapayCountry.amount,
          currency: pawapayCountry.currency,
        })}`);

        return NextResponse.json({ url: pawapayData.redirectUrl, provider: 'pawapay' });
      }
    } catch (err) {
      console.error('[PAWAPAY_EXCEPTION]', err);
      // Fallback vers Stripe
    }
  }

  // ====== ROUTE STRIPE — défaut (EU, Amérique du Nord, DOM-TOM + fallback) ======
  const priceId = isAfrica && process.env.STRIPE_PRICE_ID_AFRICA
    ? process.env.STRIPE_PRICE_ID_AFRICA
    : process.env.STRIPE_PRICE_ID!;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      prenom,
      dateNaissance,
      email: email || '',
      question: question || '',
      country,
      priceType: isAfrica ? 'africa' : 'standard',
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/`,
  });

  return NextResponse.json({ url: session.url, provider: 'stripe' });
}