import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance } = await request.json();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `Tu es un astrologue expert, bienveillant et inspirant. Tu génères des profils astrologiques à titre de divertissement.

RÈGLES ABSOLUES à respecter :
- Reste toujours positif, encourageant et bienveillant
- Ne fais JAMAIS de prédictions négatives sur la santé, la maladie ou la mort
- Ne parle JAMAIS d'accidents, de dangers ou d'événements traumatisants
- Ne donne JAMAIS de dates précises pour des événements futurs
- Ne fais JAMAIS de promesses financières précises
- Utilise les termes : "tendances", "énergies", "potentiel" — jamais "prédit" ou "certain"
- Ne fais JAMAIS référence à l'IA ou au fait que le profil est généré automatiquement
- Texte brut uniquement, aucun formatage markdown, pas de **, pas de #`,
    messages: [
      {
        role: 'user',
        content: `Génère un profil astrologique court et bluffant pour ${prenom}, né(e) le ${dateNaissance}. Tutoie la personne. Utilise son prénom. Sois précis, chaleureux et mystérieux. Environ 100 mots. Termine par un cliffhanger qui donne envie d'en savoir plus.`
      }
    ]
  });

  const texte = message.content[0].type === 'text' ? message.content[0].text : '';
  
  return NextResponse.json({ resultat: texte });
}