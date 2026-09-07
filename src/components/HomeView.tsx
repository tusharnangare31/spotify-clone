import React, { useEffect, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import type { SpotifyAlbum, SpotifyPlaylist } from '../types/spotify';
import { getNewReleases, getFeaturedPlaylists, getAlbumTracks, getPlaylistTracks } from '../services/spotify';
import { usePlayer } from '../context/PlayerContext';

interface HomeViewProps {
  onSelectAlbum?: (album: SpotifyAlbum) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectAlbum }) => {
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good evening');

  const { playTrack } = usePlayer();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    async function loadData() {
      setLoading(true);
      try {
        const [releases, featured] = await Promise.all([
          getNewReleases(12),
          getFeaturedPlaylists(8),
        ]);
        setAlbums(releases);
        setPlaylists(featured);
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePlayAlbum = async (album: SpotifyAlbum, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tracks = await getAlbumTracks(album.id, album.name);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    const tracks = await getPlaylistTracks(playlistId);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-spotify-gray">
        <Loader2 size={40} className="animate-spin text-spotify-green mb-4" />
        <p className="text-sm font-semibold">Connecting to Spotify & YouTube Engine…</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* ── Top Greeting + Fast Playlists Grid ── */}
      <div>
        <h1 className="text-3xl font-extrabold mb-6 tracking-tight">{greeting}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handlePlayPlaylist(playlist.id)}
              className="flex items-center bg-white/5 hover:bg-white/15 transition-all duration-200 rounded-md overflow-hidden cursor-pointer group shadow-sm"
            >
              <img
                src={playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120'}
                alt={playlist.name}
                className="w-16 h-16 object-cover shrink-0 shadow-md"
              />
              <span className="font-bold px-4 text-sm truncate flex-1">{playlist.name}</span>
              <button
                className="mr-4 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0"
                title={`Play ${playlist.name}`}
              >
                <Play size={18} fill="currentColor" className="ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── New Releases (Albums & Singles) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">New Releases</h2>
          <span className="text-xs font-bold text-spotify-gray hover:underline cursor-pointer">
            Show all
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum?.(album)}
              className="bg-spotify-light/60 p-3.5 rounded-lg hover:bg-spotify-light transition-all duration-200 cursor-pointer group flex flex-col"
            >
              <div className="aspect-square w-full rounded-md mb-3.5 relative overflow-hidden shadow-lg bg-[#222]">
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

              <h3 className="font-bold text-sm truncate mb-1 text-white">{album.name}</h3>
              <p className="text-xs text-spotify-gray truncate">
                {album.artists?.map((a) => a.name).join(', ') || 'Album'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured Playlists ── */}
      {playlists.length > 6 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Featured Playlists</h2>
            <span className="text-xs font-bold text-spotify-gray hover:underline cursor-pointer">
              Show all
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.slice(6).map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => handlePlayPlaylist(playlist.id)}
                className="bg-spotify-light/60 p-3.5 rounded-lg hover:bg-spotify-light transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-md mb-3.5 relative overflow-hidden shadow-lg bg-[#222]">
                  <img
                    src={playlist.images?.[0]?.url}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${playlist.name}`}
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm truncate mb-1 text-white">{playlist.name}</h3>
                <p className="text-xs text-spotify-gray line-clamp-2">{playlist.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
