import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Loader2,
  Shuffle,
  Repeat,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC = () => {
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
  const [prevVolume, setPrevVolume] = useState(80);

  const albumImage =
    currentTrack?.album?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80';

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
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

  return (
    <footer className="h-[88px] bg-spotify-darker border-t border-[#282828] px-4 flex items-center justify-between z-30 select-none">
      {/* ── Left: Current Track Info ── */}
      <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
        <img
          src={albumImage}
          alt={currentTrack?.name || 'Song'}
          className={`w-14 h-14 rounded object-cover shadow-md bg-spotify-light shrink-0 ${
            isLoading ? 'opacity-70 animate-pulse' : ''
          }`}
        />
        <div className="min-w-0 pr-2">
          <h4 className="text-sm font-bold truncate text-white hover:underline cursor-pointer">
            {currentTrack?.name || 'Select a song'}
          </h4>
          <p className="text-xs text-spotify-gray truncate hover:underline cursor-pointer">
            {currentTrack?.artists?.map((a) => a.name).join(', ') || 'Spotify + YouTube Hybrid'}
          </p>
        </div>

        {currentTrack && (
          <button
            onClick={() => setIsLiked((v) => !v)}
            className={`text-spotify-gray hover:text-white transition-colors p-1 ${
              isLiked ? 'text-spotify-green hover:text-spotify-green' : ''
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* ── Center: Playback Controls ── */}
      <div className="flex flex-col items-center max-w-[45%] w-full">
        <div className="flex items-center gap-5 mb-1.5">
          <button className="text-spotify-gray hover:text-white transition-colors cursor-pointer">
            <Shuffle size={16} />
          </button>

          <button
            onClick={prevTrack}
            disabled={!currentTrack}
            className="text-spotify-gray hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentTrack || isLoading}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-black" />
            ) : isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            disabled={!currentTrack}
            className="text-spotify-gray hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          <button className="text-spotify-gray hover:text-white transition-colors cursor-pointer">
            <Repeat size={16} />
          </button>
        </div>

        {/* Progress scrub bar */}
        <div className="w-full flex items-center gap-2 max-w-[480px]">
          <span className="text-[11px] text-spotify-gray w-8 text-right font-mono">
            {formatTime(progress)}
          </span>
          <div
            onClick={handleSeek}
            className="h-1 bg-spotify-light rounded-full flex-1 relative cursor-pointer group py-1.5 -my-1.5"
          >
            <div className="h-1 bg-[#4d4d4d] rounded-full w-full relative overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-spotify-green transition-colors rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-spotify-gray w-8 font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* ── Right: Volume Controls ── */}
      <div className="flex items-center justify-end gap-2.5 w-[30%] min-w-[140px]">
        <button
          onClick={toggleMute}
          className="text-spotify-gray hover:text-white transition-colors"
        >
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 h-1 bg-spotify-light rounded-full accent-white hover:accent-spotify-green cursor-pointer"
        />
      </div>
    </footer>
  );
};
