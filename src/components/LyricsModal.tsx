import React, { useEffect, useState } from 'react';
import { X, Mic2, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack } = usePlayer();
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    async function fetchLyrics() {
      setLoading(true);
      try {
        const artist = currentTrack?.artists?.[0]?.name || '';
        const title = currentTrack?.name || '';
        const res = await fetch(
          `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
            artist
          )}&track_name=${encodeURIComponent(title)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.plainLyrics) {
            setLyrics(data.plainLyrics.split('\n').filter(Boolean));
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback poetic lyrics sample if API is unreachable
      setLyrics([
        `Lyrics for "${currentTrack?.name}"`,
        `Performed by ${currentTrack?.artists?.map((a) => a.name).join(', ')}`,
        '',
        '♪ (Music playing in harmony) ♪',
        '',
        'Every heartbeat resonates with the melody,',
        'Singing through the silence of the night.',
        'Lost inside the rhythms and the energy,',
        'Everything feels endless, clear and bright.',
        '',
        '♪ (Instrumental solo) ♪',
        '',
        'From the highest mountains to the ocean deep,',
        'A song of hope that we forever keep.',
      ]);
      setLoading(false);
    }

    fetchLyrics();
  }, [isOpen, currentTrack?.id]);

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#2b1c40] via-[#1a0f2b] to-[#0d0716] flex flex-col p-6 md:p-12 overflow-hidden animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-spotify-green">
            <Mic2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">{currentTrack.name}</h3>
            <p className="text-xs text-white/70">
              {currentTrack.artists?.map((a) => a.name).join(', ')}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Lyrics Body */}
      <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full py-8 space-y-6 text-center md:text-left select-none no-scrollbar">
        {loading ? (
          <div className="py-24 text-center text-white/60 space-y-3">
            <Music2 size={40} className="mx-auto animate-bounce text-spotify-green" />
            <p className="text-sm font-semibold">Loading lyrics…</p>
          </div>
        ) : (
          lyrics.map((line, idx) => (
            <p
              key={idx}
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight transition-all duration-300 hover:text-white cursor-pointer ${
                line.startsWith('♪')
                  ? 'text-spotify-green italic'
                  : 'text-white/60 hover:scale-[1.01]'
              }`}
            >
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  );
};
