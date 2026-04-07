'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
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
  
  // Fallback : formulaire si metadata vides
  const [needsInfo, setNeedsInfo] = useState(false);
  const [fbPrenom, setFbPrenom] = useState('');
  const [fbJour, setFbJour] = useState('');
  const [fbMois, setFbMois] = useState('');
  const [fbAnnee, setFbAnnee] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const moisRef = useRef<HTMLInputElement>(null);
  const anneeRef = useRef<HTMLInputElement>(null);

  const fetchRapport = (extraData?: { prenom: string; dateNaissance: string }) => {
    setLoading(true);
    setError('');
    setNeedsInfo(false);
    
    const body: Record<string, string> = { sessionId };
    if (extraData) {
      body.prenom = extraData.prenom;
      body.dateNaissance = extraData.dateNaissance;
    }

    fetch('/api/rapport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (data.needsInfo) {
            setNeedsInfo(true);
            setLoading(false);
            return;
          }
          throw new Error(data.error || 'Paiement non vérifié');
        }
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
  };

  useEffect(() => {
    if (!sessionId) {
      setError('Lien invalide. Veuillez passer par le processus de paiement.');
      setLoading(false);
      return;
    }
    fetchRapport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleFallbackSubmit = () => {
    if (!fbPrenom || fbJour.length !== 2 || fbMois.length !== 2 || fbAnnee.length !== 4) return;
    setFbLoading(true);
    const dateNaissance = `${fbAnnee}-${fbMois}-${fbJour}`;
    fetchRapport({ prenom: fbPrenom, dateNaissance });
    setFbLoading(false);
  };

  const handleJour = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setFbJour(clean);
    if (clean.length === 2) moisRef.current?.focus();
  };
  const handleMois = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setFbMois(clean);
    if (clean.length === 2) anneeRef.current?.focus();
  };

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
        ) : needsInfo ? (
          <div className="py-6">
            <div className="text-center mb-6">
              <p className="text-[#D4A574] text-lg font-semibold mb-2">✨ Votre paiement est confirmé</p>
              <p className="text-gray-300 text-sm">Pour générer votre rapport personnalisé, veuillez confirmer vos informations :</p>
            </div>
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Votre prénom"
                value={fbPrenom}
                onChange={(e) => setFbPrenom(e.target.value)}
                className="bg-[#1E1B4B] text-white placeholder-gray-400 rounded-xl px-4 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] transition-colors text-lg"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm px-1">Date de naissance</label>
                <div className="flex gap-2">
                  <input type="tel" inputMode="numeric" placeholder="JJ" value={fbJour}
                    onChange={(e) => handleJour(e.target.value)}
                    className="bg-[#1E1B4B] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold transition-colors" />
                  <input ref={moisRef} type="tel" inputMode="numeric" placeholder="MM" value={fbMois}
                    onChange={(e) => handleMois(e.target.value)}
                    className="bg-[#1E1B4B] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold transition-colors" />
                  <input ref={anneeRef} type="tel" inputMode="numeric" placeholder="AAAA" value={fbAnnee}
                    onChange={(e) => setFbAnnee(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="bg-[#1E1B4B] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-2/4 text-center text-lg font-semibold transition-colors" />
                </div>
              </div>
              <button onClick={handleFallbackSubmit}
                disabled={!fbPrenom || fbJour.length !== 2 || fbMois.length !== 2 || fbAnnee.length !== 4 || fbLoading}
                className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 text-lg">
                {fbLoading ? '⏳ Génération...' : '✨ Générer mon rapport'}
              </button>
            </div>
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
