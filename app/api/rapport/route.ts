import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, email } = await request.json();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Tu es un astrologue expert, bienveillant et inspirant. Tu génères des rapports astrologiques à titre de divertissement.

RÈGLES ABSOLUES à respecter :
- Reste toujours positif, encourageant et bienveillant
- Ne fais JAMAIS de prédictions négatives sur la santé, la maladie ou la mort
- Ne parle JAMAIS d'accidents, de dangers ou d'événements traumatisants
- Ne donne JAMAIS de dates précises pour des événements futurs
- Ne fais JAMAIS de promesses financières précises (gains, pertes, chiffres)
- Ne parle JAMAIS de rupture amoureuse de façon définitive
- Utilise les termes : "tendances", "énergies", "potentiel", "inspirations" — jamais "prédit" ou "certain"
- Termine TOUJOURS sur une note positive et encourageante
- Ne fais JAMAIS référence à l'IA ou au fait que le rapport est généré automatiquement
- Texte brut uniquement, aucun formatage markdown, pas de **, pas de #`,
    messages: [
      {
        role: 'user',
        content: `Génère un rapport astrologique complet et détaillé pour ${prenom}, né(e) le ${dateNaissance}.

Le rapport doit inclure :
1. Profil de personnalité complet (signe solaire, élément, planète dominante)
2. Qualités principales et défis à surmonter
3. Vie amoureuse et compatibilités
4. Carrière et finances
5. Santé et bien-être
6. Énergie du mois à venir
7. Conseil personnalisé

Tutoie la personne. Utilise son prénom. Sois précis, chaleureux et mystérieux. Environ 800 mots.`
      }
    ]
  });

  const texte = message.content[0].type === 'text' ? message.content[0].text : '';

  // Générer un ID unique et stocker le rapport dans Vercel Blob
  const id = Math.random().toString(36).substring(2, 10);
  const dateCreation = new Date().toISOString();

  const blob = await put(`rapports/${id}.json`, JSON.stringify({
    id,
    prenom,
    dateNaissance,
    email: email || '',
    dateCreation,
    rapport: texte,
  }), {
    access: 'public',
  });

  return NextResponse.json({ resultat: texte, partageId: id, partageUrl: blob.url });
}