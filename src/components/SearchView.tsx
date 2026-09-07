import React, { useEffect, useState } from 'react';
import { Search, Play, Pause, Loader2, Music2, Heart, Plus } from 'lucide-react';
import type { SpotifyAlbum, SpotifyTrack } from '../types/spotify';
import { searchSpotify, getAlbumTracks } from '../services/spotify';
import { usePlayer } from '../context/PlayerContext';
import { isTrackLiked, toggleLikeTrack } from '../services/storage';

interface SearchViewProps {
  initialQuery?: string;
  onSelectAlbum?: (album: SpotifyAlbum) => void;
  onAddToPlaylist?: (track: SpotifyTrack) => void;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SearchView: React.FC<SearchViewProps> = ({ initialQuery = '', onSelectAlbum, onAddToPlaylist }) => {
  const [query, setQuery] = useState(initialQuery);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [searching, setSearching] = useState(false);

  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const suggestedPills = [
    'Arijit Singh',
    'Sidhu Moose Wala',
    'Diljit Dosanjh',
    'Karan Aujla',
    'The Weeknd',
    'Coldplay',
    'Lofi Beats',
    'Gym Phonk',
  ];

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setTracks([]);
      setAlbums([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchSpotify(searchTerm);
      setTracks(results.tracks);
      setAlbums(results.albums);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    }
  };

  const handleSelectPill = (pill: string) => {
    setQuery(pill);
    executeSearch(pill);
  };

  const topTrack = tracks[0];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ── Search Bar Input ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to listen to?"
          className="w-full bg-white text-black pl-11 pr-4 py-3 rounded-full text-sm font-semibold placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-white"
        />
        {searching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-black" size={18} />
        )}
      </div>

      {/* ── Quick Tags ── */}
      <div className="flex flex-wrap gap-2">
        {suggestedPills.map((pill) => (
          <button
            key={pill}
            onClick={() => handleSelectPill(pill)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              query === pill
                ? 'bg-spotify-green text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* ── Search Results ── */}
      {tracks.length > 0 && (
        <div className="space-y-8">
          {/* Top Result + Songs Split */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Top Result */}
            {topTrack && (
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-3">Top result</h2>
                <div
                  onClick={() => playTrack(topTrack, tracks)}
                  className="bg-spotify-light/60 p-5 rounded-lg hover:bg-spotify-light transition-all duration-200 cursor-pointer group relative flex flex-col justify-between h-[230px]"
                >
                  <img
                    src={topTrack.album?.images?.[0]?.url}
                    alt={topTrack.name}
                    className="w-24 h-24 rounded-md object-cover shadow-xl mb-4 bg-[#222]"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-white truncate mb-1">{topTrack.name}</h3>
                    <p className="text-sm text-spotify-gray">
                      <span className="text-white font-semibold">
                        {topTrack.artists?.map((a) => a.name).join(', ')}
                      </span>{' '}
                      • Song
                    </p>
                  </div>

                  <button
                    className="absolute bottom-5 right-5 w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-105 active:scale-95"
                    title={`Play ${topTrack.name}`}
                  >
                    <Play size={22} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Songs List */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold mb-3">Songs</h2>
              <div className="space-y-1">
                {tracks.slice(0, 4).map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, tracks)}
                      className={`flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer group ${
                        isCurrent ? 'bg-white/15' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="w-10 h-10 rounded bg-[#222] shrink-0 overflow-hidden relative">
                          <img
                            src={track.album?.images?.[0]?.url}
                            alt={track.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            {isCurrent && isPlaying ? (
                              <Pause size={14} fill="white" className="text-white" />
                            ) : (
                              <Play size={14} fill="white" className="text-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="truncate">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-spotify-green' : 'text-white'
                            }`}
                          >
                            {track.name}
                          </h4>
                          <p className="text-xs text-spotify-gray truncate">
                            {track.artists?.map((a) => a.name).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pr-2 shrink-0">
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
                          <Heart size={16} fill={isTrackLiked(track.id) ? 'currentColor' : 'none'} />
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

                        <span className="text-xs text-spotify-gray font-mono w-10 text-right">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Matching Albums Grid */}
          {albums.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.slice(0, 6).map((album) => (
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
                        onClick={async (e) => {
                          e.stopPropagation();
                          const albumTracks = await getAlbumTracks(album.id, album.name);
                          if (albumTracks.length > 0) playTrack(albumTracks[0], albumTracks);
                        }}
                        className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-105 active:scale-95"
                      >
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm truncate mb-1 text-white">{album.name}</h3>
                    <p className="text-xs text-spotify-gray truncate">
                      {album.artists?.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty State ── */}
      {!searching && tracks.length === 0 && (
        <div className="py-16 text-center text-spotify-gray space-y-3">
          <Music2 size={48} className="mx-auto opacity-40 mb-2" />
          <h3 className="text-lg font-bold text-white">Find your favorite music</h3>
          <p className="text-sm max-w-sm mx-auto">
            Search for songs, artists, or albums. Audio will instantly stream via YouTube!
          </p>
        </div>
      )}
    </div>
  );
};
