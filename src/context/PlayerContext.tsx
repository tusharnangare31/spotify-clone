import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { SpotifyTrack } from '../types/spotify';
import { resolveYouTubeVideoId } from '../services/youtubeResolver';
import { addRecentlyPlayed } from '../services/storage';
import { getRecommendationsForTrack } from '../services/spotify';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: SpotifyTrack[];
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playTrack: (track: SpotifyTrack, newQueue?: SpotifyTrack[]) => Promise<void>;
  addToQueue: (tracks: SpotifyTrack[]) => void;
  removeFromQueue: (trackId: string, index?: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  showToast: (msg: string) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const playerRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const isShuffleRef = useRef(false);
  isShuffleRef.current = isShuffle;
  const repeatModeRef = useRef<RepeatMode>('off');
  repeatModeRef.current = repeatMode;
  const queueRef = useRef<SpotifyTrack[]>([]);
  queueRef.current = queue;
  const currentTrackRef = useRef<SpotifyTrack | null>(null);
  currentTrackRef.current = currentTrack;
  const progressRef = useRef(0);
  progressRef.current = progress;

  // 1. Initialize YouTube Iframe API once on mount
  useEffect(() => {
    function initPlayer() {
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player('hidden-yt-player', {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            isReadyRef.current = true;
            e.target.setVolume(volume);
          },
          onStateChange: (e: any) => {
            // 1: PLAYING, 2: PAUSED, 0: ENDED
            if (e.data === 1) {
              setIsPlaying(true);
              setIsLoading(false);
              const ytDur = e.target.getDuration();
              if (ytDur > 0) setDuration(ytDur);
            } else if (e.data === 2) {
              setIsPlaying(false);
            } else if (e.data === 0) {
              setIsPlaying(false);
              handleTrackEnded();
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }
  }, []);

  // 2. Dedicated smooth progress tracking timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof cur === 'number' && !isNaN(cur)) {
            setProgress(cur);
          }
          if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
            setDuration(dur);
          }
        } catch {}
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const addToQueue = (tracks: SpotifyTrack[]) => {
    setQueue((prev) => [...prev, ...tracks]);
    showToast(`Added ${tracks.length} track${tracks.length > 1 ? 's' : ''} to queue`);
  };

  const removeFromQueue = (trackId: string, index?: number) => {
    setQueue((prev) => {
      if (typeof index === 'number') {
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      }
      return prev.filter((t) => t.id !== trackId);
    });
    showToast('Removed from queue');
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
    } else {
      setQueue([]);
    }
    showToast('Queue cleared');
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? 'Shuffle enabled' : 'Shuffle disabled');
      return next;
    });
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') {
        showToast('Repeat all enabled');
        return 'all';
      }
      if (prev === 'all') {
        showToast('Repeat one enabled');
        return 'one';
      }
      showToast('Repeat disabled');
      return 'off';
    });
  };

  const playTrack = async (track: SpotifyTrack, newQueue?: SpotifyTrack[]) => {
    setCurrentTrack(track);
    addRecentlyPlayed(track);
    setIsLoading(true);
    setIsPlaying(false);
    setProgress(0);
    if (track.duration_ms) {
      setDuration(Math.floor(track.duration_ms / 1000));
    }

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else {
      setQueue([track]);
      // Background auto-enrichment: generate Spotify Track Radio recommendations
      getRecommendationsForTrack(track, 15).then((recs) => {
        if (recs && recs.length > 0) {
          setQueue((curr) => (curr.length <= 1 && curr[0]?.id === track.id ? [track, ...recs] : curr));
        }
      });
    }

    try {
      const artistName = track.artists?.map((a) => a.name).join(' ') || '';
      const videoId = await resolveYouTubeVideoId(track.name, artistName);

      if (!videoId) {
        showToast(`Could not find audio stream for "${track.name}".`);
        setIsLoading(false);
        return;
      }

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
      } else {
        // Retry shortly if player is initializing
        setTimeout(() => {
          playerRef.current?.loadVideoById?.(videoId);
          playerRef.current?.playVideo?.();
        }, 800);
      }
    } catch (err) {
      console.error('Playback resolution error:', err);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleTrackEnded = () => {
    // 1. Repeat One: replay the exact same song
    if (repeatModeRef.current === 'one' && currentTrackRef.current) {
      if (playerRef.current?.seekTo && playerRef.current?.playVideo) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
        setProgress(0);
        setIsPlaying(true);
      } else {
        playTrack(currentTrackRef.current);
      }
      return;
    }
    nextTrack();
  };

  const nextTrack = async () => {
    const curTrack = currentTrackRef.current;
    const currentQ = queueRef.current;
    if (!curTrack || currentQ.length === 0) return;

    const currentIndex = currentQ.findIndex((t) => t.id === curTrack.id);

    // 1. Shuffle mode: pick a random track from remaining queue
    if (isShuffleRef.current && currentQ.length > 1) {
      const otherIndices = currentQ.map((_, i) => i).filter((i) => i !== currentIndex);
      if (otherIndices.length > 0) {
        const randomIdx = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        playTrack(currentQ[randomIdx]);
        return;
      }
    }

    // 2. Normal sequential playback
    if (currentIndex !== -1 && currentIndex < currentQ.length - 1) {
      playTrack(currentQ[currentIndex + 1]);
      return;
    }

    // 3. Repeat All: loop back to beginning
    if (repeatModeRef.current === 'all') {
      if (currentQ.length > 0) {
        playTrack(currentQ[0]);
        return;
      }
    }

    // 4. Autoplay recommendations if repeat is off
    try {
      const freshRecs = await getRecommendationsForTrack(curTrack, 10);
      const filtered = freshRecs.filter((t) => t.id !== curTrack.id);
      if (filtered.length > 0) {
        showToast('Autoplaying recommended tracks...');
        setQueue((prev) => [...prev, ...filtered]);
        playTrack(filtered[0]);
        return;
      }
    } catch (e) {
      console.error('Autoplay error:', e);
    }

    // Default loop fallback
    if (currentQ.length > 0) {
      playTrack(currentQ[0]);
    }
  };

  const prevTrack = () => {
    const curTrack = currentTrackRef.current;
    const currentQ = queueRef.current;
    if (!curTrack || currentQ.length === 0) return;

    // Official Spotify behavior: if song > 3s, restart from 0:00
    if (progressRef.current > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = currentQ.findIndex((t) => t.id === curTrack.id);
    if (currentIndex > 0) {
      playTrack(currentQ[currentIndex - 1]);
    } else {
      seekTo(0);
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setProgress(seconds);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        progress,
        duration,
        volume,
        queue,
        isShuffle,
        repeatMode,
        playTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleShuffle,
        cycleRepeatMode,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1ed760] text-black font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-2 pointer-events-none transition-all">
          <Info className="w-4 h-4 shrink-0 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Hidden YouTube Iframe container */}
      <div className="absolute -left-[9999px] -top-[9999px] pointer-events-none opacity-0">
        <div id="hidden-yt-player"></div>
      </div>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
