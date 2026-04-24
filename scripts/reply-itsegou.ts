// One-shot : répond à Patrick Itsegou qui conteste son nombre intime 2
// Explique la distinction entre nombre intime (voyelles) et nombre du jour (21→3)
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

const PRENOM = 'Patrick';
const EMAIL = 'patrickitsegou@gmail.com';

const messageTexte = `Bonjour ${PRENOM},

Merci pour votre retour attentif et bienveillant — vous avez raison sur un point : votre jour de naissance (21) porte bien la vibration du 3 (2+1). C'est ce qu'on appelle en numérologie le "nombre du jour", une fréquence complémentaire à votre thème.

La nuance : le "nombre intime 2" de votre rapport est calculé sur les voyelles de votre prénom complet (Ernest Patrick → E+E+A+I = 5+5+1+9 = 20 → 2). Il exprime votre âme profonde, votre boussole intérieure. Votre jour 21 porte, lui, le 3 : la parole, la créativité, le rayonnement.

Votre profil complet est donc plus riche que les 3 nombres cités :

• Chemin de vie 9 — accomplissement, sagesse universelle
• Expression 6 — amour, service, beauté
• Intime 2 — âme : recevoir, aimer en profondeur
• Jour 3 — rayonner, créer, inspirer les autres

L'alignement 3-6-9 que vous évoquez est particulièrement puissant : il dessine votre rayonnement extérieur, comment le monde vous perçoit quand vous êtes dans votre pleine expression. Le 2 intérieur reste votre boussole intime — les deux cohabitent et se complètent, comme deux faces d'une même pièce.

Merci encore pour votre message, et belle journée à vous.

L'équipe Mystora`;

(async () => {
  const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
    body: JSON.stringify({
      sender: { name: 'Mystora', email: 'contact@mystora.fr' },
      to: [{ email: EMAIL, name: PRENOM }],
      subject: `✦ ${PRENOM}, votre alignement 3-6-9 — précision sur vos nombres`,
      htmlContent: `
        <div style="background:#080613;padding:0;font-family:Arial,sans-serif;color:white;">
          <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:8px;">✦</div>
              <h1 style="color:#D4A574;font-size:24px;margin:0;">Mystora</h1>
              <p style="color:#C4B5A0;font-size:16px;margin-top:8px;">Précision sur vos nombres, ${PRENOM}</p>
            </div>
            <div style="background:#1A1747;padding:28px;border-radius:16px;line-height:1.8;color:#E5E5E5;font-size:15px;border:1px solid rgba(139,92,246,0.1);">
              ${messageTexte.replace(/\n/g, '<br/>')}
            </div>
            <p style="color:#4B5563;text-align:center;font-size:11px;margin-top:24px;">Contenu de divertissement — mystora.fr</p>
          </div>
        </div>
      `,
    }),
  });
  console.log('Brevo status:', emailRes.status, await emailRes.text());
})();
