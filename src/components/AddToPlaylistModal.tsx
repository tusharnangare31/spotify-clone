import React, { useEffect, useState } from 'react';
import { X, Plus, Check, ListMusic } from 'lucide-react';
import type { SpotifyTrack } from '../types/spotify';
import type { CustomPlaylist } from '../services/storage';
import { getCustomPlaylists, addTrackToPlaylist } from '../services/storage';

interface AddToPlaylistModalProps {
  track: SpotifyTrack | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateNewPlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose,
  onCreateNewPlaylist,
}) => {
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const list = getCustomPlaylists();
      setPlaylists(list);
      if (track) {
        const map: Record<string, boolean> = {};
        list.forEach((p) => {
          map[p.id] = p.tracks.some((t) => t.id === track.id);
        });
        setAddedMap(map);
      }
    }
  }, [isOpen, track]);

  if (!isOpen || !track) return null;

  const handleToggleAdd = (playlistId: string) => {
    if (!track) return;
    const success = addTrackToPlaylist(playlistId, track);
    if (success) {
      setAddedMap((prev) => ({ ...prev, [playlistId]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#282828] border border-white/10 w-full max-w-sm rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-spotify-gray hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Add to playlist</h3>
        <p className="text-xs text-spotify-gray truncate mb-4">
          {track.name} • {track.artists?.map((a) => a.name).join(', ')}
        </p>

        {/* Create new playlist button */}
        <button
          onClick={() => {
            onClose();
            onCreateNewPlaylist();
          }}
          className="w-full mb-4 flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-white/20 hover:border-spotify-green hover:text-spotify-green text-sm font-semibold transition-all"
        >
          <Plus size={18} />
          <span>New Playlist</span>
        </button>

        {/* Playlists list */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {playlists.length === 0 ? (
            <p className="text-xs text-spotify-gray text-center py-4">
              No custom playlists yet. Create one above!
            </p>
          ) : (
            playlists.map((p) => {
              const isAdded = addedMap[p.id];
              return (
                <div
                  key={p.id}
                  onClick={() => handleToggleAdd(p.id)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-white/10 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-spotify-gray group-hover:text-white shrink-0">
                      <ListMusic size={16} />
                    </div>
                    <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                  </div>

                  <div className="shrink-0">
                    {isAdded ? (
                      <span className="text-spotify-green flex items-center gap-1 text-xs font-bold">
                        <Check size={16} /> Added
                      </span>
                    ) : (
                      <Plus size={18} className="text-spotify-gray group-hover:text-white" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
