import { NextRequest, NextResponse } from 'next/server';

// Tracking léger côté serveur — les événements sont loggés dans Vercel Function Logs
// + envoyés à Brevo comme attributs si email disponible
// Visible dans : Vercel Dashboard → Logs → Function Logs

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json();
    
    const country = request.headers.get('x-vercel-ip-country') || 'unknown';
    const ua = request.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone/i.test(ua);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      country,
      device: isMobile ? 'mobile' : 'desktop',
      ...data,
    };

    // Log structuré — visible dans Vercel Function Logs
    console.log(`[MYSTORA_EVENT] ${JSON.stringify(logEntry)}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
