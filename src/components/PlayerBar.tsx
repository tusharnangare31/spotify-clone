import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Loader2,
  Shuffle,
  Repeat,
  Mic2,
  ListMusic,
  Maximize2,
  PanelRight,
  Laptop2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { isTrackLiked, toggleLikeTrack } from '../services/storage';

interface PlayerBarProps {
  isNowPlayingOpen?: boolean;
  onToggleNowPlaying?: () => void;
  onSelectArtist?: (name: string) => void;
  onToggleLyrics?: () => void;
  isLyricsOpen?: boolean;
  onToggleQueue?: () => void;
  isQueueOpen?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  isNowPlayingOpen,
  onToggleNowPlaying,
  onSelectArtist,
  onToggleLyrics,
  isLyricsOpen,
  onToggleQueue,
  isQueueOpen,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);

  useEffect(() => {
    const updateLiked = () => {
      setIsLiked(isTrackLiked(currentTrack?.id));
    };
    updateLiked();
    window.addEventListener('spotify_storage_change', updateLiked);
    return () => {
      window.removeEventListener('spotify_storage_change', updateLiked);
    };
  }, [currentTrack]);

  const albumImage =
    currentTrack?.album?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80';

  const artistName = currentTrack?.artists?.[0]?.name || 'Artist';
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const ratio = Math.max(0, Math.min(1, clickX / width));
    const newTime = ratio * duration;
    seekTo(newTime);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 80);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <footer className="h-[76px] bg-[#000000] border-t border-[#1a1a1a] px-4 flex items-center justify-between z-40 select-none shrink-0">
      {/* ── Left: Current Track Info (30% width) ── */}
      <div className="flex items-center gap-3.5 w-[30%] min-w-[200px]">
        <div className="relative group shrink-0">
          <img
            src={albumImage}
            alt={currentTrack?.name || 'Song'}
            className={`w-14 h-14 rounded object-cover shadow-md bg-[#282828] ${
              isLoading ? 'opacity-70 animate-pulse' : ''
            }`}
          />
        </div>

        <div className="min-w-0 pr-2">
          <h4 className="text-sm font-bold truncate text-white hover:underline cursor-pointer">
            {currentTrack?.name || 'No track playing'}
          </h4>
          <p
            onClick={() => currentTrack && onSelectArtist?.(artistName)}
            className="text-xs text-[#b3b3b3] truncate hover:text-white hover:underline cursor-pointer"
          >
            {currentTrack?.artists?.map((a) => a.name).join(', ') || 'Select music to play'}
          </p>
        </div>

        {currentTrack && (
          <button
            onClick={() => {
              if (currentTrack) {
                const status = toggleLikeTrack(currentTrack);
                setIsLiked(status);
              }
            }}
            className={`p-1.5 transition-all ${
              isLiked ? 'text-spotify-green' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* ── Center: Playback Controls (40% width) ── */}
      <div className="flex flex-col items-center max-w-[520px] w-[40%]">
        <div className="flex items-center gap-4 mb-1">
          {/* Shuffle */}
          <button
            onClick={() => setIsShuffle((v) => !v)}
            className={`relative p-1 transition-colors cursor-pointer ${
              isShuffle ? 'text-spotify-green' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title="Enable shuffle"
          >
            <Shuffle size={16} />
            {isShuffle && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            disabled={!currentTrack}
            className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-40 cursor-pointer p-1"
            title="Previous"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={!currentTrack || isLoading}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            disabled={!currentTrack}
            className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-40 cursor-pointer p-1"
            title="Next"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          {/* Repeat */}
          <button
            onClick={() => setIsRepeat((v) => !v)}
            className={`relative p-1 transition-colors cursor-pointer ${
              isRepeat ? 'text-spotify-green' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title="Enable repeat"
          >
            <Repeat size={16} />
            {isRepeat && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            )}
          </button>
        </div>

        {/* Progress scrub bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] text-[#b3b3b3] w-8 text-right font-mono">
            {formatTime(progress)}
          </span>
          <div
            onClick={handleSeek}
            className="h-1 bg-[#4d4d4d] rounded-full flex-1 relative cursor-pointer group py-2 -my-2 flex items-center"
          >
            <div className="h-1 bg-[#4d4d4d] rounded-full w-full relative">
              <div
                className="h-full bg-white group-hover:bg-spotify-green transition-colors rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="hidden group-hover:block w-3 h-3 bg-white rounded-full absolute -right-1.5 -top-1 shadow-md" />
              </div>
            </div>
          </div>
          <span className="text-[11px] text-[#b3b3b3] w-8 font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* ── Right: Extra Controls & Volume (30% width) ── */}
      <div className="flex items-center justify-end gap-3.5 w-[30%] min-w-[200px] text-[#b3b3b3]">
        {/* Now Playing View */}
        <button
          onClick={onToggleNowPlaying}
          className={`p-1 transition-colors cursor-pointer ${
            isNowPlayingOpen ? 'text-spotify-green' : 'hover:text-white'
          }`}
          title="Now playing view"
        >
          <PanelRight size={18} />
        </button>

        {/* Lyrics */}
        <button
          onClick={onToggleLyrics}
          className={`p-1 transition-colors cursor-pointer ${
            isLyricsOpen ? 'text-spotify-green' : 'hover:text-white'
          }`}
          title="Lyrics"
        >
          <Mic2 size={18} />
        </button>

        {/* Queue */}
        <button
          onClick={onToggleQueue}
          className={`p-1 transition-colors cursor-pointer ${
            isQueueOpen ? 'text-spotify-green' : 'hover:text-white'
          }`}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Connect to device */}
        <button className="p-1 hover:text-white transition-colors cursor-pointer" title="Connect to a device">
          <Laptop2 size={18} />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 group">
          <button onClick={toggleMute} className="hover:text-white transition-colors">
            {volume === 0 ? (
              <VolumeX size={18} />
            ) : volume < 50 ? (
              <Volume1 size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1 bg-[#4d4d4d] rounded-full accent-white hover:accent-spotify-green cursor-pointer"
          />
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullScreen}
          className="p-1 hover:text-white transition-colors cursor-pointer"
          title="Full screen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </footer>
  );
};
