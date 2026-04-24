// One-shot : réponse perso soft à Patrick Itsegou qui a remercié sans acheter
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

(async () => {
  const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
    body: JSON.stringify({
      sender: { name: 'Mystora', email: 'contact@mystora.fr' },
      to: [{ email: EMAIL, name: PRENOM }],
      subject: `Re: Tu n'es pas la seule à hésiter`,
      htmlContent: `
        <div style="background:#080613;padding:0;font-family:Arial,sans-serif;color:white;">
          <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:8px;">🔮</div>
              <h1 style="color:#D4A574;font-size:28px;margin:0;letter-spacing:2px;">MYSTORA</h1>
            </div>
            <div style="background:#1A1747;padding:32px 28px;border-radius:16px;line-height:1.8;color:#E5E5E5;font-size:16px;border:1px solid rgba(139,92,246,0.1);">
              <p style="margin:0 0 20px 0;">Merci Patrick pour ton retour, ça me touche sincèrement.</p>

              <p style="margin:0 0 20px 0;">Si un jour tu veux aller au bout et débloquer ton rapport complet, il t'attend toujours ici :</p>

              <div style="text-align:center;margin:28px 0;">
                <a href="https://mystora.fr/checkout" style="display:inline-block;background:linear-gradient(135deg,#D4A574,#B8935F);color:#080613;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Débloquer mon rapport — 4,90€</a>
              </div>

              <p style="margin:0 0 20px 0;color:#C4B5A0;font-style:italic;">Aucune pression — prends le temps qu'il te faut.</p>

              <p style="margin:0;">Belle journée à toi,<br/><span style="color:#D4A574;">Mystora</span></p>
            </div>
            <p style="color:#4B5563;text-align:center;font-size:11px;margin-top:24px;">Contenu de divertissement — mystora.fr</p>
          </div>
        </div>
      `,
    }),
  });
  console.log('Brevo status:', emailRes.status, await emailRes.text());
})();
