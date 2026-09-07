import React, { useEffect, useState } from 'react';
import { Play, Loader2, Clock } from 'lucide-react';
import type { SpotifyAlbum, SpotifyTrack } from '../types/spotify';
import { getHomeFeedData, getAlbumTracks, type HomeFeedData } from '../services/spotify';
import { getRecentlyPlayed } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';

interface HomeViewProps {
  onSelectAlbum?: (album: SpotifyAlbum) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectAlbum }) => {
  const [feedData, setFeedData] = useState<HomeFeedData | null>(null);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good evening');

  const { playTrack, currentTrack } = usePlayer();

  // Load greeting and history
  const updateRecent = () => {
    setRecentTracks(getRecentlyPlayed());
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    updateRecent();
    window.addEventListener('spotify_storage_change', updateRecent);

    async function loadData() {
      setLoading(true);
      try {
        const data = await getHomeFeedData();
        setFeedData(data);
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      window.removeEventListener('spotify_storage_change', updateRecent);
    };
  }, []);

  const handlePlayAlbum = async (album: SpotifyAlbum, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tracks = await getAlbumTracks(album.id, album.name);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-spotify-gray min-h-[60vh]">
        <Loader2 size={44} className="animate-spin text-spotify-green mb-4" />
        <p className="text-sm font-semibold text-white">Loading live music & trends…</p>
      </div>
    );
  }

  // Quick access tiles: prioritize recently played tracks, then trending albums
  const quickTiles: {
    id: string;
    title: string;
    image: string;
    action: () => void;
  }[] = [];

  // Add recent tracks to quick tiles
  recentTracks.slice(0, 6).forEach((track) => {
    quickTiles.push({
      id: track.id,
      title: track.name,
      image:
        track.album?.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160',
      action: () => playTrack(track, recentTracks),
    });
  });

  // If fewer than 6, backfill with trending albums
  if (quickTiles.length < 6 && feedData) {
    feedData.trendingAlbums.forEach((alb) => {
      if (quickTiles.length < 6 && !quickTiles.some((t) => t.title === alb.name)) {
        quickTiles.push({
          id: alb.id,
          title: alb.name,
          image:
            alb.images?.[0]?.url ||
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160',
          action: () => handlePlayAlbum(alb),
        });
      }
    });
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 select-none">
      {/* ── Top Greeting + Dynamic Fast Access Grid ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-5 tracking-tight text-white">
          {greeting}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {quickTiles.map((tile) => (
            <div
              key={tile.id}
              onClick={tile.action}
              className="flex items-center bg-white/5 hover:bg-white/15 transition-all duration-200 rounded-md overflow-hidden cursor-pointer group shadow-sm"
            >
              <img
                src={tile.image}
                alt={tile.title}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover shrink-0 shadow-md bg-[#222]"
              />
              <span className="font-bold px-3.5 text-xs sm:text-sm text-white truncate flex-1">
                {tile.title}
              </span>
              <button
                className="mr-3 w-9 h-9 sm:w-10 sm:h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0"
                title={`Play ${tile.title}`}
              >
                <Play size={18} fill="currentColor" className="ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shelf 1: Recently Played / Jump Back In (Dynamic) ── */}
      {recentTracks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-spotify-green" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Jump Back In
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {recentTracks.slice(0, 6).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, recentTracks)}
                  className="bg-[#181818]/70 p-3 sm:p-3.5 rounded-lg hover:bg-[#282828] transition-all duration-200 cursor-pointer group flex flex-col"
                >
                  <div className="aspect-square w-full rounded-md mb-3 relative overflow-hidden shadow-lg bg-[#222]">
                    <img
                      src={track.album?.images?.[0]?.url}
                      alt={track.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      className={`absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-95 transition-all ${
                        isCurrent
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
                      }`}
                      title={`Play ${track.name}`}
                    >
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                  <h3
                    className={`font-bold text-xs sm:text-sm truncate mb-0.5 ${
                      isCurrent ? 'text-spotify-green' : 'text-white'
                    }`}
                  >
                    {track.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-spotify-gray truncate">
                    {track.artists?.map((a) => a.name).join(', ') || 'Song'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Shelf 2: Today's Biggest Hits (Live Global Trends) ── */}
      {feedData && feedData.trendingAlbums.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Today's Biggest Hits
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {feedData.trendingAlbums.slice(0, 6).map((album) => (
              <div
                key={album.id}
                onClick={() => onSelectAlbum?.(album)}
                className="bg-[#181818]/70 p-3 sm:p-3.5 rounded-lg hover:bg-[#282828] transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-md mb-3 relative overflow-hidden shadow-lg bg-[#222]">
                  <img
                    src={album.images?.[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => handlePlayAlbum(album, e)}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${album.name}`}
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
                <h3 className="font-bold text-xs sm:text-sm truncate mb-0.5 text-white">
                  {album.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-spotify-gray truncate">
                  {album.artists?.map((a) => a.name).join(', ') || 'Album'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shelf 3: Bollywood Magic (Live Hindi Hits) ── */}
      {feedData && feedData.bollywoodAlbums.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Bollywood Magic
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {feedData.bollywoodAlbums.slice(0, 6).map((album) => (
              <div
                key={album.id}
                onClick={() => onSelectAlbum?.(album)}
                className="bg-[#181818]/70 p-3 sm:p-3.5 rounded-lg hover:bg-[#282828] transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-md mb-3 relative overflow-hidden shadow-lg bg-[#222]">
                  <img
                    src={album.images?.[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => handlePlayAlbum(album, e)}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${album.name}`}
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
                <h3 className="font-bold text-xs sm:text-sm truncate mb-0.5 text-white">
                  {album.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-spotify-gray truncate">
                  {album.artists?.map((a) => a.name).join(', ') || 'Bollywood'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shelf 4: Punjabi Bangers (Live Punjabi Hits) ── */}
      {feedData && feedData.punjabiAlbums.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Punjabi Bangers
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {feedData.punjabiAlbums.slice(0, 6).map((album) => (
              <div
                key={album.id}
                onClick={() => onSelectAlbum?.(album)}
                className="bg-[#181818]/70 p-3 sm:p-3.5 rounded-lg hover:bg-[#282828] transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-md mb-3 relative overflow-hidden shadow-lg bg-[#222]">
                  <img
                    src={album.images?.[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => handlePlayAlbum(album, e)}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${album.name}`}
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
                <h3 className="font-bold text-xs sm:text-sm truncate mb-0.5 text-white">
                  {album.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-spotify-gray truncate">
                  {album.artists?.map((a) => a.name).join(', ') || 'Punjabi'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shelf 5: Deep Focus & Chill (Live Lo-Fi) ── */}
      {feedData && feedData.chillTracks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Deep Focus & Chill
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {feedData.chillTracks.slice(0, 6).map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, feedData.chillTracks)}
                className="bg-[#181818]/70 p-3 sm:p-3.5 rounded-lg hover:bg-[#282828] transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-md mb-3 relative overflow-hidden shadow-lg bg-[#222]">
                  <img
                    src={track.album?.images?.[0]?.url}
                    alt={track.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${track.name}`}
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
                <h3 className="font-bold text-xs sm:text-sm truncate mb-0.5 text-white">
                  {track.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-spotify-gray truncate">
                  {track.artists?.map((a) => a.name).join(', ') || 'Lo-Fi'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
