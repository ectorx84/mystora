'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [prenom, setPrenom] = useState('');
  const [jour, setJour] = useState('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [email, setEmail] = useState('');
  const [resultat, setResultat] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const moisRef = useRef<HTMLInputElement>(null);
  const anneeRef = useRef<HTMLInputElement>(null);

  // Construit la date au format YYYY-MM-DD pour l'API
  const dateNaissance = annee.length === 4 && mois.length === 2 && jour.length === 2
    ? `${annee}-${mois}-${jour}`
    : '';

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
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setAnnee(clean);
  };

  const handleSubmit = async () => {
    if (!prenom || !dateNaissance) return;
    setLoading(true);
    setResultat('');
    const res = await fetch('/api/astro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, dateNaissance }),
    });
    const data = await res.json();
    setResultat(data.resultat);
    setLoading(false);
  };

  const handlePaiement = async () => {
    if (!email) {
      alert('Veuillez entrer votre email pour recevoir votre rapport');
      return;
    }
    if (email && !emailSaved) {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prenom }),
      });
      setEmailSaved(true);
    }
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, dateNaissance, email }),
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <main className="min-h-screen bg-[#1E1B4B] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-white mb-2">🔮 Mystora</h1>
        <p className="text-[#D4A574] text-lg">Découvrez ce que les astres disent de vous</p>
      </div>

      <div className="bg-[#2D2A6E] rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h2 className="text-white text-2xl font-semibold text-center mb-6">Votre profil gratuit</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Votre prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="bg-[#1E1B4B] text-white placeholder-gray-400 rounded-xl px-4 py-3 outline-none border border-[#6B21A8] focus:border-[#D4A574]"
          />

          {/* Sélecteur de date JJ / MM / AAAA */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm px-1">Date de naissance</label>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="JJ"
                value={jour}
                onChange={(e) => handleJour(e.target.value)}
                className="bg-[#1E1B4B] text-white placeholder-gray-500 rounded-xl px-3 py-3 outline-none border border-[#6B21A8] focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold"
              />
              <input
                ref={moisRef}
                type="tel"
                inputMode="numeric"
                placeholder="MM"
                value={mois}
                onChange={(e) => handleMois(e.target.value)}
                className="bg-[#1E1B4B] text-white placeholder-gray-500 rounded-xl px-3 py-3 outline-none border border-[#6B21A8] focus:border-[#D4A574] w-1/4 text-center text-lg font-semibold"
              />
              <input
                ref={anneeRef}
                type="tel"
                inputMode="numeric"
                placeholder="AAAA"
                value={annee}
                onChange={(e) => handleAnnee(e.target.value)}
                className="bg-[#1E1B4B] text-white placeholder-gray-500 rounded-xl px-3 py-3 outline-none border border-[#6B21A8] focus:border-[#D4A574] w-2/4 text-center text-lg font-semibold"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !prenom || !dateNaissance}
            className="bg-[#6B21A8] hover:bg-[#7C3AED] text-white font-bold py-3 rounded-xl transition-all duration-200 mt-2 disabled:opacity-50"
          >
            {loading ? '✨ Analyse en cours...' : '✨ Découvrir mon profil'}
          </button>
        </div>

        {resultat && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="p-4 bg-[#1E1B4B] rounded-xl border border-[#6B21A8]">
              <p className="text-white leading-relaxed">{resultat}</p>
            </div>
            <div className="p-4 bg-[#3D1A6E] rounded-xl border border-[#D4A574] text-center">
              <p className="text-[#D4A574] font-semibold mb-1">✨ Ce n'est que le début...</p>
              <p className="text-gray-300 text-sm mb-3">Votre rapport complet révèle votre destinée amoureuse, professionnelle et votre mois à venir.</p>
              <input
                type="email"
                placeholder="Votre email (pour recevoir votre rapport)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1E1B4B] text-white placeholder-gray-400 rounded-xl px-4 py-3 outline-none border border-[#6B21A8] focus:border-[#D4A574] w-full mb-3"
              />
              <button
                onClick={handlePaiement}
                className="bg-[#D4A574] text-[#1E1B4B] font-bold py-2 px-6 rounded-xl w-full hover:bg-yellow-400 transition-all">
                🔮 Débloquer mon rapport complet — 4,99€
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-500 text-sm mt-6">Divertissement</p>
    </main>
  );
}