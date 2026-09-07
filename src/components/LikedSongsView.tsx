import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Clock, Music2, ArrowLeft } from 'lucide-react';
import type { SpotifyTrack } from '../types/spotify';
import { getLikedSongs, toggleLikeTrack } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';

interface LikedSongsViewProps {
  onBack: () => void;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({ onBack }) => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const loadSongs = () => {
    setTracks(getLikedSongs());
  };

  useEffect(() => {
    loadSongs();
    window.addEventListener('spotify_storage_change', loadSongs);
    return () => {
      window.removeEventListener('spotify_storage_change', loadSongs);
    };
  }, []);

  const isLikedPlaylistPlaying =
    isPlaying && tracks.some((t) => t.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isLikedPlaylistPlaying) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* ── Top Back Button ── */}
      <div className="p-6 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-spotify-gray hover:text-white transition-colors bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* ── Gradient Banner ── */}
      <div className="px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-indigo-700 via-indigo-900/60 to-transparent">
        {/* Heart Box */}
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center text-white shadow-[0_16px_36px_rgba(0,0,0,0.5)] shrink-0">
          <Heart size={80} fill="currentColor" />
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
          <span className="text-xs uppercase font-extrabold tracking-widest text-white mb-1">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-3">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/80 flex-wrap justify-center sm:justify-start">
            <span className="text-white font-bold">You</span>
            <span>•</span>
            <span>{tracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="px-6 md:px-8 py-6 flex items-center gap-6">
        <button
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-40 cursor-pointer"
          title="Play Liked Songs"
        >
          {isLikedPlaylistPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>

      {/* ── Tracklist ── */}
      <div className="px-6 md:px-8 flex-1">
        {tracks.length === 0 ? (
          <div className="py-20 text-center text-spotify-gray space-y-3">
            <Music2 size={48} className="mx-auto opacity-30 mb-2" />
            <h3 className="text-xl font-bold text-white">Songs you like will appear here</h3>
            <p className="text-sm max-w-sm mx-auto">
              Save songs by tapping the heart icon on any song or album!
            </p>
          </div>
        ) : (
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-[36px_minmax(0,1fr)_48px] px-4 py-2 border-b border-white/10 text-xs font-semibold text-spotify-gray uppercase tracking-wider mb-2">
              <span>#</span>
              <span>Title</span>
              <div className="flex justify-end">
                <Clock size={16} />
              </div>
            </div>

            {/* Track Rows */}
            <div className="space-y-1">
              {tracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id || idx}
                    onClick={() => playTrack(track, tracks)}
                    className={`grid grid-cols-[36px_minmax(0,1fr)_48px] items-center px-4 py-2.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer group ${
                      isCurrent ? 'bg-white/15' : ''
                    }`}
                  >
                    {/* Index or Play icon */}
                    <div className="text-sm text-spotify-gray font-mono">
                      <span className="group-hover:hidden">
                        {isCurrent && isPlaying ? (
                          <span className="text-spotify-green font-bold">▶</span>
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <button className="hidden group-hover:block text-white">
                        {isCurrent && isPlaying ? (
                          <Pause size={14} fill="currentColor" />
                        ) : (
                          <Play size={14} fill="currentColor" />
                        )}
                      </button>
                    </div>

                    {/* Track Info with mini thumbnail */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <img
                        src={
                          track.album?.images?.[0]?.url ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80'
                        }
                        alt={track.name}
                        className="w-10 h-10 rounded object-cover shrink-0 bg-[#222]"
                      />
                      <div className="truncate">
                        <p
                          className={`text-sm font-bold truncate ${
                            isCurrent ? 'text-spotify-green' : 'text-white'
                          }`}
                        >
                          {track.name}
                        </p>
                        <p className="text-xs text-spotify-gray truncate">
                          {track.artists?.map((a) => a.name).join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Duration + Unlike button */}
                    <div className="flex items-center justify-end gap-3 text-xs text-spotify-gray font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrack(track);
                        }}
                        className="text-spotify-green hover:opacity-75 transition-opacity"
                        title="Remove from Liked Songs"
                      >
                        <Heart size={16} fill="currentColor" />
                      </button>
                      <span>{formatDuration(track.duration_ms)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
