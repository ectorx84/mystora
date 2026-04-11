import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const client = new Anthropic();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ELEVENLABS_VOICE_ID = 'WeAAwKYcS06VmXw086yZ'; // Victoria

export async function POST(request: NextRequest) {
  const { session_id } = await request.json();

  if (!session_id) {
    return NextResponse.json({ error: 'Session manquante' }, { status: 400 });
  }

  // Vérifier le paiement Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.payment_status !== 'paid' || session.metadata?.product !== 'guidance_vocale') {
    return NextResponse.json({ error: 'Paiement non valide' }, { status: 403 });
  }

  const prenom = session.metadata?.prenom || '';
  const dateNaissance = session.metadata?.dateNaissance || '';
  const email = session.customer_email || session.metadata?.email || '';

  // Vérifier si déjà généré (idempotence)
  const cacheId = session_id.replace('cs_', '');
  const blobUrl = `${process.env.BLOB_READ_URL_PREFIX || 'https://uw1afva6pwpbc7ln.public.blob.vercel-storage.com'}/vocaux/${cacheId}.json`;
  try {
    const cached = await fetch(blobUrl);
    if (cached.ok) {
      const data = await cached.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Générer le rapport approfondi avec Claude Sonnet
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `Tu es une guide spirituelle experte, profondément intuitive et bienveillante. Tu génères des guidances personnalisées à titre de divertissement.

RÈGLES ABSOLUES :
- Reste positif, encourageant et bienveillant en toutes circonstances
- Ne fais JAMAIS de prédictions négatives sur la santé, la maladie ou la mort
- Utilise "tendances", "énergies", "potentiel" — jamais "certain" ou "prédit"
- Ne mentionne JAMAIS l'IA ou la génération automatique
- Texte brut uniquement, aucun markdown, pas de **, pas de #, pas de listes à puces
- Le texte sera LU À VOIX HAUTE par une voix synthétique — écris pour l'oreille, pas pour l'œil
- Phrases fluides, naturelles, avec des respirations. Pas de tirets, pas de parenthèses.
- Vouvoiement obligatoire`,
    messages: [
      {
        role: 'user',
        content: `Génère une guidance approfondie et intimement personnalisée pour ${prenom}, né(e) le ${dateNaissance}.

Ce texte sera narré à voix haute. Il doit couler naturellement, comme une confidence intime.

Structure en 12 révélations enchaînées sans titres, sans numéros, sans séparateurs. Un seul texte qui respire.

Les 12 révélations à tisser dans le texte :
1. Ce que votre énergie de naissance révèle sur qui vous êtes vraiment
2. Le don caché que vous ne voyez pas en vous
3. Le schéma répétitif que vos astres ont inscrit dans votre vie
4. Ce qui vous retient sans que vous le réalisiez
5. La relation ou la situation qui mérite votre attention en ce moment
6. Ce que vos proches perçoivent de vous sans jamais vous le dire
7. Le tournant que les étoiles préparent pour vous
8. Votre plus grande force — celle que vous sous-estimez
9. Un message du passé qui éclaire votre présent
10. Ce que votre intuition tente de vous dire depuis longtemps
11. L'énergie des prochaines semaines et comment en tirer parti
12. Un message final, personnel, destiné uniquement à ${prenom}

Commence directement par une phrase d'ouverture puissante qui nomme ${prenom}. Environ 1200 mots. Ton : intime, mystérieux, chaleureux, jamais condescendant.`,
      },
    ],
  });

  const texteRapport = message.content[0].type === 'text' ? message.content[0].text : '';

  // Générer l'audio avec ElevenLabs Victoria
  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: texteRapport,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!elevenRes.ok) {
    return NextResponse.json({ error: 'Erreur génération audio' }, { status: 500 });
  }

  const audioBuffer = await elevenRes.arrayBuffer();

  // Stocker MP3 dans Vercel Blob
  const audioBlob = await put(`vocaux/${cacheId}.mp3`, Buffer.from(audioBuffer), {
    access: 'public',
    contentType: 'audio/mpeg',
  });

  // Stocker données complètes dans Vercel Blob
  const payload = {
    prenom,
    dateNaissance,
    email,
    rapport: texteRapport,
    audioUrl: audioBlob.url,
    dateCreation: new Date().toISOString(),
  };

  await put(`vocaux/${cacheId}.json`, JSON.stringify(payload), {
    access: 'public',
    contentType: 'application/json',
  });

  // Envoyer email avec lien audio
  if (email) {
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/send-rapport-vocal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, prenom, rapport: texteRapport, audioUrl: audioBlob.url }),
    }).catch(() => {});
  }

  return NextResponse.json(payload);
}
