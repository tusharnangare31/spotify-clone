import React, { useState } from 'react';
import { X, Music } from 'lucide-react';
import { createCustomPlaylist } from '../services/storage';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (playlistId: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = createCustomPlaylist(name);
    setName('');
    onCreated(pl.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#282828] border border-white/10 w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-spotify-gray hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-spotify-green/20 flex items-center justify-center text-spotify-green">
            <Music size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Create playlist</h3>
            <p className="text-xs text-spotify-gray">Save your favorite tracks in one place</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-spotify-gray uppercase mb-2">
              Playlist Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Late Night Gym Beats"
              className="w-full bg-[#3e3e3e] border border-transparent focus:border-white/20 text-white rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-spotify-green transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-white hover:text-spotify-gray transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="bg-spotify-green hover:scale-105 active:scale-95 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-lg cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
