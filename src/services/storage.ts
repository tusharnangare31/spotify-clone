import type { SpotifyTrack } from '../types/spotify';

const LIKED_STORAGE_KEY = 'spotify_liked_songs';
const PLAYLISTS_STORAGE_KEY = 'spotify_custom_playlists';

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  tracks: SpotifyTrack[];
}

/**
 * Get all liked songs from localStorage
 */
export function getLikedSongs(): SpotifyTrack[] {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a specific track is liked
 */
export function isTrackLiked(trackId?: string): boolean {
  if (!trackId) return false;
  const liked = getLikedSongs();
  return liked.some((t) => t.id === trackId);
}

/**
 * Toggle like status of a track
 */
export function toggleLikeTrack(track: SpotifyTrack): boolean {
  try {
    const liked = getLikedSongs();
    const index = liked.findIndex((t) => t.id === track.id);
    let isNowLiked = false;

    if (index !== -1) {
      liked.splice(index, 1);
      isNowLiked = false;
    } else {
      liked.unshift(track);
      isNowLiked = true;
    }

    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(liked));
    window.dispatchEvent(new Event('spotify_storage_change'));
    return isNowLiked;
  } catch {
    return false;
  }
}

/**
 * Get all custom user playlists
 */
export function getCustomPlaylists(): CustomPlaylist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Create a new custom playlist
 */
export function createCustomPlaylist(name: string, description?: string): CustomPlaylist {
  const playlists = getCustomPlaylists();
  const newPlaylist: CustomPlaylist = {
    id: 'custom-' + Date.now(),
    name: name.trim() || 'My Playlist #' + (playlists.length + 1),
    description: description || 'Created by you',
    createdAt: Date.now(),
    tracks: [],
  };

  playlists.unshift(newPlaylist);
  localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event('spotify_storage_change'));
  return newPlaylist;
}

/**
 * Add a track to a custom playlist
 */
export function addTrackToPlaylist(playlistId: string, track: SpotifyTrack): boolean {
  const playlists = getCustomPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return false;

  if (!playlist.tracks.some((t) => t.id === track.id)) {
    playlist.tracks.push(track);
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    window.dispatchEvent(new Event('spotify_storage_change'));
    return true;
  }
  return false;
}

/**
 * Remove a track from a custom playlist
 */
export function removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
  const playlists = getCustomPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return false;

  playlist.tracks = playlist.tracks.filter((t) => t.id !== trackId);
  localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event('spotify_storage_change'));
  return true;
}

/**
 * Delete a custom playlist
 */
export function deleteCustomPlaylist(playlistId: string): boolean {
  let playlists = getCustomPlaylists();
  playlists = playlists.filter((p) => p.id !== playlistId);
  localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event('spotify_storage_change'));
  return true;
}
