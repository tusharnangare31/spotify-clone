import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { SpotifyTrack } from '../types/spotify';
import { resolveYouTubeVideoId } from '../services/youtubeResolver';

interface PlayerContextType {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: SpotifyTrack[];
  playTrack: (track: SpotifyTrack, newQueue?: SpotifyTrack[]) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
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

  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const isReadyRef = useRef(false);

  // Initialize YouTube Iframe API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

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
            } else if (e.data === 2) {
              setIsPlaying(false);
            } else if (e.data === 0) {
              setIsPlaying(false);
              nextTrack();
            }
          },
        },
      });
    }

    // Polling progress timer
    timerRef.current = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setProgress(cur);
          if (dur > 0) setDuration(dur);
        } catch {}
      }
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const playTrack = async (track: SpotifyTrack, newQueue?: SpotifyTrack[]) => {
    setCurrentTrack(track);
    setIsLoading(true);
    setIsPlaying(false);
    setProgress(0);

    if (newQueue) {
      setQueue(newQueue);
    }

    try {
      const artistName = track.artists?.map((a) => a.name).join(' ') || '';
      const videoId = await resolveYouTubeVideoId(track.name, artistName);

      if (!videoId) {
        alert(`Could not find audio stream for "${track.name}".`);
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

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else if (queue.length > 0) {
      playTrack(queue[0]); // Loop back to start
    }
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
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
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
      }}
    >
      {children}
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
