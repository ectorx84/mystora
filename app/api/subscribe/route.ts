import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, prenom } = await request.json();

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        email,
        attributes: { PRENOM: prenom },
        listIds: [2],
        updateEnabled: true,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur Brevo' }, { status: 500 });
  }
}