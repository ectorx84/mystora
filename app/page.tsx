'use client';
import { useState } from 'react';

export default function Home() {
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [resultat, setResultat] = useState('');
  const [loading, setLoading] = useState(false);

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
          <input
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
            className="bg-[#1E1B4B] text-white rounded-xl px-4 py-3 outline-none border border-[#6B21A8] focus:border-[#D4A574]"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
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
      <button className="bg-[#D4A574] text-[#1E1B4B] font-bold py-2 px-6 rounded-xl w-full hover:bg-yellow-400 transition-all">
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