import { NextResponse } from 'next/server';

export async function GET() {
  if (!process.env.PAWAPAY_API_TOKEN) {
    return NextResponse.json({ error: 'no token' }, { status: 500 });
  }
  
  try {
    const res = await fetch('https://api.pawapay.io/active-conf', {
      headers: {
        'Authorization': `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
      },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
