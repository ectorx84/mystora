'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Partage() {
  const params = useParams();
  const id = params.id as string;
  const [prenom, setPrenom] = useState('');
  const [rapport, setRapport] = useState('');
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/partage/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.rapport) {
            setPrenom(data.prenom);
            setRapport(data.rapport);
          } else {
            setErreur(true);
          }
          setLoading(false);
        })
        .catch(() => {
          setErreur(true);
          setLoading(false);
        });
    }
  }, [id]);

  const btnStyle = { backgroundColor: '#D4A574', color: '#1E1B4B' };

  return (
    <main className="min-h-screen bg-[#1E1B4B] flex flex-col items-center px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🔮 Mystora</h1>
        {prenom && <p className="text-[#D4A574] text-lg">Le profil astrologique de {prenom}</p>}
      </div>

      <div className="bg-[#2D2A6E] rounded-2xl p-8 w-full max-w-2xl shadow-xl">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#D4A574] text-xl animate-pulse">✨ Chargement du profil...</p>
          </div>
        ) : erreur ? (
          <p className="text-white text-center">Ce profil n'existe plus.</p>
        ) : (
          <div className="text-white leading-relaxed whitespace-pre-wrap">{rapport}</div>
        )}
      </div>

      <div className="mt-8 w-full max-w-2xl bg-[#3D1A6E] rounded-2xl p-8 border border-[#D4A574] text-center">
        <p className="text-[#D4A574] text-2xl font-bold mb-2">🔮 Et toi ?</p>
        <p className="text-white mb-6">Découvre ce que les astres disent de toi gratuitement</p>
        <a href="/" style={btnStyle} className="font-bold py-4 px-8 rounded-xl text-lg inline-block">
          ✨ Découvrir mon profil gratuit
        </a>
      </div>

      <p className="text-gray-500 text-sm mt-6">Divertissement</p>
    </main>
  );
}