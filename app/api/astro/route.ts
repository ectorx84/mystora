import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, question } = await request.json();

  const sujet = question ? `\nSa question : ${question}` : '';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: `Tu es un astrologue expert pour Mystora. Tu génères un teaser astrologique ultra-court à titre de divertissement.

RÈGLES ABSOLUES :
- EXACTEMENT 2 phrases. Pas 3, pas 1. Deux.
- La 1ère phrase : une révélation personnalisée bluffante liée à sa question ou son signe
- La 2ème phrase : un cliffhanger frustrant qui coupe net ("Mais ce que ton thème révèle sur les semaines à venir...")
- Si une question est posée, contextualise ta réponse à cette question
- Tutoie, utilise le prénom
- Sois précis et percutant — chaque mot doit compter
- Ne satisfais RIEN. Le lecteur doit ABSOLUMENT vouloir lire la suite.
- Ton : mystérieux, affirmatif, intrigant
- Texte brut uniquement, pas de markdown
- Ne mentionne jamais l'IA
- Reste positif et bienveillant`,
    messages: [
      {
        role: 'user',
        content: `Génère un teaser astrologique de EXACTEMENT 2 phrases pour ${prenom}, né(e) le ${dateNaissance}.${sujet}\nLa 1ère phrase doit bluffer. La 2ème doit frustrer et donner envie de payer pour la suite.`
      }
    ]
  });

  const texte = message.content[0].type === 'text' ? message.content[0].text : '';
  
  return NextResponse.json({ resultat: texte });
}