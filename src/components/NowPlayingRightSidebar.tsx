import React from 'react';
import { X, Heart, MoreHorizontal, Play } from 'lucide-react';
import { isTrackLiked, toggleLikeTrack } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';

interface NowPlayingRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtist: (name: string) => void;
}

export const NowPlayingRightSidebar: React.FC<NowPlayingRightSidebarProps> = ({
  isOpen,
  onClose,
  onSelectArtist,
}) => {
  const { currentTrack, queue, playTrack } = usePlayer();
  const [isFollowing, setIsFollowing] = React.useState(false);

  if (!isOpen || !currentTrack) return null;

  const albumImage =
    currentTrack.album?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

  const artistName = currentTrack.artists?.[0]?.name || 'Artist';

  const isLiked = isTrackLiked(currentTrack.id);

  // Find next track in queue
  const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
  const nextTrack =
    currentIndex !== -1 && currentIndex < queue.length - 1
      ? queue[currentIndex + 1]
      : queue.length > 1
      ? queue[0]
      : null;

  return (
    <aside className="w-[300px] lg:w-[340px] bg-[#121212] rounded-lg p-4 flex flex-col overflow-y-auto hidden xl:flex shrink-0 select-none shadow-sm space-y-4">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between text-white pb-2 border-b border-white/5">
        <h3 className="font-bold text-base truncate pr-2 hover:underline cursor-pointer">
          {currentTrack.album?.name || 'Now Playing'}
        </h3>
        <div className="flex items-center gap-1">
          <button className="text-spotify-gray hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <MoreHorizontal size={18} />
          </button>
          <button
            onClick={onClose}
            className="text-spotify-gray hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Close Now Playing View"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Giant Cover Artwork ── */}
      <div className="w-full aspect-square rounded-lg overflow-hidden shadow-2xl bg-[#222]">
        <img src={albumImage} alt={currentTrack.name} className="w-full h-full object-cover" />
      </div>

      {/* ── Song Title & Artist with Like Button ── */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-3">
          <h2 className="text-xl font-bold text-white truncate hover:underline cursor-pointer">
            {currentTrack.name}
          </h2>
          <p
            onClick={() => onSelectArtist(artistName)}
            className="text-sm text-spotify-gray font-semibold hover:text-white hover:underline cursor-pointer truncate"
          >
            {currentTrack.artists?.map((a) => a.name).join(', ')}
          </p>
        </div>

        <button
          onClick={() => toggleLikeTrack(currentTrack)}
          className={`p-2 rounded-full transition-all ${
            isLiked ? 'text-spotify-green' : 'text-spotify-gray hover:text-white'
          }`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── About the Artist Card ── */}
      <div className="bg-[#242424] rounded-xl overflow-hidden relative group shadow-md">
        <div
          className="h-32 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${albumImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#242424] to-transparent" />
          <span className="absolute top-3 left-3 text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">
            About the artist
          </span>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h4
              onClick={() => onSelectArtist(artistName)}
              className="font-bold text-base text-white hover:underline cursor-pointer"
            >
              {artistName}
            </h4>
            <p className="text-xs text-spotify-gray font-medium">Verified Artist</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-spotify-gray font-semibold">
              45,892,100 monthly listeners
            </span>
            <button
              onClick={() => setIsFollowing((v) => !v)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                isFollowing
                  ? 'border-white/40 text-white hover:border-white'
                  : 'border-white text-white hover:scale-105'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Next in Queue ── */}
      {nextTrack && (
        <div className="bg-[#242424] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Next in queue</span>
            <span className="text-spotify-gray hover:text-white cursor-pointer hover:underline">
              Open queue
            </span>
          </div>

          <div
            onClick={() => playTrack(nextTrack)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <img
              src={nextTrack.album?.images?.[0]?.url}
              alt={nextTrack.name}
              className="w-10 h-10 rounded object-cover shrink-0 bg-[#333]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-spotify-green">
                {nextTrack.name}
              </p>
              <p className="text-[11px] text-spotify-gray truncate">
                {nextTrack.artists?.map((a) => a.name).join(', ')}
              </p>
            </div>
            <button className="opacity-0 group-hover:opacity-100 text-white p-1">
              <Play size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
