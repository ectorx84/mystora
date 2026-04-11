import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, email, partageId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_VOCAL!,
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      prenom: prenom || '',
      dateNaissance: dateNaissance || '',
      email: email || '',
      partageId: partageId || '',
      product: 'guidance_vocale',
    },
    customer_email: email || undefined,
    success_url: `${process.env.NEXT_PUBLIC_URL}/success-vocal?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/success?prenom=${prenom}&date=${dateNaissance}&email=${email}`,
  });

  return NextResponse.json({ url: session.url });
}
