import { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import type { SpotifyAlbum, SpotifyTrack } from './types/spotify';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { AlbumView } from './components/AlbumView';
import { ArtistView } from './components/ArtistView';
import { LikedSongsView } from './components/LikedSongsView';
import { PlaylistView } from './components/PlaylistView';
import { PlaylistModal } from './components/PlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { NowPlayingRightSidebar } from './components/NowPlayingRightSidebar';
import { QueueDrawer } from './components/QueueDrawer';
import { LyricsModal } from './components/LyricsModal';

function SpotifyApp() {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'library'>('home');
  const searchQuery = '';
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<{ name: string; id?: string } | null>(null);

  // Liked Songs & Custom Playlists state
  const [isLikedOpen, setIsLikedOpen] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<SpotifyTrack | null>(null);

  // Right Panels & Overlays state
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  const resetOverlays = () => {
    setSelectedAlbum(null);
    setSelectedArtist(null);
    setIsLikedOpen(false);
    setActivePlaylistId(null);
  };

  const handleViewChange = (view: 'home' | 'search' | 'library') => {
    resetOverlays();
    setCurrentView(view);
  };

  const handleOpenLiked = () => {
    resetOverlays();
    setIsLikedOpen(true);
  };

  const handleOpenPlaylist = (playlistId: string) => {
    resetOverlays();
    setActivePlaylistId(playlistId);
  };

  const handleOpenArtist = (name: string, id?: string) => {
    setSelectedAlbum(null);
    setIsLikedOpen(false);
    setActivePlaylistId(null);
    setSelectedArtist({ name, id });
  };

  const handleBackNavigation = () => {
    if (selectedArtist) {
      setSelectedArtist(null);
    } else if (selectedAlbum) {
      setSelectedAlbum(null);
    } else if (isLikedOpen) {
      setIsLikedOpen(false);
    } else if (activePlaylistId) {
      setActivePlaylistId(null);
    } else {
      handleViewChange('home');
    }
  };

  const hasOverlayView = Boolean(selectedArtist || selectedAlbum || isLikedOpen || activePlaylistId);

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-white overflow-hidden select-none font-sans">
      {/* ── Top Workspace: Sidebar + Main Area + Right Sidebar ── */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* 1. Left Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={handleViewChange}
          onOpenLikedSongs={handleOpenLiked}
          onOpenCustomPlaylist={handleOpenPlaylist}
          onOpenArtist={handleOpenArtist}
          onCreatePlaylist={() => setIsCreateModalOpen(true)}
          isLikedActive={isLikedOpen}
          activePlaylistId={activePlaylistId}
          activeArtistName={selectedArtist?.name}
        />

        {/* 2. Main Content Area */}
        <main className="flex-1 bg-[#121212] rounded-lg flex flex-col overflow-hidden relative shadow-sm">
          {/* Top Bar Header */}
          <header className="h-16 px-6 flex items-center justify-between z-10 shrink-0 bg-transparent">
            {/* History navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackNavigation}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                title="Go back"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => handleViewChange('search')}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                title="Go to Search"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleViewChange('search')}
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
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e3264]/40 via-[#121212]/90 to-[#121212]">
            {/* 1. Artist Detail View (e.g. Pritam) */}
            {selectedArtist && (
              <ArtistView
                artistName={selectedArtist.name}
                artistId={selectedArtist.id}
                onBack={() => setSelectedArtist(null)}
                onSelectAlbum={(album) => setSelectedAlbum(album)}
                onSelectArtist={(name, id) => setSelectedArtist({ name, id })}
                onAddToPlaylist={(t) => setTrackToAdd(t)}
              />
            )}

            {/* 2. Album Detail View */}
            {selectedAlbum && !selectedArtist && (
              <AlbumView
                album={selectedAlbum}
                onBack={() => setSelectedAlbum(null)}
                onAddToPlaylist={(t) => setTrackToAdd(t)}
                onSelectArtist={(name, id) => handleOpenArtist(name, id)}
              />
            )}

            {/* 3. Liked Songs View */}
            {isLikedOpen && !selectedAlbum && !selectedArtist && (
              <LikedSongsView onBack={() => setIsLikedOpen(false)} />
            )}

            {/* 4. Custom Playlist View */}
            {activePlaylistId && !selectedAlbum && !selectedArtist && (
              <PlaylistView
                playlistId={activePlaylistId}
                onBack={() => setActivePlaylistId(null)}
                onDeleted={() => setActivePlaylistId(null)}
                onFindSongs={() => handleViewChange('search')}
              />
            )}

            {/* 5. Base Views (Preserved in memory) */}
            <div className={hasOverlayView ? 'hidden' : 'block'}>
              <div className={currentView === 'home' ? 'block' : 'hidden'}>
                <HomeView onSelectAlbum={(album) => setSelectedAlbum(album)} />
              </div>

              <div className={currentView === 'search' ? 'block' : 'hidden'}>
                <SearchView
                  initialQuery={searchQuery}
                  onSelectAlbum={(album) => setSelectedAlbum(album)}
                  onSelectArtist={(name, id) => handleOpenArtist(name, id)}
                  onAddToPlaylist={(t) => setTrackToAdd(t)}
                />
              </div>

              <div className={currentView === 'library' ? 'block' : 'hidden'}>
                <div className="p-8 text-center text-spotify-gray space-y-4">
                  <h2 className="text-2xl font-bold text-white">Your Library</h2>
                  <p className="text-sm max-w-sm mx-auto">
                    Create playlists and save your favorite music in one place!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-spotify-green text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
                    >
                      Create Playlist
                    </button>
                    <button
                      onClick={handleOpenLiked}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors"
                    >
                      Liked Songs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 3. Right Panel: Queue Drawer or Now Playing View */}
        {isQueueOpen ? (
          <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
        ) : isNowPlayingOpen ? (
          <NowPlayingRightSidebar
            isOpen={isNowPlayingOpen}
            onClose={() => setIsNowPlayingOpen(false)}
            onSelectArtist={(name) => handleOpenArtist(name)}
          />
        ) : null}
      </div>

      {/* ── Persistent Playback Bar ── */}
      <PlayerBar
        isNowPlayingOpen={isNowPlayingOpen && !isQueueOpen}
        onToggleNowPlaying={() => {
          setIsQueueOpen(false);
          setIsNowPlayingOpen((v) => !v);
        }}
        onSelectArtist={(name) => handleOpenArtist(name)}
        onToggleLyrics={() => setIsLyricsOpen((v) => !v)}
        isLyricsOpen={isLyricsOpen}
        onToggleQueue={() => {
          setIsQueueOpen((v) => !v);
        }}
        isQueueOpen={isQueueOpen}
      />

      {/* ── Modals & Full Screen Overlays ── */}
      <PlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newId) => handleOpenPlaylist(newId)}
      />

      <AddToPlaylistModal
        track={trackToAdd}
        isOpen={Boolean(trackToAdd)}
        onClose={() => setTrackToAdd(null)}
        onCreateNewPlaylist={() => {
          setIsCreateModalOpen(true);
        }}
      />

      <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
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
