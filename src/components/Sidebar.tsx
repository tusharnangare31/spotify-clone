import React from 'react';
import { Home, Search, Library, PlusSquare, Heart } from 'lucide-react';

interface SidebarProps {
  currentView: 'home' | 'search' | 'library';
  setCurrentView: (view: 'home' | 'search' | 'library') => void;
  onSelectSearchQuery?: (q: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onSelectSearchQuery,
}) => {
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
            currentView === 'home' ? 'text-white' : 'text-spotify-gray hover:text-white'
          }`}
        >
          <Home size={24} />
          <span>Home</span>
        </button>

        <button
          onClick={() => setCurrentView('search')}
          className={`w-full flex items-center gap-4 transition-colors font-bold text-sm ${
            currentView === 'search' ? 'text-white' : 'text-spotify-gray hover:text-white'
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
          <button title="Create Playlist" className="hover:text-white">
            <PlusSquare size={20} />
          </button>
        </div>

        {/* Liked songs button */}
        <div
          onClick={() => {
            setCurrentView('search');
            onSelectSearchQuery?.('Liked Songs');
          }}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-600 to-blue-300 flex items-center justify-center text-white shrink-0">
            <Heart size={16} fill="currentColor" />
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-white truncate">Liked Songs</p>
            <p className="text-xs text-spotify-gray">Playlist</p>
          </div>
        </div>

        <div className="border-t border-white/10 my-3" />

        {/* Fast Category List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 text-sm text-spotify-gray">
          {quickCategories.map((cat) => (
            <p
              key={cat}
              onClick={() => {
                setCurrentView('search');
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
