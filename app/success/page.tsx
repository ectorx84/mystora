'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const prenom = searchParams.get('prenom') || '';
  const date = searchParams.get('date') || '';
  const email = searchParams.get('email') || '';
  const [rapport, setRapport] = useState('');
  const [loading, setLoading] = useState(true);
  const [emailEnvoye, setEmailEnvoye] = useState(false);
  const [copie, setCopie] = useState(false);
  const [partageId, setPartageId] = useState('');
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellLoading, setUpsellLoading] = useState(false);

  useEffect(() => {
    if (prenom && date) {
      fetch('/api/rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, dateNaissance: date, email }),
      })
        .then((res) => res.json())
        .then((data) => {
          setRapport(data.resultat);
          setPartageId(data.partageId);
          setLoading(false);
          if (email && !emailEnvoye) {
            fetch('/api/send-rapport', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, prenom, rapport: data.resultat }),
            });
            setEmailEnvoye(true);
          }
          // Afficher l'upsell après 6 secondes (temps de lire le début)
          setTimeout(() => setShowUpsell(true), 6000);
        });
    }
  }, [prenom, date]);

  const partagerWhatsApp = () => {
    const lien = `${window.location.origin}/partage/${partageId}`;
    const message = `Je viens de découvrir mon profil astrologique complet grâce à l'IA 🔮 Regarde ce que les astres disent de moi... et découvre le tien : ${lien}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copierLien = () => {
    const lien = `${window.location.origin}/partage/${partageId}`;
    navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  const accederGuidanceVocale = async () => {
    setUpsellLoading(true);
    const res = await fetch('/api/checkout-upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, dateNaissance: date, email, partageId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpsellLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#1E1B4B] flex flex-col items-center px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🔮 Mystora</h1>
        <p className="text-[#D4A574] text-lg">Votre rapport complet, {prenom}</p>
      </div>

      <div className="bg-[#2D2A6E] rounded-2xl p-8 w-full max-w-2xl shadow-xl">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#D4A574] text-xl animate-pulse">✨ Les astres révèlent votre destinée...</p>
          </div>
        ) : (
          <>
            <div className="text-white leading-relaxed whitespace-pre-wrap">{rapport}</div>
            {email && (
              <div className="mt-6 p-4 bg-[#1E1B4B] rounded-xl border border-[#6B21A8] text-center">
                <p className="text-[#D4A574] text-sm">📧 Votre rapport a été envoyé à {email}</p>
              </div>
            )}
            <div className="mt-6 p-4 bg-[#1E1B4B] rounded-xl border border-[#D4A574] text-center">
              <p className="text-[#D4A574] font-semibold mb-3">✨ Partagez votre profil avec vos proches</p>
              <div className="flex gap-3">
                <button
                  onClick={partagerWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all">
                  💬 Partager sur WhatsApp
                </button>
                <button
                  onClick={copierLien}
                  className="flex-1 bg-[#6B21A8] hover:bg-[#7C3AED] text-white font-bold py-3 rounded-xl transition-all">
                  {copie ? '✅ Copié !' : '🔗 Copier le lien'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SECTION UPSELL GUIDANCE VOCALE */}
      {showUpsell && !loading && (
        <div className="w-full max-w-2xl mt-8 animate-fadeIn">
          {/* Séparateur mystérieux */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4A574] to-transparent" />
            <span className="text-[#D4A574] text-lg">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4A574] to-transparent" />
          </div>

          {/* Carte upsell */}
          <div className="relative overflow-hidden rounded-2xl border border-[#D4A574]/40 shadow-2xl">
            {/* Fond animé étoiles */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0D0B2E] via-[#1a1245] to-[#0D0B2E]">
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 30%, #D4A574 1px, transparent 1px),
                    radial-gradient(circle at 80% 10%, #fff 1px, transparent 1px),
                    radial-gradient(circle at 50% 70%, #D4A574 1px, transparent 1px),
                    radial-gradient(circle at 10% 80%, #fff 1px, transparent 1px),
                    radial-gradient(circle at 90% 60%, #D4A574 1px, transparent 1px),
                    radial-gradient(circle at 35% 50%, #fff 1px, transparent 1px),
                    radial-gradient(circle at 65% 40%, #D4A574 1px, transparent 1px)`,
                  backgroundSize: '200px 200px'
                }}
              />
            </div>

            <div className="relative z-10 p-8 text-center">
              {/* Badge exclusivité */}
              <div className="inline-block bg-[#D4A574]/10 border border-[#D4A574]/50 rounded-full px-4 py-1 mb-5">
                <span className="text-[#D4A574] text-xs font-semibold tracking-widest uppercase">Message réservé</span>
              </div>

              {/* Orbe animé */}
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4A574]/30 to-[#6B21A8]/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-transparent animate-spin" style={{ animationDuration: '8s' }} />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                {prenom}, votre guidance révèle quelque chose de plus profond.
              </h2>

              <p className="text-[#D4A574]/90 text-lg mb-2 italic">
                "Ce que vous venez de lire n'est que le premier voile."
              </p>

              <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Un niveau de lecture que très peu reçoivent. Victoria a perçu un message spécifique pour vous —
                une guidance approfondie en texte et en voix, conçue uniquement pour ce moment de votre vie.
              </p>

              {/* Ce qu'ils reçoivent */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
                <p className="text-[#D4A574] font-semibold text-sm mb-3">Ce que vous recevez :</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4A574] mt-0.5">✦</span>
                    Rapport approfondi — 3x plus long, 12 révélations
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4A574] mt-0.5">✦</span>
                    Narration vocale par Victoria (~15 minutes)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4A574] mt-0.5">✦</span>
                    Le message caché que vos astres préparent pour vous
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4A574] mt-0.5">✦</span>
                    Envoyé par email — à réécouter quand vous voulez
                  </li>
                </ul>
              </div>

              {/* Prix */}
              <div className="mb-6">
                <p className="text-gray-500 text-sm line-through mb-1">Prix habituel : 39,99€</p>
                <p className="text-[#D4A574] text-4xl font-bold">19,99€</p>
                <p className="text-gray-400 text-xs mt-1">Accès immédiat · Paiement sécurisé</p>
              </div>

              {/* CTA */}
              <button
                onClick={accederGuidanceVocale}
                disabled={upsellLoading}
                className="w-full max-w-sm bg-gradient-to-r from-[#D4A574] to-[#c4895a] hover:from-[#e0b585] hover:to-[#d4985a] text-[#1E1B4B] font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-[#D4A574]/20 disabled:opacity-70 disabled:cursor-not-allowed">
                {upsellLoading ? '✨ Préparation...' : '🎙️ Recevoir ma guidance vocale'}
              </button>

              <p className="text-gray-600 text-xs mt-4">
                Disponible une seule fois à ce tarif · Divertissement
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-gray-500 text-sm mt-6">Divertissement</p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#1E1B4B] flex items-center justify-center">
        <p className="text-[#D4A574] text-xl animate-pulse">✨ Chargement...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
