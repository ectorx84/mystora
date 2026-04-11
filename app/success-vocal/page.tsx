'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessVocalContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const [prenom, setPrenom] = useState('');
  const [rapport, setRapport] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('Lien invalide.');
      setLoading(false);
      return;
    }

    fetch('/api/rapport-vocal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPrenom(data.prenom);
          setRapport(data.rapport);
          setAudioUrl(data.audioUrl);
          setEmail(data.email);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Une erreur est survenue. Contactez contact@mystora.fr');
        setLoading(false);
      });
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-[#0D0B2E] flex flex-col items-center px-4 py-12">
      {/* En-tête */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">✦</div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Mystora</h1>
        <p className="text-[#D4A574] text-lg tracking-widest uppercase text-sm">Guidance Approfondie</p>
      </div>

      {loading && (
        <div className="text-center py-20 max-w-md">
          <div className="text-5xl mb-6 animate-pulse">🔮</div>
          <p className="text-[#D4A574] text-xl mb-2">Victoria prépare votre guidance...</p>
          <p className="text-gray-400 text-sm">Génération du rapport approfondi et de la narration vocale.</p>
          <p className="text-gray-500 text-xs mt-2">Cela peut prendre 30 à 60 secondes.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="w-full max-w-2xl">
          {/* Titre personnalisé */}
          <div className="text-center mb-8">
            <p className="text-[#D4A574] text-xl italic mb-1">"{prenom}, votre message vous attendait."</p>
          </div>

          {/* Lecteur audio */}
          {audioUrl && (
            <div className="bg-gradient-to-b from-[#1a1245] to-[#0D0B2E] border border-[#D4A574]/30 rounded-2xl p-6 mb-8 text-center shadow-xl shadow-[#D4A574]/5">
              <div className="text-4xl mb-3">🎙️</div>
              <p className="text-[#D4A574] font-semibold mb-1">Narration vocale par Victoria</p>
              <p className="text-gray-400 text-sm mb-5">~15 minutes · Écouter avec des écouteurs pour une expérience optimale</p>

              <audio
                controls
                autoPlay={false}
                className="w-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ filter: 'invert(1) sepia(1) saturate(3) hue-rotate(300deg)' }}
              >
                <source src={audioUrl} type="audio/mpeg" />
              </audio>

              <p className="text-gray-500 text-xs mt-4">
                Ce lien vous a été envoyé par email pour le réécouter à tout moment.
              </p>
            </div>
          )}

          {/* Rapport texte */}
          <div className="bg-[#1a1245] border border-[#D4A574]/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D4A574]/50" />
              <span className="text-[#D4A574] text-sm tracking-widest uppercase">Votre guidance complète</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D4A574]/50" />
            </div>

            <div
              className="text-gray-200 leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '1.9' }}
            >
              {rapport}
            </div>
          </div>

          {/* Email confirmation */}
          {email && (
            <div className="mt-6 p-4 bg-[#1a1245]/50 rounded-xl border border-[#D4A574]/20 text-center">
              <p className="text-[#D4A574] text-sm">
                📧 Votre guidance et le lien audio ont été envoyés à <strong>{email}</strong>
              </p>
            </div>
          )}

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4A574]/30 to-transparent" />
          </div>

          {/* Retour */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">Divertissement · Mystora.fr</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SuccessVocal() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0D0B2E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🔮</div>
          <p className="text-[#D4A574] text-xl animate-pulse">Chargement de votre guidance...</p>
        </div>
      </main>
    }>
      <SuccessVocalContent />
    </Suspense>
  );
}
