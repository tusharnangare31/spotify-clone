import React, { useEffect, useState } from 'react';
import { Home, Search, Library, Plus, Heart, ListMusic } from 'lucide-react';
import type { CustomPlaylist } from '../services/storage';
import { getCustomPlaylists } from '../services/storage';

interface SidebarProps {
  currentView: 'home' | 'search' | 'library';
  setCurrentView: (view: 'home' | 'search' | 'library') => void;
  onOpenLikedSongs: () => void;
  onOpenCustomPlaylist: (playlistId: string) => void;
  onCreatePlaylist: () => void;
  onSelectSearchQuery?: (q: string) => void;
  isLikedActive?: boolean;
  activePlaylistId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onOpenLikedSongs,
  onOpenCustomPlaylist,
  onCreatePlaylist,
  onSelectSearchQuery,
  isLikedActive,
  activePlaylistId,
}) => {
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>([]);

  const loadPlaylists = () => {
    setCustomPlaylists(getCustomPlaylists());
  };

  useEffect(() => {
    loadPlaylists();
    window.addEventListener('spotify_storage_change', loadPlaylists);
    return () => {
      window.removeEventListener('spotify_storage_change', loadPlaylists);
    };
  }, []);

  const quickCategories = [
    'Bollywood Hits',
    'Top 50 - Global',
    'Punjabi 101',
    'Arijit Singh Essentials',
    'Gym Motivation',
    'Chill Lofi Beats',
    'Deep Focus',
  ];

  return (
    <aside className="w-64 bg-spotify-dark rounded-lg flex flex-col hidden md:flex shrink-0 select-none">
      {/* Navigation section */}
      <div className="p-5 space-y-4">
        <button
          onClick={() => setCurrentView('home')}
          className={`w-full flex items-center gap-4 transition-colors font-bold text-sm ${
            currentView === 'home' && !isLikedActive && !activePlaylistId
              ? 'text-white'
              : 'text-spotify-gray hover:text-white'
          }`}
        >
          <Home size={24} />
          <span>Home</span>
        </button>

        <button
          onClick={() => setCurrentView('search')}
          className={`w-full flex items-center gap-4 transition-colors font-bold text-sm ${
            currentView === 'search' && !isLikedActive && !activePlaylistId
              ? 'text-white'
              : 'text-spotify-gray hover:text-white'
          }`}
        >
          <Search size={24} />
          <span>Search</span>
        </button>
      </div>

      {/* Library section */}
      <div className="flex-1 bg-spotify-dark rounded-lg mt-2 p-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between text-spotify-gray hover:text-white transition-colors mb-4">
          <button
            onClick={() => setCurrentView('library')}
            className="flex items-center gap-3 font-bold text-sm"
          >
            <Library size={22} />
            <span>Your Library</span>
          </button>
          <button
            onClick={onCreatePlaylist}
            title="Create Playlist"
            className="p-1 hover:bg-white/10 rounded-full text-spotify-gray hover:text-white transition-all"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Liked songs button */}
        <div
          onClick={onOpenLikedSongs}
          className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors ${
            isLikedActive ? 'bg-white/15 text-white' : ''
          }`}
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-600 to-blue-300 flex items-center justify-center text-white shrink-0 shadow-md">
            <Heart size={16} fill="currentColor" />
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-white truncate">Liked Songs</p>
            <p className="text-xs text-spotify-gray">Playlist</p>
          </div>
        </div>

        {/* Custom Playlists list */}
        {customPlaylists.length > 0 && (
          <div className="space-y-1 mt-2">
            {customPlaylists.map((pl) => {
              const isActive = activePlaylistId === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => onOpenCustomPlaylist(pl.id)}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors ${
                    isActive ? 'bg-white/15 text-white' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-[#282828] flex items-center justify-center text-spotify-gray shrink-0">
                    <ListMusic size={16} />
                  </div>
                  <div className="truncate">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-spotify-green' : 'text-white'
                      }`}
                    >
                      {pl.name}
                    </p>
                    <p className="text-xs text-spotify-gray">{pl.tracks.length} songs</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-white/10 my-3" />

        {/* Fast Category List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 text-sm text-spotify-gray">
          {quickCategories.map((cat) => (
            <p
              key={cat}
              onClick={() => {
                onSelectSearchQuery?.(cat);
              }}
              className="hover:text-white cursor-pointer truncate transition-colors text-[13px]"
            >
              {cat}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
};
