'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const [rapport, setRapport] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copie, setCopie] = useState(false);
  const [partageId, setPartageId] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('Lien invalide. Veuillez passer par le processus de paiement.');
      setLoading(false);
      return;
    }

    fetch('/api/rapport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Paiement non vérifié');
        return res.json();
      })
      .then((data) => {
        setRapport(data.resultat);
        setPrenom(data.prenom || '');
        setEmail(data.email || '');
        setPartageId(data.partageId);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de vérifier votre paiement. Si vous avez payé, contactez-nous à contact@mystora.fr');
        setLoading(false);
      });
  }, [sessionId]);

  const partagerWhatsApp = () => {
    const lien = `${window.location.origin}/partage/${partageId}`;
    const message = `Je viens de découvrir mon profil astrologique complet sur Mystora 🔮 Regarde ce que les astres disent de moi... et découvre le tien : ${lien}`;
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
        {prenom && <p className="text-[#D4A574] text-lg">Votre rapport complet, {prenom}</p>}
      </div>

      <div className="bg-[#2D2A6E] rounded-2xl p-8 w-full max-w-2xl shadow-xl">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#D4A574] text-xl animate-pulse">✨ Les astres révèlent votre destinée...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-4">⚠️ {error}</p>
            <a href="/" className="text-[#D4A574] underline">Retour à l&apos;accueil</a>
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

      <p className="text-gray-500 text-sm mt-6">Divertissement · <a href="/mentions-legales" className="underline hover:text-gray-400">Mentions légales</a></p>
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
