import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance } = await request.json();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Tu es un astrologue expert et bienveillant. Génère un profil astrologique court et bluffant pour ${prenom}, né(e) le ${dateNaissance}. Tutoie la personne. Utilise son prénom. Sois précis, chaleureux et mystérieux. Environ 100 mots. Termine par un cliffhanger. N'utilise aucun formatage markdown, pas de **, pas de #, texte brut uniquement.`
      }
    ]
  });

  const texte = message.content[0].type === 'text' ? message.content[0].text : '';
  
  return NextResponse.json({ resultat: texte });
}