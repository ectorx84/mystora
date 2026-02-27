import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, prenom, rapport } = await request.json();

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Mystora', email: 'contact@mystora.fr' },
        to: [{ email, name: prenom }],
        subject: `🔮 Votre rapport astrologique complet, ${prenom}`,
        htmlContent: `
          <div style="background:#1E1B4B;padding:40px;font-family:Arial,sans-serif;color:white;max-width:600px;margin:0 auto;border-radius:16px;">
            <h1 style="color:#D4A574;text-align:center;">🔮 Mystora</h1>
            <h2 style="color:white;text-align:center;">Votre rapport complet, ${prenom}</h2>
            <div style="background:#2D2A6E;padding:24px;border-radius:12px;margin-top:24px;line-height:1.8;">
              ${rapport.replace(/\n/g, '<br/>')}
            </div>
            <p style="color:#6B7280;text-align:center;font-size:12px;margin-top:24px;">Divertissement — Mystora.fr</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    console.log('Brevo response:', JSON.stringify(data));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur Brevo:', error);
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
  }
}