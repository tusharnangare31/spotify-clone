import React, { useEffect, useState } from 'react';
import { Play, Pause, Clock, Trash2, Music2, ArrowLeft } from 'lucide-react';
import type { CustomPlaylist } from '../services/storage';
import { getCustomPlaylists, removeTrackFromPlaylist, deleteCustomPlaylist } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
  onDeleted: () => void;
  onFindSongs: () => void;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  onBack,
  onDeleted,
  onFindSongs,
}) => {
  const [playlist, setPlaylist] = useState<CustomPlaylist | null>(null);
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const loadData = () => {
    const list = getCustomPlaylists();
    const found = list.find((p) => p.id === playlistId);
    setPlaylist(found || null);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('spotify_storage_change', loadData);
    return () => {
      window.removeEventListener('spotify_storage_change', loadData);
    };
  }, [playlistId]);

  if (!playlist) {
    return (
      <div className="p-8 text-center text-spotify-gray">
        <p>Playlist not found.</p>
        <button onClick={onBack} className="mt-4 text-white underline">
          Go back
        </button>
      </div>
    );
  }

  const tracks = playlist.tracks || [];
  const isPlaylistPlaying =
    isPlaying && tracks.some((t) => t.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isPlaylistPlaying) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      deleteCustomPlaylist(playlist.id);
      onDeleted();
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* ── Top Back Button ── */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-spotify-gray hover:text-white transition-colors bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 bg-black/40 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors"
          title="Delete Playlist"
        >
          <Trash2 size={14} />
          Delete Playlist
        </button>
      </div>

      {/* ── Gradient Banner ── */}
      <div className="px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-teal-800 via-emerald-950/70 to-transparent">
        {/* Playlist Art Box */}
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-900 flex items-center justify-center text-white shadow-[0_16px_36px_rgba(0,0,0,0.5)] shrink-0">
          <Music2 size={80} className="opacity-90" />
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
          <span className="text-xs uppercase font-extrabold tracking-widest text-white mb-1">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-3">
            {playlist.name}
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/80 flex-wrap justify-center sm:justify-start">
            <span className="text-white font-bold">You</span>
            <span>•</span>
            <span>{tracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* ── Actions (Play button) ── */}
      <div className="px-6 md:px-8 py-6 flex items-center gap-6">
        <button
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-40 cursor-pointer"
          title="Play Playlist"
        >
          {isPlaylistPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>

      {/* ── Tracklist ── */}
      <div className="px-6 md:px-8 flex-1">
        {tracks.length === 0 ? (
          <div className="py-16 text-center text-spotify-gray space-y-4">
            <Music2 size={48} className="mx-auto opacity-30 mb-2" />
            <h3 className="text-xl font-bold text-white">It's a bit empty here</h3>
            <p className="text-sm max-w-sm mx-auto">
              Find songs from the search tab and add them to this playlist!
            </p>
            <button
              onClick={onFindSongs}
              className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
            >
              Find songs
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-[36px_minmax(0,1fr)_60px] px-4 py-2 border-b border-white/10 text-xs font-semibold text-spotify-gray uppercase tracking-wider mb-2">
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
                    className={`grid grid-cols-[36px_minmax(0,1fr)_60px] items-center px-4 py-2.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer group ${
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

                    {/* Remove from playlist + Duration */}
                    <div className="flex items-center justify-end gap-3 text-xs text-spotify-gray font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrackFromPlaylist(playlist.id, track.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-spotify-gray transition-all"
                        title="Remove from this playlist"
                      >
                        <Trash2 size={15} />
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
