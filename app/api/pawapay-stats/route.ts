import { NextRequest, NextResponse } from 'next/server';

const SECRET = 'rjB_GiILOuCVfgHVtA0pIn3po8nk7tT0_t4ibMnVKbE';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.PAWAPAY_API_TOKEN) {
    return NextResponse.json({ error: 'PAWAPAY_API_TOKEN not configured' }, { status: 500 });
  }

  // Paramètres optionnels
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - days);

  try {
    // Récupérer les dépôts via l'API PawaPay
    const res = await fetch(
      `https://api.pawapay.io/v1/deposits?createdAfter=${afterDate.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: 'PawaPay API error', status: res.status, details: errText },
        { status: 502 }
      );
    }

    const deposits = await res.json();

    // Résumé
    const completed = deposits.filter((d: any) => d.status === 'COMPLETED');
    const failed = deposits.filter((d: any) => d.status === 'FAILED' || d.status === 'REJECTED');
    const pending = deposits.filter((d: any) => !['COMPLETED', 'FAILED', 'REJECTED'].includes(d.status));

    // Formater chaque dépôt
    const formatted = deposits.map((d: any) => ({
      depositId: d.depositId,
      created: d.created,
      status: d.status,
      amount: d.amount,
      currency: d.currency,
      country: d.correspondent?.country || d.country || '',
      correspondent: d.correspondent?.name || d.correspondentId || '',
      failureReason: d.failureReason?.failureCode || null,
      metadata: d.metadata || [],
      // Extraire prénom des metadata
      prenom: d.metadata?.find((m: any) => m.fieldName === 'prenom')?.fieldValue || '',
    }));

    // Trier par date décroissante
    formatted.sort((a: any, b: any) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    );

    // Calculer le total en EUR (approximatif)
    const totalXOF = completed
      .filter((d: any) => d.currency === 'XOF' || d.currency === 'XAF')
      .reduce((sum: number, d: any) => sum + parseFloat(d.amount || '0'), 0);
    const totalEUR = totalXOF / 655.957; // Taux fixe CFA

    return NextResponse.json({
      period: `${days} derniers jours`,
      summary: {
        total: deposits.length,
        completed: completed.length,
        failed: failed.length,
        pending: pending.length,
        totalEUR: Math.round(totalEUR * 100) / 100,
      },
      deposits: formatted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Exception', message: err.message },
      { status: 500 }
    );
  }
}
