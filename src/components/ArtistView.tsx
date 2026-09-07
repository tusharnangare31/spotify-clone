import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Loader2,
  ArrowLeft,
  BadgeCheck,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import type { SpotifyAlbum, SpotifyTrack } from '../types/spotify';
import { getArtistProfile } from '../services/spotify';
import { isTrackLiked, toggleLikeTrack } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';

interface ArtistViewProps {
  artistName: string;
  artistId?: string;
  onBack: () => void;
  onSelectAlbum: (album: SpotifyAlbum) => void;
  onSelectArtist: (name: string, id?: string) => void;
  onAddToPlaylist?: (track: SpotifyTrack) => void;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Generate realistic Spotify playcounts for display
function getFakeStreams(index: number): string {
  const bases = [
    '1,482,914,812',
    '982,410,240',
    '812,654,190',
    '731,902,411',
    '654,112,094',
    '521,890,231',
    '432,109,871',
    '389,012,450',
    '310,490,123',
    '289,120,491',
  ];
  return bases[index % bases.length];
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artistName,
  artistId,
  onBack,
  onSelectAlbum,
  onSelectArtist,
  onAddToPlaylist,
}) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [discographyTab, setDiscographyTab] = useState<'all' | 'albums' | 'singles'>('all');

  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getArtistProfile(artistName, artistId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load artist profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [artistName, artistId]);

  if (loading || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-spotify-gray">
        <Loader2 size={40} className="animate-spin text-spotify-green mb-4" />
        <p className="text-sm font-semibold">Loading artist profile…</p>
      </div>
    );
  }

  const { artist, topTracks, albums, relatedArtists } = profile;
  const isArtistPlaying = isPlaying && topTracks.some((t: SpotifyTrack) => t.id === currentTrack?.id);

  const handlePlayArtist = () => {
    if (topTracks.length === 0) return;
    if (isArtistPlaying) {
      togglePlay();
    } else {
      playTrack(topTracks[0], topTracks);
    }
  };

  const displayedTracks = showAllTracks ? topTracks : topTracks.slice(0, 5);

  const filteredAlbums = albums.filter((a: SpotifyAlbum) => {
    if (discographyTab === 'albums') return !a.name.toLowerCase().includes('single');
    if (discographyTab === 'singles') return a.name.toLowerCase().includes('single');
    return true;
  });

  return (
    <div className="flex flex-col min-h-full pb-16 select-none">
      {/* ── 1. Hero Header with Artist Image & Gradient Scrim ── */}
      <div className="relative w-full h-[360px] md:h-[420px] flex flex-col justify-between p-6 md:p-8 overflow-hidden">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${artist.image})` }}
        />
        {/* Gradient dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-spotify-dark via-spotify-dark/40 to-black/30" />

        {/* Top bar back button */}
        <div className="relative z-10">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white bg-black/50 hover:bg-black/70 px-4 py-2 rounded-full backdrop-blur-md transition-all shadow-md"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Hero Title and Verification */}
        <div className="relative z-10 space-y-2">
          {artist.verified && (
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-white tracking-wide">
              <span className="bg-[#1d75dc] text-white p-0.5 rounded-full inline-flex">
                <BadgeCheck size={18} fill="#1d75dc" stroke="white" />
              </span>
              <span>Verified Artist</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
            {artist.name}
          </h1>

          <p className="text-sm md:text-base font-semibold text-white/90 drop-shadow-md">
            {artist.monthlyListeners} monthly listeners
          </p>
        </div>
      </div>

      {/* ── 2. Action Bar (Play, Follow, More) ── */}
      <div className="px-6 md:px-8 py-6 flex items-center gap-6 bg-gradient-to-b from-spotify-dark/80 to-transparent">
        <button
          onClick={handlePlayArtist}
          disabled={topTracks.length === 0}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50 cursor-pointer"
          title={`Play ${artist.name}`}
        >
          {isArtistPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => setIsFollowing((v) => !v)}
          className={`px-6 py-2 rounded-full text-sm font-bold border tracking-wider uppercase transition-all ${
            isFollowing
              ? 'border-white/30 text-white bg-white/10 hover:border-white'
              : 'border-white/50 text-white hover:border-white hover:scale-105'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        <button className="text-spotify-gray hover:text-white transition-colors p-2">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* ── 3. Popular Songs ── */}
      <div className="px-6 md:px-8 mb-10">
        <h2 className="text-2xl font-bold mb-4 tracking-tight">Popular</h2>

        <div className="space-y-1">
          {displayedTracks.map((track: SpotifyTrack, idx: number) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id || idx}
                onClick={() => playTrack(track, topTracks)}
                className={`grid grid-cols-[28px_minmax(0,1fr)_auto] sm:grid-cols-[36px_minmax(0,1fr)_120px_48px] items-center px-2 sm:px-4 py-2.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer group ${
                  isCurrent ? 'bg-white/15' : ''
                }`}
              >
                {/* Rank number or Play button */}
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

                {/* Song info with cover thumbnail */}
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <img
                    src={track.album?.images?.[0]?.url}
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
                      {track.album?.name || 'Single'}
                    </p>
                  </div>
                </div>

                {/* Plays counter */}
                <div className="text-xs text-spotify-gray font-mono hidden sm:block text-right pr-4">
                  {getFakeStreams(idx)}
                </div>

                {/* Duration & Like */}
                <div className="flex items-center justify-end gap-2 text-xs text-spotify-gray font-mono">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeTrack(track);
                    }}
                    className={`p-1 rounded-full transition-all ${
                      isTrackLiked(track.id)
                        ? 'text-spotify-green'
                        : 'text-spotify-gray opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                    title="Save to Liked Songs"
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
                    <Plus size={15} />
                  </button>

                  <span>{formatDuration(track.duration_ms)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {topTracks.length > 5 && (
          <button
            onClick={() => setShowAllTracks((v) => !v)}
            className="mt-4 text-xs font-bold text-spotify-gray hover:text-white tracking-wider uppercase transition-colors px-4 py-1"
          >
            {showAllTracks ? 'Show less' : 'See more'}
          </button>
        )}
      </div>

      {/* ── 4. Discography ── */}
      {albums.length > 0 && (
        <div className="px-6 md:px-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Discography</h2>
            <div className="flex gap-2 text-xs font-bold">
              {(['all', 'albums', 'singles'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDiscographyTab(tab)}
                  className={`px-3 py-1.5 rounded-full capitalize transition-colors ${
                    discographyTab === tab
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {tab === 'all' ? 'Popular releases' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAlbums.map((album: SpotifyAlbum) => (
              <div
                key={album.id}
                onClick={() => onSelectAlbum(album)}
                className="bg-spotify-light/60 p-3.5 rounded-lg hover:bg-spotify-light transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-md mb-3.5 relative overflow-hidden shadow-lg bg-[#222]">
                  <img
                    src={album.images?.[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAlbum(album);
                    }}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${album.name}`}
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm truncate mb-1 text-white">{album.name}</h3>
                <p className="text-xs text-spotify-gray truncate">
                  {album.release_date || '2026'} • Album
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Fans Also Like (Related Artists) ── */}
      {relatedArtists.length > 0 && (
        <div className="px-6 md:px-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 tracking-tight">Fans Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedArtists.map((rel: any) => (
              <div
                key={rel.id}
                onClick={() => onSelectArtist(rel.name, rel.id)}
                className="bg-spotify-light/60 p-4 rounded-lg hover:bg-spotify-light transition-all duration-200 cursor-pointer group flex flex-col items-center text-center"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3.5 shadow-xl bg-[#222] relative">
                  <img
                    src={rel.image}
                    alt={rel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black shadow-lg">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-sm truncate text-white w-full">{rel.name}</h3>
                <p className="text-xs text-spotify-gray mt-0.5">Artist</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. About Section ── */}
      <div className="px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-4 tracking-tight">About</h2>
        <div
          onClick={handlePlayArtist}
          className="relative rounded-2xl overflow-hidden bg-[#242424] max-w-2xl h-[320px] p-8 flex flex-col justify-end group cursor-pointer shadow-xl hover:scale-[1.01] transition-transform"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-75 transition-opacity"
            style={{ backgroundImage: `url(${artist.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="relative z-10 space-y-2">
            <p className="text-2xl md:text-3xl font-black text-white">
              {artist.monthlyListeners} monthly listeners
            </p>
            <p className="text-xs md:text-sm text-white/90 line-clamp-3 max-w-xl font-medium leading-relaxed">
              {artist.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
