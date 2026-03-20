'use client';
import { useState, useRef, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Connexion aux astres...",
  "Lecture de ton thème astral...",
  "Analyse de tes énergies...",
  "Calcul de tes vibrations...",
  "Un message se révèle..."
];

export default function Home() {
  const [prenom, setPrenom] = useState('');
  const [jour, setJour] = useState('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [resultat, setResultat] = useState('');
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [payLoading, setPayLoading] = useState(false);

  const moisRef = useRef<HTMLInputElement>(null);
  const anneeRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const dateNaissance = annee.length === 4 && mois.length === 2 && jour.length === 2
    ? `${annee}-${mois}-${jour}` : '';

  const handleJour = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setJour(clean);
    if (clean.length === 2) moisRef.current?.focus();
  };
  const handleMois = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setMois(clean);
    if (clean.length === 2) anneeRef.current?.focus();
  };
  const handleAnnee = (val: string) => {
    setAnnee(val.replace(/\D/g, '').slice(0, 4));
  };

  // Loading animation
  useEffect(() => {
    if (step !== 'loading') return;
    const iv = setInterval(() => setLoadingIdx(i => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(iv);
  }, [step]);

  // Scroll to result
  useEffect(() => {
    if (step === 'result' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!prenom || !dateNaissance) return;
    setStep('loading');
    setLoadingIdx(0);
    setResultat('');
    try {
      const res = await fetch('/api/astro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, dateNaissance }),
      });
      const data = await res.json();
      setResultat(data.resultat);
      setStep('result');
    } catch {
      setStep('form');
    }
  };

  const handlePaiement = async () => {
    setPayLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, dateNaissance, email: '' }),
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setPayLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0D2E] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8 min-h-screen justify-center">

        {/* ===== FORM ===== */}
        {step === 'form' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-white tracking-tight">🔮 Mystora</h1>
              <p className="text-[#D4A574] text-base mt-1">Les réponses que tu cherches sont ici...</p>
              <p className="text-gray-500 text-sm mt-0.5">Gratuit et immédiat</p>
            </div>

            <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-7 w-full max-w-md shadow-2xl border border-purple-500/10">
              <h2 className="text-white text-xl font-semibold text-center mb-6">Découvre ton message</h2>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="bg-[#0F0D2E] text-white placeholder-gray-400 rounded-xl px-4 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] transition-colors text-lg"
                  autoComplete="given-name"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-sm px-1">Date de naissance</label>
                  <div className="flex gap-2">
                    <input type="tel" inputMode="numeric" placeholder="JJ" value={jour}
                      onChange={(e) => handleJour(e.target.value)}
                      className="bg-[#0F0D2E] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold transition-colors" />
                    <input ref={moisRef} type="tel" inputMode="numeric" placeholder="MM" value={mois}
                      onChange={(e) => handleMois(e.target.value)}
                      className="bg-[#0F0D2E] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold transition-colors" />
                    <input ref={anneeRef} type="tel" inputMode="numeric" placeholder="AAAA" value={annee}
                      onChange={(e) => handleAnnee(e.target.value)}
                      className="bg-[#0F0D2E] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-2/4 text-center text-lg font-semibold transition-colors" />
                  </div>
                </div>
                <button onClick={handleSubmit}
                  disabled={!prenom || !dateNaissance}
                  className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 mt-2 disabled:opacity-50 text-lg shadow-lg shadow-purple-900/30">
                  ✨ Recevoir mon message
                </button>
                <p className="text-gray-500 text-xs text-center">Sans carte bancaire • Résultat immédiat</p>
              </div>
            </div>
          </>
        )}

        {/* ===== LOADING ===== */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-amber-400 opacity-20 animate-ping absolute inset-0" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 opacity-40 animate-pulse relative flex items-center justify-center">
                <span className="text-4xl">🔮</span>
              </div>
            </div>
            <p className="text-purple-200 text-lg font-medium animate-pulse">{LOADING_MESSAGES[loadingIdx]}</p>
            <p className="text-gray-500 text-sm mt-2">{prenom}, les astres s&apos;alignent pour toi...</p>
            <div className="flex gap-2 mt-6">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= loadingIdx ? 'bg-amber-400' : 'bg-gray-700'}`} />
              ))}
            </div>
          </div>
        )}

        {/* ===== RESULT ===== */}
        {step === 'result' && (
          <div ref={resultRef} className="w-full max-w-md">
            <div className="text-center mb-5">
              <h1 className="text-3xl font-bold text-white">🔮 Mystora</h1>
            </div>

            {/* Teaser visible */}
            <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <h2 className="text-white text-lg font-semibold">{prenom}, voici ce que les astres révèlent</h2>
              </div>
              <p className="text-gray-200 text-[15px] leading-relaxed">{resultat}</p>

              {/* Blurred content - paywall */}
              <div className="relative mt-4">
                <div className="text-gray-300 text-[15px] leading-relaxed blur-[6px] select-none pointer-events-none" aria-hidden="true">
                  <p className="mb-2">Ton thème astral révèle une période de transformation profonde qui va impacter tes relations et ta carrière de manière inattendue. Les alignements planétaires de ce mois indiquent un tournant majeur dans ton chemin de vie.</p>
                  <p className="mb-2">Côté amour, une rencontre ou une prise de conscience va bouleverser ta vision des choses. Côté carrière, une opportunité cachée se prépare mais tu dois savoir exactement quand agir.</p>
                  <p>Ta numérologie personnelle confirme ce cycle de renouveau et révèle les dates clés de ton mois à venir...</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1A1747]/50 to-[#1A1747] flex items-end justify-center pb-2">
                  <p className="text-amber-200/80 text-sm">La suite de ton profil est prête...</p>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-purple-900/60 to-[#1A1747]/80 rounded-3xl p-6 border border-amber-400/20">
              <h3 className="text-white text-center font-semibold text-lg mb-1">🔮 Ton rapport complet est prêt</h3>
              <p className="text-gray-300 text-sm text-center mb-4">
                Profil astral détaillé • Amour • Carrière • Blocages • Chemin de vie • Prévisions du mois
              </p>
              <button onClick={handlePaiement} disabled={payLoading}
                className="block w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl text-center text-lg transition-all duration-300 shadow-lg shadow-amber-900/30 disabled:opacity-50">
                {payLoading ? '⏳ Redirection...' : 'Débloquer mon rapport — 4,90€'}
              </button>
              <div className="flex items-center justify-center gap-4 mt-3 text-gray-400 text-xs">
                <span>🔒 Paiement sécurisé</span>
                <span>⚡ Résultat instantané</span>
              </div>
            </div>

            <button onClick={() => { setStep('form'); setResultat(''); }}
              className="w-full text-gray-500 text-sm mt-4 py-2 hover:text-gray-300 transition-colors text-center">
              ← Nouvelle consultation
            </button>
          </div>
        )}

        <p className="text-gray-600 text-xs mt-8">Contenu de divertissement — mystora.fr</p>
      </div>
    </main>
  );
}