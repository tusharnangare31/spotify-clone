import React, { useEffect, useState } from 'react';
import { Plus, Heart, ListMusic, Trash2 } from 'lucide-react';
import type { CustomPlaylist } from '../services/storage';
import { getCustomPlaylists, getLikedSongs, deleteCustomPlaylist } from '../services/storage';

interface MobileLibraryViewProps {
  onOpenLikedSongs: () => void;
  onOpenCustomPlaylist: (id: string) => void;
  onOpenArtist: (name: string, id?: string) => void;
  onCreatePlaylist: () => void;
}

export const MobileLibraryView: React.FC<MobileLibraryViewProps> = ({
  onOpenLikedSongs,
  onOpenCustomPlaylist,
  onOpenArtist,
  onCreatePlaylist,
}) => {
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists'>('all');

  const loadData = () => {
    setPlaylists(getCustomPlaylists());
    setLikedCount(getLikedSongs().length);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('spotify_storage_change', loadData);
    return () => {
      window.removeEventListener('spotify_storage_change', loadData);
    };
  }, []);

  const favoriteArtists = [
    {
      id: '4YRxDV8wJFPHPTeXepOstw',
      name: 'Arijit Singh',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200',
    },
    {
      id: '1wRPtKGflJrBx9BmLsSwlU',
      name: 'Pritam',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    },
    {
      id: '5f4tvdWlw3GQFI0fwxYST7',
      name: 'The Weeknd',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    },
  ];

  return (
    <div className="p-4 space-y-5 pb-32 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Your Library</h1>
        <button
          onClick={onCreatePlaylist}
          className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
          title="Create playlist"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-white text-black font-bold'
              : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('playlists')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'playlists'
              ? 'bg-white text-black font-bold'
              : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
          }`}
        >
          Playlists
        </button>
        <button
          onClick={() => setActiveFilter('artists')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'artists'
              ? 'bg-white text-black font-bold'
              : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
          }`}
        >
          Artists
        </button>
      </div>

      {/* Library Items List */}
      <div className="space-y-2">
        {/* Liked Songs Tile */}
        {(activeFilter === 'all' || activeFilter === 'playlists') && (
          <div
            onClick={onOpenLikedSongs}
            className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
          >
            <div className="w-14 h-14 rounded bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0 shadow-md">
              <Heart size={24} fill="white" className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">Liked Songs</h3>
              <p className="text-xs text-[#a7a7a7] mt-0.5">
                Playlist • {likedCount} {likedCount === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>
        )}

        {/* Custom Playlists */}
        {(activeFilter === 'all' || activeFilter === 'playlists') &&
          playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onOpenCustomPlaylist(pl.id)}
              className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors group"
            >
              <div className="w-14 h-14 rounded bg-[#282828] flex items-center justify-center shrink-0 shadow-sm text-spotify-gray group-hover:text-white">
                <ListMusic size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">{pl.name}</h3>
                <p className="text-xs text-[#a7a7a7] mt-0.5 truncate">
                  Playlist • {pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCustomPlaylist(pl.id);
                  loadData();
                }}
                className="p-2 text-spotify-gray hover:text-white hover:bg-white/10 rounded-full transition-colors opacity-70 hover:opacity-100"
                title="Delete playlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

        {/* Favorite Artists */}
        {(activeFilter === 'all' || activeFilter === 'artists') && (
          <div className="pt-2 space-y-2">
            {favoriteArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => onOpenArtist(artist.name, artist.id)}
                className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
              >
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-14 h-14 rounded-full object-cover shrink-0 shadow-sm bg-[#282828]"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">{artist.name}</h3>
                  <p className="text-xs text-[#a7a7a7] mt-0.5">Artist</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};