import React, { useEffect, useState } from 'react';
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  ListMusic,
  ArrowRight,
  Pin,
  Music,
} from 'lucide-react';
import type { CustomPlaylist } from '../services/storage';
import { getCustomPlaylists, getLikedSongs } from '../services/storage';

interface SidebarProps {
  currentView: 'home' | 'search' | 'library';
  setCurrentView: (view: 'home' | 'search' | 'library') => void;
  onOpenLikedSongs: () => void;
  onOpenCustomPlaylist: (playlistId: string) => void;
  onOpenArtist: (name: string, id?: string) => void;
  onCreatePlaylist: () => void;
  isLikedActive?: boolean;
  activePlaylistId?: string | null;
  activeArtistName?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onOpenLikedSongs,
  onOpenCustomPlaylist,
  onOpenArtist,
  onCreatePlaylist,
  isLikedActive,
  activePlaylistId,
  activeArtistName,
}) => {
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'playlists' | 'artists'>('all');
  const [filterSearch, setFilterSearch] = useState('');

  const loadData = () => {
    setCustomPlaylists(getCustomPlaylists());
    setLikedCount(getLikedSongs().length);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('spotify_storage_change', loadData);
    return () => {
      window.removeEventListener('spotify_storage_change', loadData);
    };
  }, []);

  const favoriteArtists = [
    {
      id: '1wRPtKGflJrBx9BmLsSwlU',
      name: 'Pritam',
      image: 'https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca',
    },
    {
      id: '4YRxDV8wJFPHPTeXepOstw',
      name: 'Arijit Singh',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200',
    },
    {
      id: '0y59o4v8uw5crb98r598',
      name: 'The Weeknd',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    },
  ];

  return (
    <aside className="w-[280px] lg:w-[310px] flex flex-col hidden md:flex shrink-0 select-none gap-2">
      {/* ── Top Panel: Logo + Home + Search ── */}
      <div className="bg-[#121212] rounded-lg p-4 space-y-4 shadow-sm">
        {/* Spotify Logo Header */}
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 px-1 cursor-pointer text-white hover:text-white"
        >
          <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center text-black font-black">
            <Music size={18} fill="currentColor" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Spotify</span>
        </div>

        <nav className="space-y-3 pt-1">
          <button
            onClick={() => setCurrentView('home')}
            className={`w-full flex items-center gap-4 transition-colors font-bold text-sm px-1 ${
              currentView === 'home' && !isLikedActive && !activePlaylistId && !activeArtistName
                ? 'text-white'
                : 'text-spotify-gray hover:text-white'
            }`}
          >
            <Home size={24} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setCurrentView('search')}
            className={`w-full flex items-center gap-4 transition-colors font-bold text-sm px-1 ${
              currentView === 'search' && !isLikedActive && !activePlaylistId && !activeArtistName
                ? 'text-white'
                : 'text-spotify-gray hover:text-white'
            }`}
          >
            <Search size={24} />
            <span>Search</span>
          </button>
        </nav>
      </div>

      {/* ── Bottom Panel: Your Library ── */}
      <div className="flex-1 bg-[#121212] rounded-lg p-2.5 flex flex-col overflow-hidden shadow-sm">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2.5 py-2 text-spotify-gray">
          <button
            onClick={() => setCurrentView('library')}
            className="flex items-center gap-3 font-bold text-sm hover:text-white transition-colors"
          >
            <Library size={24} />
            <span>Your Library</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onCreatePlaylist}
              title="Create playlist"
              className="p-1.5 hover:bg-white/10 rounded-full hover:text-white transition-all text-spotify-gray"
            >
              <Plus size={20} />
            </button>
            <button
              title="Enlarge Library"
              className="p-1.5 hover:bg-white/10 rounded-full hover:text-white transition-all text-spotify-gray"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-2.5 py-2 overflow-x-auto no-scrollbar">
          {(['all', 'playlists', 'artists'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 ${
                filter === t
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>

        {/* Library Search & Sort Row */}
        <div className="flex items-center justify-between px-2.5 py-1 text-xs text-spotify-gray">
          <div className="relative flex-1 mr-2">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-spotify-gray" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search in Library"
              className="w-full bg-transparent hover:bg-white/5 focus:bg-white/10 rounded-md pl-7 pr-2 py-1 text-xs text-white placeholder:text-spotify-gray/60 focus:outline-none transition-colors"
            />
          </div>
          <span className="font-semibold hover:text-white cursor-pointer shrink-0">Recents</span>
        </div>

        {/* Scrollable List of Playlists & Artists */}
        <div className="flex-1 overflow-y-auto space-y-1 mt-1.5 pr-1 playlist-scroll">
          {/* Pinned Liked Songs */}
          {(filter === 'all' || filter === 'playlists') && (
            <div
              onClick={onOpenLikedSongs}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors group ${
                isLikedActive ? 'bg-white/15 text-white' : ''
              }`}
            >
              <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center text-white shrink-0 shadow-md">
                <Heart size={20} fill="currentColor" />
              </div>
              <div className="truncate flex-1">
                <p
                  className={`text-sm font-semibold truncate ${
                    isLikedActive ? 'text-spotify-green' : 'text-white'
                  }`}
                >
                  Liked Songs
                </p>
                <div className="flex items-center gap-1.5 text-xs text-spotify-gray">
                  <Pin size={11} className="text-spotify-green rotate-45" fill="currentColor" />
                  <span>Playlist • {likedCount} songs</span>
                </div>
              </div>
            </div>
          )}

          {/* Followed Artists */}
          {(filter === 'all' || filter === 'artists') &&
            favoriteArtists
              .filter((a) => a.name.toLowerCase().includes(filterSearch.toLowerCase()))
              .map((artist) => {
                const isActive = activeArtistName?.toLowerCase() === artist.name.toLowerCase();
                return (
                  <div
                    key={artist.id}
                    onClick={() => onOpenArtist(artist.name, artist.id)}
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors group ${
                      isActive ? 'bg-white/15' : ''
                    }`}
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 shadow-md bg-[#222]"
                    />
                    <div className="truncate flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-spotify-green' : 'text-white'
                        }`}
                      >
                        {artist.name}
                      </p>
                      <p className="text-xs text-spotify-gray">Artist</p>
                    </div>
                  </div>
                );
              })}

          {/* User Custom Playlists */}
          {(filter === 'all' || filter === 'playlists') &&
            customPlaylists
              .filter((p) => p.name.toLowerCase().includes(filterSearch.toLowerCase()))
              .map((pl) => {
                const isActive = activePlaylistId === pl.id;
                return (
                  <div
                    key={pl.id}
                    onClick={() => onOpenCustomPlaylist(pl.id)}
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors group ${
                      isActive ? 'bg-white/15' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center text-spotify-gray group-hover:text-white shrink-0">
                      <ListMusic size={22} />
                    </div>
                    <div className="truncate flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-spotify-green' : 'text-white'
                        }`}
                      >
                        {pl.name}
                      </p>
                      <p className="text-xs text-spotify-gray">Playlist • {pl.tracks.length} songs</p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </aside>
  );
};
