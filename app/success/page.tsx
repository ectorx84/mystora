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
    const maxAttempts = 30; // 30 × 5s = 2min30 max
    
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
            // GA4 purchase conversion
            try {
              if (window.gtag) window.gtag('event', 'purchase', { transaction_id: depositId, method: 'pawapay' });
            } catch {}
            // Si email capturé côté client mais pas dans les metadata → envoyer maintenant
            if (pawapayEmail && !data.email) {
              fetch('/api/send-rapport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pawapayEmail, prenom: data.prenom, rapport: data.rapport, partageId: data.partageId }),
              }).catch(() => {});
              setEmail(pawapayEmail);
            }
          } else if (data.status === 'failed') {
            setError('Le paiement a échoué. Veuillez réessayer ou contacter contact@mystora.fr');
            setLoading(false);
          } else if (attempts >= maxAttempts) {
            setError('Votre paiement est en cours de traitement. Vous recevrez votre rapport par email dès confirmation. Si vous ne le recevez pas dans 10 minutes, contactez contact@mystora.fr');
            setLoading(false);
          } else {
            // pending ou processing — on réessaie dans 5s
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
        // GA4 purchase conversion
        try {
          if (window.gtag) window.gtag('event', 'purchase', { transaction_id: sessionId || depositId, method: depositId ? 'pawapay' : 'stripe' });
        } catch {}
      })
      .catch(() => {
        setError('Impossible de vérifier votre paiement. Si vous avez payé, contactez-nous à contact@mystora.fr');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (depositId) {
      // PawaPay — polling pour attendre la confirmation mobile money
      pollPawaPay();
      return;
    }
    if (sessionId) {
      // Stripe — fetch direct du rapport
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

  return (
    <main className="min-h-screen bg-[#080613] relative overflow-hidden flex flex-col items-center px-4 py-8">
      {/* Fond cosmique minimal */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-[#080613] to-[#080613] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✦</div>
          <h1 className="text-3xl font-bold text-white">Mystora</h1>
          {prenom && <p className="text-[#D4A574] text-lg mt-1">Votre message complet, {prenom}</p>}
        </div>

        {loading ? (
          /* ===== LOADING ENGAGEANT ===== */
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

            {/* Étapes progressives */}
            <div className="flex flex-col gap-3 mb-6">
              {LOADING_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${
                  i <= loadingStep ? 'opacity-100' : 'opacity-20'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 transition-all duration-500 ${
                    i < loadingStep
                      ? 'bg-green-600/30 border border-green-500/50'
                      : i === loadingStep
                        ? 'bg-purple-600/30 border border-purple-400/50 animate-pulse'
                        : 'bg-gray-800/30 border border-gray-700/30'
                  }`}>
                    {i < loadingStep ? '✓' : step.icon}
                  </div>
                  <span className={`text-sm ${
                    i <= loadingStep ? 'text-gray-200' : 'text-gray-600'
                  }`}>{step.text}</span>
                </div>
              ))}
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-gray-800/50 rounded-full h-2 mb-4">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-[#D4A574] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 95)}%` }}
              />
            </div>

            <p className="text-gray-400 text-xs text-center">
              ⏳ Votre rapport est en cours de rédaction — ne fermez pas cette page
            </p>

            {/* Capture email pour PawaPay — le client a déjà payé, il est motivé */}
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
                        // Sauvegarder l'email pour le callback
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
          /* ===== FALLBACK FORMULAIRE ===== */
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
            {/* ===== RAPPORT ===== */}
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
                <button
                  onClick={partagerWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all text-sm">
                  💬 WhatsApp
                </button>
                <button
                  onClick={copierLien}
                  className="flex-1 bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition-all text-sm">
                  {copie ? '✅ Copié !' : '🔗 Copier le lien'}
                </button>
              </div>
            </div>

            {/* Retour */}
            <a href="/" className="block text-center text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors">
              ← Nouveau message
            </a>
          </>
        )}

        <p className="text-gray-600 text-xs mt-6 text-center">Contenu de divertissement — mystora.fr · <a href="/mentions-legales" className="underline hover:text-gray-400">Mentions légales</a></p>
      </div>
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
