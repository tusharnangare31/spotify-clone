import React, { useEffect, useState } from 'react';
import { Play, Pause, Clock, Heart, Loader2, ArrowLeft, Plus } from 'lucide-react';
import type { SpotifyAlbum, SpotifyTrack } from '../types/spotify';
import { getAlbumTracks } from '../services/spotify';
import { usePlayer } from '../context/PlayerContext';
import { isTrackLiked, toggleLikeTrack } from '../services/storage';

interface AlbumViewProps {
  album: SpotifyAlbum;
  onBack: () => void;
  onAddToPlaylist?: (track: SpotifyTrack) => void;
  onSelectArtist?: (name: string, id?: string) => void;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AlbumView: React.FC<AlbumViewProps> = ({
  album,
  onBack,
  onAddToPlaylist,
  onSelectArtist,
}) => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  useEffect(() => {
    let isMounted = true;
    async function loadTracks() {
      setLoading(true);
      try {
        const data = await getAlbumTracks(album.id, album.name);
        if (isMounted) {
          setTracks(data);
        }
      } catch (err) {
        console.error('Failed to load album tracks:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTracks();
    return () => {
      isMounted = false;
    };
  }, [album.id, album.name]);

  const albumCover =
    album.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

  const artistName = album.artists?.map((a) => a.name).join(', ') || 'Various Artists';

  const isCurrentAlbumPlaying =
    isPlaying && tracks.some((t) => t.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isCurrentAlbumPlaying) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* ── Top Navigation Bar ── */}
      <div className="p-6 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-spotify-gray hover:text-white transition-colors bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* ── Album Banner ── */}
      <div className="px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-white/10 to-transparent">
        <img
          src={albumCover}
          alt={album.name}
          className="w-48 h-48 md:w-56 md:h-56 rounded-lg object-cover shadow-[0_16px_36px_rgba(0,0,0,0.6)] shrink-0 bg-[#222]"
        />

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
          <span className="text-xs uppercase font-extrabold tracking-widest text-spotify-gray mb-1">
            Album
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 line-clamp-2">
            {album.name}
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-spotify-gray flex-wrap justify-center sm:justify-start">
            <span
              onClick={() => onSelectArtist?.(artistName)}
              className="text-white font-bold hover:underline cursor-pointer"
            >
              {artistName}
            </span>
            <span>•</span>
            <span>{album.release_date ? new Date(album.release_date).getFullYear() : '2026'}</span>
            <span>•</span>
            <span>{tracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons (Play, Heart) ── */}
      <div className="px-6 md:px-8 py-6 flex items-center gap-6">
        <button
          onClick={handlePlayAll}
          disabled={loading || tracks.length === 0}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50 cursor-pointer"
          title="Play Album"
        >
          {isCurrentAlbumPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => setIsLiked((v) => !v)}
          className={`text-spotify-gray hover:text-white transition-colors p-2 ${
            isLiked ? 'text-spotify-green hover:text-spotify-green' : ''
          }`}
          title="Save to Your Library"
        >
          <Heart size={32} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Tracklist Table ── */}
      <div className="px-6 md:px-8 flex-1">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-spotify-gray">
            <Loader2 size={36} className="animate-spin text-spotify-green mb-3" />
            <p className="text-sm font-semibold">Loading tracklist…</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-12 text-center text-spotify-gray">
            <p className="text-sm">No tracks found for this album.</p>
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

                    {/* Track Info */}
                    <div className="min-w-0 pr-4">
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

                    {/* Actions + Duration */}
                    <div className="flex items-center justify-end gap-3 text-xs text-spotify-gray font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrack(track);
                        }}
                        className={`p-1.5 rounded-full transition-all ${
                          isTrackLiked(track.id)
                            ? 'text-spotify-green'
                            : 'text-spotify-gray opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                        title={isTrackLiked(track.id) ? 'Unlike' : 'Like'}
                      >
                        <Heart size={15} fill={isTrackLiked(track.id) ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylist?.(track);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-spotify-gray hover:text-white transition-all p-1"
                        title="Add to playlist"
                      >
                        <Plus size={16} />
                      </button>

                      <span className="w-10 text-right">{formatDuration(track.duration_ms)}</span>
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
