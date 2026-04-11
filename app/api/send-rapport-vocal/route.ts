import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, prenom, rapport, audioUrl } = await request.json();

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Mystora', email: 'contact@mystora.fr' },
        to: [{ email, name: prenom }],
        subject: `🔮 Votre guidance approfondie vous attend, ${prenom}`,
        htmlContent: `
          <div style="background:#0D0B2E;padding:40px;font-family:Georgia,serif;color:white;max-width:600px;margin:0 auto;border-radius:16px;">
            <h1 style="color:#D4A574;text-align:center;letter-spacing:2px;">✦ MYSTORA ✦</h1>
            <h2 style="color:white;text-align:center;font-size:20px;margin-bottom:4px;">Votre guidance approfondie</h2>
            <p style="color:#D4A574;text-align:center;margin-top:0;">${prenom}</p>

            <div style="text-align:center;margin:24px 0;">
              <a href="${audioUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4A574,#c4895a);color:#1E1B4B;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;">
                🎙️ Écouter ma guidance vocale
              </a>
            </div>

            <div style="background:#1a1245;padding:24px;border-radius:12px;margin-top:24px;line-height:2;color:#e0d5ff;font-size:15px;">
              ${rapport.replace(/\n/g, '<br/>')}
            </div>

            <div style="text-align:center;margin-top:24px;">
              <a href="${audioUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4A574,#c4895a);color:#1E1B4B;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;">
                🎙️ Réécouter à tout moment
              </a>
            </div>

            <p style="color:#4B5563;text-align:center;font-size:11px;margin-top:32px;">Divertissement — Mystora.fr</p>
          </div>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur email vocal:', error);
    return NextResponse.json({ error: 'Erreur envoi' }, { status: 500 });
  }
}
