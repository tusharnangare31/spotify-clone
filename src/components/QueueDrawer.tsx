import { X, Play, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { currentTrack, queue, playTrack, removeFromQueue, clearQueue } = usePlayer();

  if (!isOpen) return null;

  const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
  const upNextTracks =
    currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

  return (
    <aside className="fixed inset-0 z-50 xl:relative xl:inset-auto xl:z-0 w-full xl:w-[320px] bg-[#121212] xl:rounded-lg p-4 flex flex-col overflow-y-auto shrink-0 select-none shadow-xl xl:shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <h3 className="font-bold text-base text-white">Queue</h3>
        <button
          onClick={onClose}
          className="text-spotify-gray hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Close Queue"
        >
          <X size={18} />
        </button>
      </div>

      {/* Now Playing in Queue */}
      {currentTrack && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-spotify-gray uppercase tracking-wider">
            Now playing
          </span>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
            <img
              src={currentTrack.album?.images?.[0]?.url}
              alt={currentTrack.name}
              className="w-12 h-12 rounded object-cover shrink-0 bg-[#222]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-spotify-green truncate">
                {currentTrack.name}
              </p>
              <p className="text-xs text-spotify-gray truncate">
                {currentTrack.artists?.map((a) => a.name).join(', ')}
              </p>
            </div>
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-full bg-spotify-green animate-pulse" />
              <span className="w-0.5 h-2/3 bg-spotify-green animate-pulse delay-75" />
              <span className="w-0.5 h-4/5 bg-spotify-green animate-pulse delay-150" />
            </div>
          </div>
        </div>
      )}

      {/* Next Up */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-spotify-gray uppercase tracking-wider truncate">
            Next up
          </span>
          {upNextTracks.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-[11px] font-bold text-spotify-gray hover:text-white hover:underline transition-colors shrink-0 cursor-pointer"
              title="Clear upcoming songs from queue"
            >
              Clear queue
            </button>
          )}
        </div>

        {upNextTracks.length === 0 ? (
          <div className="py-12 text-center text-spotify-gray space-y-2">
            <Music size={32} className="mx-auto opacity-30" />
            <p className="text-xs">No more tracks in queue.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {upNextTracks.map((track, idx) => {
              const realIndex = currentIndex !== -1 ? currentIndex + 1 + idx : idx;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <span className="text-xs font-mono text-spotify-gray w-4 text-center group-hover:hidden">
                      {idx + 1}
                    </span>
                    <button className="hidden group-hover:block text-white w-4 text-center">
                      <Play size={12} fill="currentColor" />
                    </button>

                    <img
                      src={track.album?.images?.[0]?.url}
                      alt={track.name}
                      className="w-10 h-10 rounded object-cover shrink-0 bg-[#222]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-spotify-green">
                        {track.name}
                      </p>
                      <p className="text-[11px] text-spotify-gray truncate">
                        {track.artists?.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(track.id, realIndex);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-spotify-gray hover:text-white transition-opacity rounded-full hover:bg-white/10 cursor-pointer"
                    title="Remove from queue"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
