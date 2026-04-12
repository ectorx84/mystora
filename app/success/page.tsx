'use client';
import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const LOADING_STEPS = [
  { icon: '🔮', text: 'Connexion à votre profil astral...' },
  { icon: '✨', text: 'Analyse de votre signe et décan...' },
  { icon: '🌙', text: 'Calcul de votre chemin de vie...' },
  { icon: '🔢', text: 'Étude de vos nombres personnels...' },
  { icon: '💫', text: 'Lecture de vos cycles planétaires...' },
  { icon: '❤️', text: 'Analyse de vos compatibilités...' },
  { icon: '⭐', text: 'Rédaction de votre guidance personnelle...' },
  { icon: '🌟', text: 'Vérification des alignements...' },
  { icon: '📜', text: 'Finalisation de votre rapport complet...' },
];

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const depositId = searchParams.get('deposit_id') || '';
  const [rapport, setRapport] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copie, setCopie] = useState(false);
  const [partageId, setPartageId] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellLoading, setUpsellLoading] = useState(false);

  // Fallback : formulaire si metadata vides
  const [needsInfo, setNeedsInfo] = useState(false);
  const [fbPrenom, setFbPrenom] = useState('');
  const [fbJour, setFbJour] = useState('');
  const [fbMois, setFbMois] = useState('');
  const [fbAnnee, setFbAnnee] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [pawapayEmail, setPawapayEmail] = useState('');
  const [pawapayEmailSaved, setPawapayEmailSaved] = useState(false);
  const moisRef = useRef<HTMLInputElement>(null);
  const anneeRef = useRef<HTMLInputElement>(null);

  // Animation des étapes de chargement
  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(iv);
  }, [loading]);

  // ====== POLLING PAWAPAY ======
  const pollPawaPay = useCallback(() => {
    if (!depositId) return;
    setLoading(true);
    setError('');
    setLoadingStep(0);

    let attempts = 0;
    const maxAttempts = 30;

    const poll = () => {
      attempts++;
      fetch(`/api/pawapay-status?deposit_id=${depositId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'completed' && data.rapport) {
            setRapport(data.rapport);
            setPrenom(data.prenom || '');
            setEmail(data.email || '');
            setPartageId(data.partageId || '');
            setLoading(false);
            try {
              if (window.gtag) window.gtag('event', 'purchase', { transaction_id: depositId, method: 'pawapay' });
            } catch {}
            if (pawapayEmail && !data.email) {
              fetch('/api/send-rapport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pawapayEmail, prenom: data.prenom, rapport: data.rapport, partageId: data.partageId }),
              }).catch(() => {});
              setEmail(pawapayEmail);
            }
            setTimeout(() => setShowUpsell(true), 6000);
          } else if (data.status === 'failed') {
            setError('Le paiement a échoué. Veuillez réessayer ou contacter contact@mystora.fr');
            setLoading(false);
          } else if (attempts >= maxAttempts) {
            setError('Votre paiement est en cours de traitement. Vous recevrez votre rapport par email dès confirmation. Si vous ne le recevez pas dans 10 minutes, contactez contact@mystora.fr');
            setLoading(false);
          } else {
            setTimeout(poll, 5000);
          }
        })
        .catch(() => {
          if (attempts >= maxAttempts) {
            setError('Impossible de vérifier votre paiement. Contactez contact@mystora.fr');
            setLoading(false);
          } else {
            setTimeout(poll, 5000);
          }
        });
    };

    poll();
  }, [depositId]);

  // ====== FETCH STRIPE ======
  const fetchRapport = (extraData?: { prenom: string; dateNaissance: string }) => {
    setLoading(true);
    setError('');
    setNeedsInfo(false);
    setLoadingStep(0);

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
        try {
          if (window.gtag) window.gtag('event', 'purchase', { transaction_id: sessionId || depositId, method: depositId ? 'pawapay' : 'stripe' });
        } catch {}
        setTimeout(() => setShowUpsell(true), 6000);
      })
      .catch(() => {
        setError('Impossible de vérifier votre paiement. Si vous avez payé, contactez-nous à contact@mystora.fr');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (depositId) {
      pollPawaPay();
      return;
    }
    if (sessionId) {
      fetchRapport();
      return;
    }
    setError('Lien invalide. Veuillez passer par le processus de paiement.');
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, depositId]);

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

  const accederGuidanceVocale = async () => {
    setUpsellLoading(true);
    const dateNaissance = fbAnnee && fbMois && fbJour ? `${fbAnnee}-${fbMois}-${fbJour}` : '';
    const res = await fetch('/api/checkout-upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, dateNaissance, email, partageId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpsellLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#080613] relative overflow-hidden flex flex-col items-center px-4 py-8">
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-[#080613] to-[#080613] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✦</div>
          <h1 className="text-3xl font-bold text-white">Mystora</h1>
          {prenom && <p className="text-[#D4A574] text-lg mt-1">Votre message complet, {prenom}</p>}
        </div>

        {loading ? (
          <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/10">
            <div className="text-center mb-6">
              {depositId ? (
                <>
                  <p className="text-white text-lg font-semibold mb-1">📱 Confirmez le paiement sur votre téléphone</p>
                  <p className="text-[#D4A574] text-base">Validez la demande mobile money pour recevoir votre rapport</p>
                </>
              ) : (
                <>
                  <p className="text-white text-lg font-semibold mb-1">✅ Paiement confirmé</p>
                  <p className="text-[#D4A574] text-base">Votre rapport personnalisé est en cours de création</p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {LOADING_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= loadingStep ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 transition-all duration-500 ${
                    i < loadingStep ? 'bg-green-600/30 border border-green-500/50'
                    : i === loadingStep ? 'bg-purple-600/30 border border-purple-400/50 animate-pulse'
                    : 'bg-gray-800/30 border border-gray-700/30'
                  }`}>
                    {i < loadingStep ? '✓' : step.icon}
                  </div>
                  <span className={`text-sm ${i <= loadingStep ? 'text-gray-200' : 'text-gray-600'}`}>{step.text}</span>
                </div>
              ))}
            </div>

            <div className="w-full bg-gray-800/50 rounded-full h-2 mb-4">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-[#D4A574] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 95)}%` }}
              />
            </div>

            <p className="text-gray-400 text-xs text-center">⏳ Votre rapport est en cours de rédaction — ne fermez pas cette page</p>

            {depositId && !email && (
              <div className="mt-6 pt-5 border-t border-purple-500/10">
                <p className="text-gray-300 text-sm text-center mb-3">📧 Recevez aussi votre rapport par email</p>
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={pawapayEmail}
                    onChange={(e) => setPawapayEmail(e.target.value)}
                    className="flex-1 bg-[#0F0D2E] text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none border border-purple-700/40 focus:border-[#D4A574] transition-colors text-sm"
                  />
                  <button
                    onClick={() => {
                      if (pawapayEmail.includes('@')) {
                        setEmail(pawapayEmail);
                        setPawapayEmailSaved(true);
                        fetch('/api/track', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ event: 'pawapay_email_captured', data: { deposit_id: depositId, email: pawapayEmail } }),
                        }).catch(() => {});
                      }
                    }}
                    disabled={pawapayEmailSaved}
                    className="bg-[#D4A574] hover:bg-[#C4955A] text-[#080613] font-bold px-4 py-3 rounded-xl transition-all text-sm disabled:opacity-60"
                  >
                    {pawapayEmailSaved ? '✓' : 'OK'}
                  </button>
                </div>
                {pawapayEmailSaved && (
                  <p className="text-green-400 text-xs text-center mt-2">✅ Votre rapport sera envoyé à {pawapayEmail}</p>
                )}
              </div>
            )}
          </div>
        ) : needsInfo ? (
          <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/10">
            <div className="text-center mb-6">
              <p className="text-[#D4A574] text-lg font-semibold mb-2">✅ Paiement confirmé</p>
              <p className="text-gray-300 text-sm">Pour générer votre rapport personnalisé, veuillez confirmer vos informations :</p>
            </div>
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Votre prénom"
                value={fbPrenom}
                onChange={(e) => setFbPrenom(e.target.value)}
                className="bg-[#0F0D2E] text-white placeholder-gray-400 rounded-xl px-4 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] transition-colors text-lg"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm px-1">Date de naissance</label>
                <div className="flex gap-2">
                  <input type="tel" inputMode="numeric" placeholder="JJ" value={fbJour}
                    onChange={(e) => handleJour(e.target.value)}
                    className="bg-[#0F0D2E] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold transition-colors" />
                  <input ref={moisRef} type="tel" inputMode="numeric" placeholder="MM" value={fbMois}
                    onChange={(e) => handleMois(e.target.value)}
                    className="bg-[#0F0D2E] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold transition-colors" />
                  <input ref={anneeRef} type="tel" inputMode="numeric" placeholder="AAAA" value={fbAnnee}
                    onChange={(e) => setFbAnnee(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="bg-[#0F0D2E] text-white placeholder-gray-600 rounded-xl px-3 py-3.5 outline-none border border-purple-700/40 focus:border-[#D4A574] w-2/4 text-center text-lg font-semibold transition-colors" />
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
          <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/10 text-center">
            <p className="text-red-400 text-lg mb-4">⚠️ {error}</p>
            <a href="/" className="text-[#D4A574] underline">Retour à l&apos;accueil</a>
          </div>
        ) : (
          <>
            {/* RAPPORT */}
            <div className="bg-[#1A1747]/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-4">
              <div className="text-white leading-relaxed whitespace-pre-wrap text-[15px]">{rapport}</div>
            </div>

            {email && (
              <div className="bg-[#1A1747]/60 rounded-2xl p-3 border border-purple-500/10 text-center mb-4">
                <p className="text-[#D4A574] text-sm">📧 Votre rapport a été envoyé à {email}</p>
              </div>
            )}

            {/* Partage */}
            <div className="bg-[#1A1747]/60 rounded-2xl p-4 border border-[#D4A574]/30 text-center mb-4">
              <p className="text-[#D4A574] font-semibold mb-3">✨ Partagez votre profil avec vos proches</p>
              <div className="flex gap-3">
                <button onClick={partagerWhatsApp} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all text-sm">
                  💬 WhatsApp
                </button>
                <button onClick={copierLien} className="flex-1 bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition-all text-sm">
                  {copie ? '✅ Copié !' : '🔗 Copier le lien'}
                </button>
              </div>
            </div>

            {/* UPSELL GUIDANCE VOCALE */}
            {showUpsell && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4A574]/40 to-transparent" />
                  <span className="text-[#D4A574]">✦</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4A574]/40 to-transparent" />
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-[#D4A574]/30 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0D0B2E] via-[#1a1245] to-[#0D0B2E]">
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: `radial-gradient(circle at 20% 30%, #D4A574 1px, transparent 1px),
                        radial-gradient(circle at 80% 10%, #fff 1px, transparent 1px),
                        radial-gradient(circle at 50% 70%, #D4A574 1px, transparent 1px),
                        radial-gradient(circle at 10% 80%, #fff 1px, transparent 1px),
                        radial-gradient(circle at 90% 60%, #D4A574 1px, transparent 1px),
                        radial-gradient(circle at 65% 40%, #D4A574 1px, transparent 1px)`,
                      backgroundSize: '200px 200px'
                    }} />
                  </div>

                  <div className="relative z-10 p-7 text-center">
                    <div className="inline-block bg-[#D4A574]/10 border border-[#D4A574]/40 rounded-full px-4 py-1 mb-4">
                      <span className="text-[#D4A574] text-xs font-semibold tracking-widest uppercase">Message réservé</span>
                    </div>

                    <div className="relative mx-auto mb-5 w-20 h-20">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4A574]/30 to-purple-900/30 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">
                      {prenom}, votre guidance révèle quelque chose de plus profond.
                    </h2>
                    <p className="text-[#D4A574]/90 text-base mb-2 italic">
                      &ldquo;Ce que vous venez de lire n&apos;est que le premier voile.&rdquo;
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-sm mx-auto">
                      Victoria a perçu un message spécifique pour vous — une guidance approfondie en texte et en voix, conçue uniquement pour ce moment de votre vie.
                    </p>

                    <div className="bg-white/5 rounded-xl p-4 mb-5 text-left max-w-xs mx-auto">
                      <p className="text-[#D4A574] font-semibold text-sm mb-2">Ce que vous recevez :</p>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-[#D4A574] mt-0.5">✦</span>Rapport approfondi — 12 révélations</li>
                        <li className="flex items-start gap-2"><span className="text-[#D4A574] mt-0.5">✦</span>Narration vocale par Victoria (~15 min)</li>
                        <li className="flex items-start gap-2"><span className="text-[#D4A574] mt-0.5">✦</span>Le message caché de vos astres</li>
                        <li className="flex items-start gap-2"><span className="text-[#D4A574] mt-0.5">✦</span>Envoyé par email · à réécouter quand vous voulez</li>
                      </ul>
                    </div>

                    <div className="mb-5">
                      <p className="text-gray-500 text-sm line-through mb-1">Prix habituel : 19,99€</p>
                      <p className="text-[#D4A574] text-4xl font-bold">9,99€</p>
                      <p className="text-gray-400 text-xs mt-1">Accès immédiat · Paiement sécurisé</p>
                    </div>

                    <button
                      onClick={accederGuidanceVocale}
                      disabled={upsellLoading}
                      className="w-full max-w-xs bg-gradient-to-r from-[#D4A574] to-[#c4895a] hover:from-[#e0b585] hover:to-[#d4985a] text-[#080613] font-bold text-base py-4 rounded-xl transition-all shadow-lg shadow-[#D4A574]/20 disabled:opacity-70">
                      {upsellLoading ? '✨ Préparation...' : '🎙️ Recevoir ma guidance vocale'}
                    </button>

                    <p className="text-gray-600 text-xs mt-3">Disponible une seule fois à ce tarif · Divertissement</p>
                  </div>
                </div>
              </div>
            )}

            <a href="/" className="block text-center text-gray-500 text-sm py-4 hover:text-gray-300 transition-colors mt-2">
              ← Nouveau message
            </a>
          </>
        )}

        <p className="text-gray-600 text-xs mt-6 text-center">Contenu de divertissement — mystora.fr · <a href="/mentions-legales" className="underline hover:text-gray-400">Mentions légales</a></p>
      </div>

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
      <main className="min-h-screen bg-[#080613] flex items-center justify-center">
        <p className="text-[#D4A574] text-xl animate-pulse">✨ Chargement...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
