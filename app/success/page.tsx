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

      <p className="text-gray-500 text-sm mt-6">Divertissement</p>
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