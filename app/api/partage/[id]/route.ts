import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const url = `https://uw1afva6pwpbc7ln.public.blob.vercel-storage.com/rapports/${id}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erreur partage:', e);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}