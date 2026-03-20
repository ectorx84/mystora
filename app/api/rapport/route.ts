import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const client = new Anthropic();

// ============ VRAIS CALCULS (mêmes que dans /api/astro) ============

function getZodiac(day: number, month: number) {
  const signs = [
    { name: 'Capricorne', element: 'Terre', modalite: 'Cardinal', planete: 'Saturne', start: [12,22], end: [1,19] },
    { name: 'Verseau', element: 'Air', modalite: 'Fixe', planete: 'Uranus', start: [1,20], end: [2,18] },
    { name: 'Poissons', element: 'Eau', modalite: 'Mutable', planete: 'Neptune', start: [2,19], end: [3,20] },
    { name: 'Bélier', element: 'Feu', modalite: 'Cardinal', planete: 'Mars', start: [3,21], end: [4,19] },
    { name: 'Taureau', element: 'Terre', modalite: 'Fixe', planete: 'Vénus', start: [4,20], end: [5,20] },
    { name: 'Gémeaux', element: 'Air', modalite: 'Mutable', planete: 'Mercure', start: [5,21], end: [6,20] },
    { name: 'Cancer', element: 'Eau', modalite: 'Cardinal', planete: 'Lune', start: [6,21], end: [7,22] },
    { name: 'Lion', element: 'Feu', modalite: 'Fixe', planete: 'Soleil', start: [7,23], end: [8,22] },
    { name: 'Vierge', element: 'Terre', modalite: 'Mutable', planete: 'Mercure', start: [8,23], end: [9,22] },
    { name: 'Balance', element: 'Air', modalite: 'Cardinal', planete: 'Vénus', start: [9,23], end: [10,22] },
    { name: 'Scorpion', element: 'Eau', modalite: 'Fixe', planete: 'Pluton', start: [10,23], end: [11,21] },
    { name: 'Sagittaire', element: 'Feu', modalite: 'Mutable', planete: 'Jupiter', start: [11,22], end: [12,21] },
  ];
  for (const s of signs) {
    if (s.start[0] === 12 && s.end[0] === 1) {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return s;
    } else {
      if ((month === s.start[0] && day >= s.start[1]) || (month === s.end[0] && day <= s.end[1])) return s;
    }
  }
  return signs[0];
}

function getDecan(day: number, month: number) {
  const zodiac = getZodiac(day, month);
  const signs = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];
  const idx = signs.indexOf(zodiac.name);
  const startDays = [21,20,21,21,23,23,23,23,22,22,20,22];
  const signStart = startDays[idx] || 21;
  const dayInSign = day >= signStart ? day - signStart : day + 10;
  if (dayInSign < 10) return { num: 1, influence: signs[idx] };
  if (dayInSign < 20) return { num: 2, influence: signs[(idx + 4) % 12] };
  return { num: 3, influence: signs[(idx + 8) % 12] };
}

function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    let sum = 0;
    for (const d of String(n)) sum += parseInt(d);
    n = sum;
  }
  return n;
}

function getLifePath(day: number, month: number, year: number): number {
  return reduceToSingle(reduceToSingle(day) + reduceToSingle(month) + reduceToSingle(Array.from(String(year)).reduce((s, c) => s + parseInt(c), 0)));
}

function getExpressionNumber(prenom: string): number {
  const table: Record<string, number> = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8};
  const clean = prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  let sum = 0;
  for (const c of clean) sum += table[c] || 0;
  return reduceToSingle(sum);
}

function getSoulUrge(prenom: string): number {
  const table: Record<string, number> = {a:1,e:5,i:9,o:6,u:3,y:7};
  const clean = prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  let sum = 0;
  for (const c of clean) { if (table[c]) sum += table[c]; }
  return reduceToSingle(sum);
}

function getPersonalYear(day: number, month: number): number {
  const currentYear = new Date().getFullYear();
  return reduceToSingle(day + month + reduceToSingle(Array.from(String(currentYear)).reduce((s, c) => s + parseInt(c), 0)));
}

function getPersonalMonth(day: number, month: number): number {
  return reduceToSingle(getPersonalYear(day, month) + new Date().getMonth() + 1);
}

function getCompatibleSigns(signName: string): string[] {
  const compat: Record<string, string[]> = {
    'Bélier': ['Lion','Sagittaire','Gémeaux','Verseau'],
    'Taureau': ['Vierge','Capricorne','Cancer','Poissons'],
    'Gémeaux': ['Balance','Verseau','Bélier','Lion'],
    'Cancer': ['Scorpion','Poissons','Taureau','Vierge'],
    'Lion': ['Bélier','Sagittaire','Gémeaux','Balance'],
    'Vierge': ['Taureau','Capricorne','Cancer','Scorpion'],
    'Balance': ['Gémeaux','Verseau','Lion','Sagittaire'],
    'Scorpion': ['Cancer','Poissons','Vierge','Capricorne'],
    'Sagittaire': ['Bélier','Lion','Balance','Verseau'],
    'Capricorne': ['Taureau','Vierge','Scorpion','Poissons'],
    'Verseau': ['Gémeaux','Balance','Bélier','Sagittaire'],
    'Poissons': ['Cancer','Scorpion','Taureau','Capricorne'],
  };
  return compat[signName] || [];
}

// ============ API ROUTE ============

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, email, question } = await request.json();
  
  const parts = dateNaissance.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  const zodiac = getZodiac(day, month);
  const decan = getDecan(day, month);
  const lifePath = getLifePath(day, month, year);
  const expression = getExpressionNumber(prenom);
  const soulUrge = getSoulUrge(prenom);
  const personalYear = getPersonalYear(day, month);
  const personalMonth = getPersonalMonth(day, month);
  const compatible = getCompatibleSigns(zodiac.name);

  const astroData = `DONNÉES ASTRO-NUMÉROLOGIQUES RÉELLES :
- Prénom : ${prenom}
- Date de naissance : ${day}/${month}/${year}
- Signe solaire : ${zodiac.name}
- Élément : ${zodiac.element}
- Modalité : ${zodiac.modalite}
- Planète dominante : ${zodiac.planete}
- Décan : ${decan.num}e décan (influence ${decan.influence})
- Chemin de vie : ${lifePath}
- Nombre d'expression (vibration du prénom) : ${expression}
- Nombre intime (désir de l'âme) : ${soulUrge}
- Année personnelle 2026 : ${personalYear}
- Mois personnel actuel : ${personalMonth}
- Signes les plus compatibles : ${compatible.join(', ')}`;

  const questionContext = question ? `\n\nIMPORTANT : La personne a posé cette question : "${question}". Commence le rapport en répondant directement à cette question en utilisant les données astro-numérologiques réelles, PUIS enchaîne avec le profil complet.` : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Tu es un astrologue et numérologue expert. Tu génères des rapports basés sur de VRAIES données astro-numérologiques à titre de divertissement.

RÈGLES :
- Utilise TOUTES les données réelles fournies (signe, décan, chemin de vie, nombres, année personnelle, etc.)
- Cite les vrais chiffres et correspondances dans le rapport
- Explique ce que chaque nombre signifie concrètement pour la personne
- Fais des liens entre les différentes données (ex: "Ton chemin de vie 7 combiné à ton année personnelle 3 crée...")
- Reste positif, encourageant et bienveillant
- Ne fais JAMAIS de prédictions négatives (santé, mort, accidents)
- Utilise "tendances", "énergies", "potentiel" — jamais "prédit" ou "certain"
- Ne mentionne JAMAIS l'IA
- Texte brut uniquement, pas de markdown, pas de **, pas de #
- Tutoie, utilise le prénom`,
    messages: [
      {
        role: 'user',
        content: `${astroData}${questionContext}

Génère un rapport complet pour ${prenom} en utilisant TOUTES les données ci-dessus :

1. Réponse à la question (si posée) — basée sur les données réelles
2. Profil de personnalité (signe + décan + élément + planète)
3. Numérologie : chemin de vie ${lifePath}, expression ${expression}, nombre intime ${soulUrge}
4. Vie amoureuse (compatibilités réelles : ${compatible.join(', ')})
5. Carrière et finances (basées sur chemin de vie et année personnelle)
6. Année personnelle ${personalYear} — ce que ça signifie pour 2026
7. Mois personnel ${personalMonth} — énergies du moment
8. Conseil personnalisé final

Environ 800-1000 mots. Chaque section doit citer les vrais chiffres.`
      }
    ]
  });

  const texte = message.content[0].type === 'text' ? message.content[0].text : '';

  const id = Math.random().toString(36).substring(2, 10);
  const dateCreation = new Date().toISOString();

  const blob = await put(`rapports/${id}.json`, JSON.stringify({
    id, prenom, dateNaissance, email: email || '', question: question || '', dateCreation, rapport: texte,
  }), { access: 'public' });

  return NextResponse.json({ resultat: texte, partageId: id, partageUrl: blob.url });
}