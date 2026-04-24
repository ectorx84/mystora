// One-shot : régénère et renvoie le rapport à Hélène Normandin avec la bonne date (04/12/1963)
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

const PRENOM = 'Hélène';
const EMAIL = 'picotine58@outlook.com';
const DAY = 4, MONTH = 12, YEAR = 1963;

function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    let sum = 0;
    for (const d of String(n)) sum += parseInt(d);
    n = sum;
  }
  return n;
}
function getLifePath(d: number, m: number, y: number) {
  return reduceToSingle(reduceToSingle(d) + reduceToSingle(m) + reduceToSingle(Array.from(String(y)).reduce((s, c) => s + parseInt(c), 0)));
}
function getExpressionNumber(p: string) {
  const t: Record<string, number> = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8};
  const c = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
  let s = 0; for (const x of c) s += t[x]||0; return reduceToSingle(s);
}
function getSoulUrge(p: string) {
  const t: Record<string, number> = {a:1,e:5,i:9,o:6,u:3,y:7};
  const c = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
  let s = 0; for (const x of c) if (t[x]) s += t[x]; return reduceToSingle(s);
}
function getPersonalYear(d: number, m: number) {
  return reduceToSingle(d + m + reduceToSingle(Array.from(String(2026)).reduce((s, c) => s + parseInt(c), 0)));
}

const lifePath = getLifePath(DAY, MONTH, YEAR);
const expression = getExpressionNumber(PRENOM);
const soulUrge = getSoulUrge(PRENOM);
const personalYear = getPersonalYear(DAY, MONTH);
const personalMonth = reduceToSingle(personalYear + 4);

const astroData = `DONNÉES ASTRO-NUMÉROLOGIQUES RÉELLES :
- Prénom : ${PRENOM}
- Date de naissance : ${DAY}/${MONTH}/${YEAR}
- Signe solaire : Sagittaire
- Élément : Feu
- Modalité : Mutable
- Planète dominante : Jupiter
- Décan : 2e décan (influence Mars)
- Chemin de vie : ${lifePath}
- Nombre d'expression : ${expression}
- Nombre intime : ${soulUrge}
- Année personnelle 2026 : ${personalYear}
- Mois personnel actuel : ${personalMonth}
- Signes les plus compatibles : Bélier, Lion, Balance, Verseau`;

console.log(astroData);

(async () => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Tu es un astrologue et numérologue expert. Tu génères des rapports basés sur de VRAIES données astro-numérologiques à titre de divertissement.

RÈGLES :
- Utilise TOUTES les données réelles fournies (signe, décan, chemin de vie, nombres, année personnelle, etc.)
- Cite les vrais chiffres et correspondances dans le rapport
- Explique ce que chaque nombre signifie concrètement pour la personne
- Fais des liens entre les différentes données
- Reste positif, encourageant et bienveillant
- Ne fais JAMAIS de prédictions négatives (santé, mort, accidents)
- Utilise "tendances", "énergies", "potentiel" — jamais "prédit" ou "certain"
- Ne mentionne JAMAIS l'IA
- Texte brut uniquement, pas de markdown, pas de **, pas de #
- Vouvoie TOUJOURS. Utilise le prénom`,
    messages: [{
      role: 'user',
      content: `${astroData}

Génère un rapport complet pour ${PRENOM} en utilisant TOUTES les données ci-dessus :

1. Profil de personnalité (signe + décan + élément + planète)
2. Numérologie : chemin de vie ${lifePath}, expression ${expression}, nombre intime ${soulUrge}
3. Vie amoureuse (compatibilités réelles : Bélier, Lion, Balance, Verseau)
4. Carrière et finances (basées sur chemin de vie et année personnelle) — la question d'origine était l'ARGENT, accorde une attention particulière à cette thématique
5. Année personnelle ${personalYear} — ce que ça signifie pour 2026
6. Mois personnel ${personalMonth} — énergies du moment
7. Conseil personnalisé final

Environ 800-1000 mots. Chaque section doit citer les vrais chiffres.`
    }]
  });

  const texte = msg.content[0].type === 'text' ? msg.content[0].text : '';
  console.log('\n=== RAPPORT ===\n', texte, '\n===\n');

  const rapportFinal = `Bonjour ${PRENOM},

Suite à votre signalement, voici votre rapport recalculé avec votre date de naissance correcte : 4 décembre 1963. Vous aviez raison : vous êtes bien Sagittaire, et non Capricorne. Toutes nos excuses pour le désagrément.

---

${texte}`;

  const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
    body: JSON.stringify({
      sender: { name: 'Mystora', email: 'contact@mystora.fr' },
      to: [{ email: EMAIL, name: PRENOM }],
      subject: `✦ ${PRENOM}, votre rapport corrigé (04/12/1963)`,
      htmlContent: `
        <div style="background:#080613;padding:0;font-family:Arial,sans-serif;color:white;">
          <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:8px;">✦</div>
              <h1 style="color:#D4A574;font-size:24px;margin:0;">Mystora</h1>
              <p style="color:#C4B5A0;font-size:16px;margin-top:8px;">Votre rapport corrigé, ${PRENOM}</p>
            </div>
            <div style="background:#1A1747;padding:28px;border-radius:16px;line-height:1.8;color:#E5E5E5;font-size:15px;border:1px solid rgba(139,92,246,0.1);">
              ${rapportFinal.replace(/\n/g, '<br/>')}
            </div>
            <p style="color:#4B5563;text-align:center;font-size:11px;margin-top:24px;">Contenu de divertissement — mystora.fr</p>
          </div>
        </div>
      `,
    }),
  });
  console.log('Brevo status:', emailRes.status, await emailRes.text());
})();
