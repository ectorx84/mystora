import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

const SECRET = 'rjB_GiILOuCVfgHVtA0pIn3po8nk7tT0_t4ibMnVKbE';
const BLOB_BASE = 'https://uw1afva6pwpbc7ln.public.blob.vercel-storage.com';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Lister tous les blobs dans le dossier pawapay/
    const { blobs } = await list({ prefix: 'pawapay/' });

    // 2. Récupérer le contenu de chaque blob (rapport PawaPay)
    const deposits = [];
    for (const blob of blobs) {
      try {
        const res = await fetch(blob.url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          deposits.push({
            depositId: blob.pathname.replace('pawapay/', '').replace('.json', ''),
            uploadedAt: blob.uploadedAt,
            prenom: data.prenom || '',
            email: data.email || '',
            country: data.country || '',
            status: data.status || 'completed',
            partageId: data.partageId || '',
            hasRapport: !!data.rapport,
          });
        }
      } catch {
        // Skip blobs qui ne sont pas du JSON valide
      }
    }

    // 3. Trier par date décroissante
    deposits.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    // 4. Vérifier aussi les dépôts en échec via l'API PawaPay (si deposit IDs connus)
    // PawaPay n'a pas de listing endpoint, on ne peut checker que par ID
    // Les échecs ne créent pas de blob → on les track via les logs Vercel

    // 5. Résumé
    const totalCFA = deposits.length * 1306; // Montant fixe XAF/XOF
    const totalEUR = Math.round((totalCFA / 655.957) * 100) / 100;

    return NextResponse.json({
      summary: {
        totalCompleted: deposits.length,
        totalEUR,
        totalCFA,
      },
      deposits,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Exception', message: err.message },
      { status: 500 }
    );
  }
}
