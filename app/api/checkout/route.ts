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

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, email, question } = await request.json();

  // ✅ VALIDATION — empêcher les sessions Stripe sans metadata
  if (!prenom || !dateNaissance) {
    return NextResponse.json(
      { error: 'Prénom et date de naissance requis' },
      { status: 400 }
    );
  }

  // Détection pays via header Vercel (gratuit, automatique)
  const country = request.headers.get('x-vercel-ip-country') || '';
  const isAfrica = AFRICA_COUNTRIES.includes(country);

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

  return NextResponse.json({ url: session.url });
}