import { NextRequest, NextResponse } from 'next/server';

const BLOB_BASE = 'https://uw1afva6pwpbc7ln.public.blob.vercel-storage.com';

export async function GET(request: NextRequest) {
  const depositId = request.nextUrl.searchParams.get('deposit_id');

  if (!depositId) {
    return NextResponse.json({ error: 'deposit_id requis' }, { status: 400 });
  }

  // 1. Vérifier si le rapport a déjà été généré par le callback
  try {
    const blobRes = await fetch(`${BLOB_BASE}/pawapay/${depositId}.json`, {
      cache: 'no-store',
    });
    if (blobRes.ok) {
      const data = await blobRes.json();
      if (data.status === 'completed' && data.rapport) {
        return NextResponse.json({
          status: 'completed',
          rapport: data.rapport,
          prenom: data.prenom,
          dateNaissance: data.dateNaissance || '',
          email: data.email || '',
          partageId: data.partageId,
        });
      }
    }
  } catch {
    // Blob pas encore écrit — on continue
  }

  // 2. Vérifier le statut du dépôt directement via l'API PawaPay
  if (process.env.PAWAPAY_API_TOKEN) {
    try {
      const pawapayRes = await fetch(`https://api.pawapay.io/v1/deposits/${depositId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
        },
        cache: 'no-store',
      });

      if (pawapayRes.ok) {
        const deposit = await pawapayRes.json();
        
        if (deposit[0]?.status === 'COMPLETED') {
          // Le paiement est confirmé mais le callback n'a pas encore écrit le rapport
          // → on attend que le callback le fasse
          return NextResponse.json({ status: 'processing' });
        }
        
        if (deposit[0]?.status === 'FAILED' || deposit[0]?.status === 'REJECTED') {
          return NextResponse.json({
            status: 'failed',
            reason: deposit[0]?.failureReason?.failureCode || 'UNKNOWN',
          });
        }

        // ACCEPTED, SUBMITTED = encore en attente
        return NextResponse.json({ status: 'pending' });
      }
    } catch (err) {
      console.error('[PAWAPAY_STATUS_ERROR]', err);
    }
  }

  // Pas encore de résultat
  return NextResponse.json({ status: 'pending' });
}
