import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

// ============ VRAIS CALCULS ASTRO/NUMÉROLOGIE ============

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
    if (s.start[0] === s.end[0]) {
      if (month === s.start[0] && day >= s.start[1] && day <= s.end[1]) return s;
    } else if (s.start[0] === 12 && s.end[0] === 1) {
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
  // Approximate decan by day within sign
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
  const d = reduceToSingle(day);
  const m = reduceToSingle(month);
  const y = reduceToSingle(Array.from(String(year)).reduce((s, c) => s + parseInt(c), 0));
  return reduceToSingle(d + m + y);
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
  const currentMonth = new Date().getMonth() + 1;
  return reduceToSingle(getPersonalYear(day, month) + currentMonth);
}

const LIFE_PATH_KEYWORDS: Record<number, string> = {
  1: 'leader né, indépendant, pionnier',
  2: 'diplomate, sensible, médiateur',
  3: 'créatif, expressif, communicant',
  4: 'bâtisseur, stable, méthodique',
  5: 'aventurier, libre, adaptable',
  6: 'protecteur, responsable, harmonieux',
  7: 'chercheur, spirituel, analytique',
  8: 'ambitieux, puissant, matérialiste',
  9: 'humaniste, généreux, visionnaire',
  11: 'intuitif, inspirant, maître spirituel',
  22: 'maître bâtisseur, visionnaire, accomplisseur',
  33: 'maître enseignant, guérisseur, altruiste',
};

// ============ API ROUTE ============

// ============ API ROUTE ============

export async function POST(request: NextRequest) {
  const { prenom, dateNaissance, intention } = await request.json();
  
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

  const astroData = `DONNÉES ASTRO-NUMÉROLOGIQUES RÉELLES DE ${prenom} :
- Signe solaire : ${zodiac.name} (${zodiac.element}, ${zodiac.modalite})
- Planète dominante : ${zodiac.planete}
- Décan : ${decan.num}e décan, influence ${decan.influence}
- Chemin de vie : ${lifePath} (${LIFE_PATH_KEYWORDS[lifePath] || 'unique'})
- Nombre d'expression (prénom) : ${expression}
- Nombre intime (voyelles) : ${soulUrge}
- Année personnelle 2026 : ${personalYear}
- Mois personnel actuel : ${personalMonth}`;

  const intentionLabels: Record<string, string> = {
    amour: 'amour et relations',
    carriere: 'carrière et évolution professionnelle',
    argent: 'argent et finances',
    blocage: 'blocages personnels et libération',
  };
  const intentionText = intention && intentionLabels[intention]
    ? `\n- Domaine de préoccupation : ${intentionLabels[intention]}`
    : '';

  const intentionInstruction = intention && intentionLabels[intention]
    ? `La personne veut éclaircir : ${intentionLabels[intention]}. La phrase 3 DOIT aborder ce sujet spécifiquement.`
    : '';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    system: `Tu es un guide spirituel pour Mystora. Tu transmets un message personnel qui semble venir de l'univers.

CONTEXTE INTERNE (utilise pour personnaliser, mais NE CITE PAS les termes techniques) :
${astroData}

RÈGLES ABSOLUES :
- EXACTEMENT 5 phrases. Pas 3. Pas 6. CINQ phrases.
- Écris comme si l'univers envoyait un message DIRECTEMENT à ${prenom}. Pas comme un astrologue qui analyse.
- INTERDIT de citer : "chemin de vie", "nombre d'expression", "nombre intime", "décan", "année personnelle", "mois personnel", "nombre", "vibration". Ces termes sont trop techniques et cassent l'immersion.
- Tu peux mentionner le signe (${zodiac.name}) UNE SEULE FOIS, naturellement.
- Phrase 1 (MIROIR) : Commence par le prénom. Décris un trait de personnalité profond et intime que la personne reconnaîtra immédiatement. Sois précis, pas vague.
- Phrase 2 (TENSION) : Révèle ce qui se passe EN CE MOMENT dans sa vie — un tiraillement, une décision repoussée, quelque chose qui pèse. Sois concret.
- Phrase 3 (LIEN) : ${intentionInstruction || 'Touche un point sensible — amour, solitude, ambition frustrée, peur de l\'échec. Quelque chose d\'émotionnel et universel.'} Fais référence à quelque chose de spécifique.
- Phrase 4 (SIGNAL) : Annonce quelque chose de concret qui va arriver — une rencontre, un signe, un changement. Crée de l'anticipation.
- Phrase 5 (COUPURE) : Commence à révéler quelque chose de TRÈS SPÉCIFIQUE — une date précise (un mois de 2026), un chiffre, un détail concret sur l'amour ou l'argent de ${prenom} — puis COUPE NET au milieu du mot ou de la phrase. La phrase DOIT être INCOMPLÈTE et donner l'impression que l'information la plus importante est JUSTE après la coupure. Exemple de structure : "${prenom}, ce que votre message révèle sur le mois de [mois], c'est que quelqu'un de très proche va—"
- Vouvoie TOUJOURS. Utilise le prénom.
- Ton : intime, bienveillant mais direct. Comme un message personnel qu'on reçoit et qui donne des frissons.
- Texte brut, pas de markdown, pas de titres, pas de gras, pas de numéros.
- Ne mentionne jamais l'IA.
- Entre 80 et 130 mots.`,
    messages: [
      {
        role: 'user',
        content: `Génère le message personnel pour ${prenom}.${intentionText ? ` Domaine qui préoccupe : ${intentionLabels[intention]}.` : ''} La 5ème phrase DOIT être coupée au milieu.`
      }
    ]
  });

  const texte = message.content[0].type === 'text' ? message.content[0].text : '';
  
  return NextResponse.json({ resultat: texte, signe: zodiac.name });
}
