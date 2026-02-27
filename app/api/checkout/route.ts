import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, email } = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?prenom=${prenom}&date=${dateNaissance}&email=${email}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/`,
  });

  return NextResponse.json({ url: session.url });
}