import { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';

function SpotifyApp() {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectSearchQuery = (q: string) => {
    setSearchQuery(q);
    setCurrentView('search');
  };

  return (
    <div className="flex flex-col h-screen bg-spotify-darker text-white overflow-hidden select-none font-sans">
      {/* ── Top Workspace: Sidebar + Main Area ── */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onSelectSearchQuery={handleSelectSearchQuery}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-spotify-dark rounded-lg flex flex-col overflow-hidden relative">
          {/* Top Bar Header */}
          <header className="h-16 px-6 flex items-center justify-between z-10 shrink-0 bg-transparent">
            {/* History navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('home')}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                title="Go to Home"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentView('search')}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                title="Go to Search"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('search')}
                className="md:hidden text-xs bg-white text-black font-bold px-3 py-1.5 rounded-full"
              >
                Search
              </button>
              <div className="flex items-center gap-2 bg-black/50 hover:bg-black/70 p-1 pr-3 rounded-full cursor-pointer transition-colors border border-white/10">
                <div className="w-7 h-7 rounded-full bg-[#333] flex items-center justify-center text-white">
                  <User size={16} />
                </div>
                <span className="text-xs font-bold">Premium User</span>
              </div>
            </div>
          </header>

          {/* Dynamic View Scrollable Container */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e3264]/40 via-spotify-dark/80 to-spotify-dark">
            {currentView === 'home' && <HomeView />}
            {currentView === 'search' && <SearchView initialQuery={searchQuery} />}
            {currentView === 'library' && (
              <div className="p-8 text-center text-spotify-gray space-y-4">
                <h2 className="text-2xl font-bold text-white">Your Library</h2>
                <p className="text-sm max-w-sm mx-auto">
                  Playlists and liked songs you play will be saved directly into your local library!
                </p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
                >
                  Explore Home
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Persistent Playback Bar ── */}
      <PlayerBar />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <SpotifyApp />
    </PlayerProvider>
  );
}
