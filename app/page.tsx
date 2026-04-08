'use client';
import { useState, useRef, useEffect } from 'react';
import { track } from '@vercel/analytics';

// ===== TRACKING =====
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackEvent(event: string, data?: Record<string, string | number | boolean>) {
  // GA4 — visible dans Google Analytics > Temps réel + Événements
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, data || {});
    }
  } catch {}
  // Vercel Analytics (Pro plan only)
  try {
    track(event, data || {});
  } catch {}
  // Backup serveur — visible dans Vercel Function Logs
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, data: data || {} }),
  }).catch(() => {});
}

const LOADING_MESSAGES = [
  "Connexion aux astres...",
  "Lecture de votre thème astral...",
  "Analyse de vos énergies...",
  "Calcul de vos vibrations...",
  "Un message se révèle..."
];

export default function Home() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [jour, setJour] = useState('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [intention, setIntention] = useState('');
  const [resultat, setResultat] = useState('');
  const [signeInfo, setSigneInfo] = useState('');
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [displayPrice, setDisplayPrice] = useState('4,90€');
  const [anchorPrice, setAnchorPrice] = useState('14,90€');

  useEffect(() => {
    fetch('/api/geo').then(r => r.json()).then(d => {
      if (d.price) setDisplayPrice(d.price);
      if (d.isAfrica) setAnchorPrice('5,90€');
    }).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const prenomParam = params.get('prenom');
    if (prenomParam) setPrenom(prenomParam);
    // Track landing
    trackEvent('landing_view', { source: prenomParam ? 'manychat_or_brevo' : 'direct' });
  }, []);

  useEffect(() => {
    const lastTest = localStorage.getItem('mystora_last_test');
    if (lastTest) {
      const elapsed = Date.now() - parseInt(lastTest);
      const limit = 24 * 60 * 60 * 1000;
      if (elapsed < limit) {
        setBlocked(true);
        const remaining = limit - elapsed;
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        setTimeLeft(`${h}h${m.toString().padStart(2, '0')}`);
        const savedResult = localStorage.getItem('mystora_last_result');
        const savedPrenom = localStorage.getItem('mystora_last_prenom');
        const savedDate = localStorage.getItem('mystora_last_date');
        const savedSigne = localStorage.getItem('mystora_last_signe');
        if (savedResult && savedPrenom) {
          setResultat(savedResult);
          setPrenom(savedPrenom);
          if (savedSigne) setSigneInfo(savedSigne);
          if (savedDate) {
            const parts = savedDate.split('-');
            if (parts.length === 3) {
              setAnnee(parts[0]);
              setMois(parts[1]);
              setJour(parts[2]);
            }
          }
          setStep('result');
        }
      } else {
        localStorage.removeItem('mystora_last_result');
        localStorage.removeItem('mystora_last_prenom');
        localStorage.removeItem('mystora_last_date');
        localStorage.removeItem('mystora_last_signe');
      }
    }
  }, []);

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

  useEffect(() => {
    if (step !== 'loading') return;
    const iv = setInterval(() => setLoadingIdx(i => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (step === 'result' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!prenom || !dateNaissance || blocked) return;
    trackEvent('form_submit', { prenom_length: prenom.length, intention: intention || 'none' });
    setStep('loading');
    setLoadingIdx(0);
    setResultat('');
    try {
      const res = await fetch('/api/astro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, dateNaissance, intention }),
      });
      const data = await res.json();
      setResultat(data.resultat);
      setSigneInfo(data.signe || '');
      setStep('result');
      trackEvent('teaser_view', { signe: data.signe || 'unknown' });
      localStorage.setItem('mystora_last_test', Date.now().toString());
      localStorage.setItem('mystora_last_result', data.resultat);
      localStorage.setItem('mystora_last_prenom', prenom);
      localStorage.setItem('mystora_last_date', dateNaissance);
      localStorage.setItem('mystora_last_signe', data.signe || '');
      setBlocked(true);
    } catch {
      setStep('form');
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    trackEvent('email_submit');
    setEmailSent(true);
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), prenom }),
      });
    } catch {}
  };

  const handlePaiement = async () => {
    trackEvent('cta_click', { price: displayPrice });
    setPayLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, dateNaissance, email: email.trim(), question: intention }),
      });
      const data = await res.json();
      trackEvent('checkout_start');
      window.location.href = data.url;
    } catch {
      setPayLoading(false);
    }
  };

  

  return (
    <main className="min-h-screen bg-[#080613] relative overflow-hidden">
      {/* Nébuleuses animées */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />

      {/* Étoiles scintillantes */}
      <div className="stars-layer">
        {[
          { top: '5%', left: '10%', size: 6, dur: '3s', delay: '0s', white: false },
          { top: '12%', left: '80%', size: 5, dur: '4s', delay: '1s', white: true },
          { top: '20%', left: '25%', size: 7, dur: '3.5s', delay: '0.5s', white: false },
          { top: '8%', left: '55%', size: 5, dur: '5s', delay: '2s', white: true },
          { top: '30%', left: '70%', size: 8, dur: '4s', delay: '0.8s', white: false },
          { top: '35%', left: '15%', size: 4, dur: '3s', delay: '1.5s', white: true },
          { top: '45%', left: '90%', size: 6, dur: '4.5s', delay: '0.3s', white: false },
          { top: '50%', left: '40%', size: 7, dur: '3s', delay: '2.5s', white: true },
          { top: '55%', left: '5%', size: 8, dur: '5s', delay: '1.2s', white: false },
          { top: '60%', left: '60%', size: 5, dur: '3.5s', delay: '0.7s', white: true },
          { top: '65%', left: '85%', size: 6, dur: '4s', delay: '1.8s', white: false },
          { top: '70%', left: '30%', size: 7, dur: '3s', delay: '0.2s', white: true },
          { top: '75%', left: '50%', size: 8, dur: '4.5s', delay: '1s', white: false },
          { top: '80%', left: '75%', size: 5, dur: '3.5s', delay: '2.2s', white: true },
          { top: '85%', left: '20%', size: 4, dur: '5s', delay: '0.6s', white: false },
          { top: '90%', left: '95%', size: 7, dur: '3s', delay: '1.4s', white: true },
          { top: '15%', left: '45%', size: 6, dur: '4s', delay: '0.9s', white: false },
          { top: '40%', left: '35%', size: 4, dur: '3.5s', delay: '2.8s', white: true },
          { top: '25%', left: '92%', size: 8, dur: '5s', delay: '0.4s', white: false },
          { top: '95%', left: '55%', size: 6, dur: '4.5s', delay: '1.6s', white: true },
          { top: '3%', left: '38%', size: 5, dur: '3s', delay: '3s', white: false },
          { top: '48%', left: '18%', size: 7, dur: '4s', delay: '0.1s', white: true },
          { top: '72%', left: '8%', size: 5, dur: '3.5s', delay: '2.3s', white: false },
          { top: '58%', left: '78%', size: 8, dur: '5s', delay: '1.1s', white: true },
          { top: '88%', left: '42%', size: 6, dur: '4s', delay: '0.5s', white: false },
        ].map((s, i) => (
          <div key={`star-${i}`}
            className={`star ${s.white ? 'star-white' : ''}`}
            style={{
              top: s.top, left: s.left,
              width: `${s.size}px`, height: `${s.size}px`,
              '--dur': s.dur, '--delay': s.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Particules dorées flottantes */}
      <div className="stars-layer">
        {[
          { top: '20%', left: '15%', size: 10, dur: '8s', delay: '0s' },
          { top: '40%', left: '75%', size: 8, dur: '10s', delay: '2s' },
          { top: '60%', left: '45%', size: 12, dur: '12s', delay: '4s' },
          { top: '80%', left: '25%', size: 8, dur: '9s', delay: '1s' },
          { top: '30%', left: '85%', size: 10, dur: '11s', delay: '3s' },
          { top: '70%', left: '55%', size: 7, dur: '7s', delay: '5s' },
          { top: '10%', left: '65%', size: 9, dur: '10s', delay: '6s' },
          { top: '50%', left: '10%', size: 10, dur: '9s', delay: '2.5s' },
        ].map((p, i) => (
          <div key={`particle-${i}`}
            className="particle"
            style={{
              top: p.top, left: p.left,
              width: `${p.size}px`, height: `${p.size}px`,
              '--dur': p.dur, '--delay': p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8 min-h-screen justify-center">

        {/* ===== FORM ===== */}
        {step === 'form' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">✦</div>
              <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">Un message<br/>vous attend</h1>
              <p className="text-shimmer text-base mt-3 font-medium">Découvrez-le en 30 secondes</p>
            </div>

            <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-7 w-full max-w-sm shadow-2xl border border-purple-500/10">
              <h2 className="text-white text-xl font-semibold text-center mb-1">Votre profil gratuit</h2>
              <p className="text-gray-400 text-sm text-center mb-5">Entrez votre prénom et date de naissance</p>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Votre prénom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="bg-[#0F0D2E] text-white placeholder-gray-400 rounded-xl px-4 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] transition-colors text-lg"
                  autoComplete="given-name"
                  autoFocus
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
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-sm px-1">Qu&apos;aimeriez-vous éclaircir ?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'amour', icon: '❤️', label: 'Amour' },
                      { value: 'carriere', icon: '💼', label: 'Carrière' },
                      { value: 'argent', icon: '💰', label: 'Argent' },
                      { value: 'blocage', icon: '🔓', label: 'Blocage' },
                    ].map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setIntention(intention === opt.value ? '' : opt.value)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          intention === opt.value
                            ? 'bg-purple-700/40 border-[#D4A574] text-white'
                            : 'bg-[#0F0D2E] border-purple-700/40 text-gray-400 hover:border-purple-500/60'
                        }`}>
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs px-1 mt-0.5">Optionnel — personnalise votre lecture</p>
                </div>
                <button onClick={handleSubmit}
                  disabled={!prenom || !dateNaissance || blocked}
                  className="btn-glow bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all duration-300 mt-1 disabled:opacity-60 text-lg shadow-lg shadow-purple-900/30">
                  {blocked ? '🔒 Test gratuit utilisé' : '✨ Révéler mon message'}
                </button>
              </div>
            </div>

            {/* CTA payant quand test déjà utilisé */}
            {blocked && (
              <div className="bg-gradient-to-br from-purple-900/60 to-[#1A1747]/80 rounded-3xl p-6 border border-amber-400/20 mt-4 w-full max-w-sm">
                <h3 className="text-white text-center font-semibold text-lg mb-1">✨ Votre message complet est prêt</h3>
                <p className="text-gray-300 text-sm text-center mb-4">
                  Qui vous êtes vraiment • Amour • Carrière • Blocages • Ce qui vous attend • Guidance
                </p>
                <div className="text-center mb-3">
                  <span className="text-gray-400 line-through text-sm">{anchorPrice}</span>
                  <span className="text-amber-400 font-bold text-xl ml-2">{displayPrice}</span>
                  <span className="text-amber-300/70 text-xs ml-2">offre de lancement</span>
                </div>
                <button onClick={handlePaiement} disabled={payLoading || !prenom || !dateNaissance}
                  className="block w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl text-center text-lg transition-all duration-300 shadow-lg shadow-amber-900/30 disabled:opacity-50">
                  {payLoading ? '⏳ Redirection...' : `Lire mon message complet — ${displayPrice}`}
                </button>
                {(!prenom || !dateNaissance) && (
                  <p className="text-gray-400 text-xs text-center mt-2">Entrez votre prénom et votre date ci-dessus</p>
                )}
                <div className="flex items-center justify-center gap-4 mt-3 text-gray-400 text-xs">
                  <span>🔒 Paiement sécurisé</span>
                  <span>⚡ Résultat instantané</span>
                </div>
              </div>
            )}

            {/* Mini preuve sociale sous le formulaire */}
            <div className="mt-6 flex items-center gap-2 text-gray-400 text-sm">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs text-white border-2 border-[#0F0D2E]">S</div>
                <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-xs text-white border-2 border-[#0F0D2E]">K</div>
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white border-2 border-[#0F0D2E]">F</div>
              </div>
              <span>+2 400 profils générés ce mois</span>
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
            <p className="text-gray-500 text-sm mt-2">{prenom}, les astres s&apos;alignent pour vous...</p>
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
              <h1 className="text-3xl font-bold text-white">✦ Mystora</h1>
            </div>

            {/* Résultat gratuit */}
            <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <h2 className="text-white text-lg font-semibold">{prenom}, voici votre message</h2>
              </div>
              <div className="text-gray-200 text-[15px] leading-relaxed whitespace-pre-line">{resultat}</div>

              {/* Révélation partielle visible — hook de curiosité */}
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <p className="text-amber-200 text-[15px] leading-relaxed">
                  ✦ {prenom}, votre message complet révèle {intention === 'amour' ? 'une vérité sur votre vie sentimentale que vous ressentez sans oser la formuler' : intention === 'carriere' ? 'ce qui bloque réellement votre évolution professionnelle depuis des mois' : intention === 'argent' ? 'la raison profonde pour laquelle l\'argent vous échappe en ce moment' : intention === 'blocage' ? 'l\'origine exacte du blocage qui vous empêche d\'avancer' : 'un tournant que vous n\'avez pas encore vu venir'}.{' '}
                  <span className="text-amber-200/60">Il contient aussi une date précise à surveiller et...</span>
                </p>
              </div>

              {/* Blurred content — personnalisé */}
              <div className="relative mt-3">
                <div className="text-gray-300 text-[15px] leading-relaxed blur-[6px] select-none pointer-events-none" aria-hidden="true">
                  <p className="mb-2">{prenom}, {signeInfo ? `en tant que ${signeInfo}, ` : ''}votre profil révèle que la période actuelle est un tournant décisif. Ce que vous ressentez en ce moment — cette tension entre ce que vous voulez et ce que vous vivez — a une explication précise dans votre thème.</p>
                  <p className="mb-2">{intention === 'amour' ? 'Votre vie amoureuse est sur le point de basculer. La personne à laquelle vous pensez' : intention === 'carriere' ? 'Professionnellement, un changement majeur se prépare. L\'opportunité que vous attendez' : intention === 'argent' ? 'Financièrement, un déblocage est imminent. Le schéma qui vous retient' : intention === 'blocage' ? 'Le blocage que vous ressentez a une origine que vous n\'avez jamais envisagée' : 'Une rencontre ou un événement va tout changer dans les prochaines semaines'}. Les dates clés à surveiller sont le...</p>
                  <p>Votre guidance personnelle indique trois actions concrètes à poser dès maintenant pour...</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1A1747]/50 to-[#1A1747]" />
              </div>
            </div>

            {/* CTA Card — simplifié, direct */}
            <div className="bg-gradient-to-br from-purple-900/60 to-[#1A1747]/80 rounded-3xl p-6 border border-amber-400/20 mb-4">
              <p className="text-gray-300 text-center text-[15px] mb-4">
                Votre message fait <span className="text-white font-semibold">8 sections</span> et contient vos <span className="text-white font-semibold">dates clés</span>, vos <span className="text-white font-semibold">blocages cachés</span> et votre <span className="text-white font-semibold">guidance personnelle</span>.
              </p>

              <div className="text-center mb-3">
                <span className="text-gray-400 line-through text-sm">{anchorPrice}</span>
                <span className="text-amber-400 font-bold text-xl ml-2">{displayPrice}</span>
                <span className="text-amber-300/70 text-xs ml-2">offre de lancement</span>
              </div>

              <button onClick={handlePaiement} disabled={payLoading}
                className="block w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl text-center text-lg transition-all duration-300 shadow-lg shadow-amber-900/30 disabled:opacity-50">
                {payLoading ? '⏳ Redirection...' : `Lire mon message complet — ${displayPrice}`}
              </button>
              <div className="flex items-center justify-center gap-4 mt-3 text-gray-400 text-xs">
                <span>🔒 Paiement sécurisé</span>
                <span>⚡ Résultat instantané</span>
                <span>📧 Envoi par email</span>
              </div>
            </div>

            {/* Email capture — filet de rattrapage */}
            {!emailSent ? (
              <div className="bg-[#1A1747]/60 rounded-2xl p-4 border border-purple-500/10">
                <p className="text-gray-400 text-sm text-center mb-3">Pas encore prêt(e) ? Recevez votre message par email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-[#0F0D2E] text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none border border-purple-700/40 focus:border-[#D4A574] transition-colors text-sm"
                    autoComplete="email"
                  />
                  <button onClick={handleEmailSubmit}
                    disabled={!email.trim()}
                    className="bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm disabled:opacity-50">
                    OK
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1747]/60 rounded-2xl p-3 border border-purple-500/10 text-center">
                <p className="text-[#D4A574] text-sm">✅ C&apos;est noté ! Vous recevrez votre lecture à {email}</p>
              </div>
            )}

            {/* Avis clients */}
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-gray-400 text-xs text-center">Ce qu&apos;ils en disent</p>
              <div className="bg-[#1A1747]/60 rounded-2xl p-4 border border-purple-500/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-amber-400 text-sm">★★★★★</span>
                  <span className="text-white text-sm font-medium">Sarah M.</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">&quot;J&apos;ai eu des frissons en lisant mon message. Il décrit exactement ce que je traverse en ce moment. C&apos;était tellement précis que j&apos;en suis restée bouche bée.&quot;</p>
              </div>
              <div className="bg-[#1A1747]/60 rounded-2xl p-4 border border-purple-500/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-amber-400 text-sm">★★★★★</span>
                  <span className="text-white text-sm font-medium">Karim L.</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">&quot;Au début je pensais que c&apos;était du blabla mais quand j&apos;ai lu la partie sur ma carrière... tout colle. J&apos;ai même partagé avec ma copine.&quot;</p>
              </div>
              <div className="bg-[#1A1747]/60 rounded-2xl p-4 border border-purple-500/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-amber-400 text-sm">★★★★★</span>
                  <span className="text-white text-sm font-medium">Fatou D.</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">&quot;{displayPrice} pour un message aussi personnel c&apos;est donné. On m&apos;a déjà fait payer 50€ pour quelque chose de moins précis. Je recommande à 100%.&quot;</p>
              </div>
            </div>

            <button onClick={() => { setStep('form'); setResultat(''); }}
              className="w-full text-gray-500 text-sm mt-4 py-2 hover:text-gray-300 transition-colors text-center">
              ← Nouveau message
            </button>
          </div>
        )}

        <p className="text-gray-600 text-xs mt-8">Contenu de divertissement — mystora.fr · <a href="/mentions-legales" className="underline hover:text-gray-400">Mentions légales</a></p>
      </div>
    </main>
  );
}
