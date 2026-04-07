import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, prenom, rapport, partageId } = await request.json();

  const partageUrl = partageId ? `https://www.mystora.fr/partage/${partageId}` : '';
  const whatsappUrl = partageUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Je viens de découvrir mon profil astrologique sur Mystora 🔮 Découvre le tien : ${partageUrl}`)}`
    : '';

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
        subject: `✦ ${prenom}, voici votre message complet`,
        htmlContent: `
          <div style="background:#080613;padding:0;font-family:Arial,sans-serif;color:white;">
            <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
              
              <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:32px;margin-bottom:8px;">✦</div>
                <h1 style="color:#D4A574;font-size:24px;margin:0;">Mystora</h1>
                <p style="color:#C4B5A0;font-size:16px;margin-top:8px;">Votre message complet, ${prenom}</p>
              </div>

              <div style="background:#1A1747;padding:28px;border-radius:16px;line-height:1.8;color:#E5E5E5;font-size:15px;border:1px solid rgba(139,92,246,0.1);">
                ${rapport.replace(/\n/g, '<br/>')}
              </div>

              ${partageUrl ? `
              <div style="background:#1A1747;padding:20px;border-radius:16px;margin-top:16px;text-align:center;border:1px solid rgba(212,165,116,0.2);">
                <p style="color:#D4A574;font-size:14px;font-weight:600;margin:0 0 12px 0;">✨ Partagez votre profil avec vos proches</p>
                <div style="margin-bottom:12px;">
                  <a href="${partageUrl}" style="color:#D4A574;font-size:13px;text-decoration:underline;">${partageUrl}</a>
                </div>
                <a href="${whatsappUrl}" style="display:inline-block;background:#22C55E;color:white;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;">💬 Partager sur WhatsApp</a>
              </div>
              ` : ''}

              <div style="text-align:center;margin-top:24px;">
                <a href="https://www.mystora.fr" style="display:inline-block;background:linear-gradient(to right,#7C3AED,#6D28D9);color:white;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">🔮 Découvrir un nouveau message</a>
              </div>

              <p style="color:#4B5563;text-align:center;font-size:11px;margin-top:24px;">Contenu de divertissement — mystora.fr</p>
            </div>
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
