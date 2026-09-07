import React, { useState } from 'react';
import {
  ChevronDown,
  MoreHorizontal,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Mic2,
  ListMusic,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { isTrackLiked, toggleLikeTrack } from '../services/storage';

interface MobileFullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  onSelectArtist?: (name: string) => void;
}

export const MobileFullscreenPlayer: React.FC<MobileFullscreenPlayerProps> = ({
  isOpen,
  onClose,
  onToggleLyrics,
  onToggleQueue,
  onSelectArtist,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
  } = usePlayer();

  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  React.useEffect(() => {
    if (currentTrack) {
      setIsLiked(isTrackLiked(currentTrack.id));
    }
  }, [currentTrack]);

  if (!isOpen || !currentTrack) return null;

  const albumImage =
    currentTrack.album?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';

  const artistName = currentTrack.artists?.[0]?.name || 'Artist';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeProgress = isDragging ? dragProgress : progress;
  const progressPercent = duration > 0 ? (activeProgress / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setDragProgress(val);
  };

  const handleSeekCommit = () => {
    seekTo(dragProgress);
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#383838] via-[#1a1a1a] to-[#121212] flex flex-col justify-between p-6 select-none animate-in fade-in duration-200 overflow-y-auto">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between text-white pt-2">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-white hover:text-spotify-green transition-colors cursor-pointer"
          title="Collapse"
        >
          <ChevronDown size={28} />
        </button>

        <div className="text-center max-w-[65%] truncate">
          <span className="text-[10px] font-bold uppercase tracking-widest text-spotify-gray block">
            Playing from
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {currentTrack.album?.name || 'Playlist'}
          </span>
        </div>

        <button
          className="p-2 -mr-2 text-white hover:text-spotify-gray transition-colors"
          title="More options"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* ── Giant Album Artwork ── */}
      <div className="my-auto flex items-center justify-center py-4">
        <div className="relative w-[78vw] h-[78vw] max-w-[340px] max-h-[340px] rounded-xl overflow-hidden shadow-2xl border border-white/5">
          <img
            src={albumImage}
            alt={currentTrack.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isPlaying ? 'scale-100' : 'scale-95 opacity-90'
            }`}
          />
        </div>
      </div>

      {/* ── Bottom Controls Section ── */}
      <div className="space-y-4 pb-6">
        {/* Title, Artist, & Like Button */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-xl font-bold text-white truncate tracking-tight">
              {currentTrack.name}
            </h2>
            <p
              onClick={() => {
                onClose();
                onSelectArtist?.(artistName);
              }}
              className="text-sm text-spotify-gray truncate hover:text-white cursor-pointer mt-0.5"
            >
              {currentTrack.artists?.map((a) => a.name).join(', ') || artistName}
            </p>
          </div>

          <button
            onClick={() => {
              const res = toggleLikeTrack(currentTrack);
              setIsLiked(res);
            }}
            className={`p-2 transition-transform active:scale-125 ${
              isLiked ? 'text-spotify-green' : 'text-white/70 hover:text-white'
            }`}
          >
            <Heart size={26} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Scrubber Slider */}
        <div className="space-y-1.5">
          <div className="relative w-full h-4 flex items-center group cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={1}
              value={activeProgress}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Track Background */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Thumb */}
            <div
              className="absolute w-3 h-3 bg-white rounded-full shadow pointer-events-none transition-transform"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-[#a7a7a7] font-mono">
            <span>{formatTime(activeProgress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls (Shuffle, Prev, Play, Next, Repeat) */}
        <div className="flex items-center justify-between pt-1 px-1">
          <button
            onClick={() => setIsShuffle((v) => !v)}
            className={`p-2 transition-colors relative ${
              isShuffle ? 'text-spotify-green' : 'text-white/70 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle size={20} />
            {isShuffle && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-1 left-1/2 -translate-x-1/2" />
            )}
          </button>

          <button
            onClick={prevTrack}
            className="p-2 text-white hover:text-spotify-green transition-colors active:scale-90"
            title="Previous"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-white hover:text-spotify-green transition-colors active:scale-90"
            title="Next"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>

          <button
            onClick={() => setIsRepeat((v) => !v)}
            className={`p-2 transition-colors relative ${
              isRepeat ? 'text-spotify-green' : 'text-white/70 hover:text-white'
            }`}
            title="Repeat"
          >
            <Repeat size={20} />
            {isRepeat && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-1 left-1/2 -translate-x-1/2" />
            )}
          </button>
        </div>

        {/* Secondary Action Triggers: Lyrics & Queue */}
        <div className="flex items-center justify-between pt-2 px-3 text-[#a7a7a7]">
          <button
            onClick={() => {
              onClose();
              onToggleLyrics();
            }}
            className="flex items-center gap-1.5 hover:text-white transition-colors text-xs font-semibold"
          >
            <Mic2 size={18} />
            <span>Lyrics</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onToggleQueue();
            }}
            className="flex items-center gap-1.5 hover:text-white transition-colors text-xs font-semibold"
          >
            <ListMusic size={20} />
            <span>Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};