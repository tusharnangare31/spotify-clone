import type { SpotifyAlbum, SpotifyPlaylist, SpotifyTrack } from '../types/spotify';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID?.replace(/['"]/g, '').trim() || '';
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET?.replace(/['"]/g, '').trim() || '';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let isSpotifyRestricted = false;

/**
 * Get Spotify OAuth Token
 */
export async function getSpotifyToken(): Promise<string | null> {
  if (isSpotifyRestricted) return null;

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    isSpotifyRestricted = true;
    return null;
  }

  try {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      isSpotifyRestricted = true;
      return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = now + data.expires_in * 1000;
    return data.access_token;
  } catch {
    isSpotifyRestricted = true;
    return null;
  }
}

/**
 * High-res image helper for iTunes fallback
 */
function upscaleArtwork(url?: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';
  return url.replace('100x100bb', '600x600bb');
}

/**
 * Fallback search using iTunes open metadata API
 */
async function itunesSearch(query: string, limit = 15): Promise<{ tracks: SpotifyTrack[]; albums: SpotifyAlbum[] }> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`
    );
    if (!res.ok) return { tracks: [], albums: [] };

    const data = await res.json();
    const tracks: SpotifyTrack[] = (data.results || []).map((item: any) => ({
      id: String(item.trackId),
      name: item.trackName,
      artists: [{ id: String(item.artistId), name: item.artistName }],
      album: {
        id: String(item.collectionId || item.trackId),
        name: item.collectionName || item.trackName,
        images: [{ url: upscaleArtwork(item.artworkUrl100) }],
      },
      duration_ms: item.trackTimeMillis || 210000,
    }));

    // Deduplicate albums
    const seenAlbums = new Set<string>();
    const albums: SpotifyAlbum[] = [];
    for (const t of tracks) {
      if (!seenAlbums.has(t.album.name)) {
        seenAlbums.add(t.album.name);
        albums.push(t.album);
      }
    }

    return { tracks, albums };
  } catch (err) {
    console.error('Fallback search error:', err);
    return { tracks: [], albums: [] };
  }
}

/**
 * Fetch New Releases (with resilient fallback)
 */
export async function getNewReleases(limit = 12): Promise<SpotifyAlbum[]> {
  const token = await getSpotifyToken();
  if (token && !isSpotifyRestricted) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/browse/new-releases?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.albums.items;
      }
      if (res.status === 403) isSpotifyRestricted = true;
    } catch {}
  }

  // Fallback: Curated trending releases
  const fallback = await itunesSearch('Top Hits 2026', limit);
  return fallback.albums;
}

/**
 * Fetch Featured Playlists
 */
export async function getFeaturedPlaylists(limit = 8): Promise<SpotifyPlaylist[]> {
  const token = await getSpotifyToken();
  if (token && !isSpotifyRestricted) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/browse/featured-playlists?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.playlists.items.filter(Boolean);
      }
      if (res.status === 403) isSpotifyRestricted = true;
    } catch {}
  }

  // Fallback Playlists
  return [
    {
      id: 'pl-1',
      name: 'Today’s Top Hits',
      description: 'The biggest songs right now across the globe.',
      images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80' }],
      tracks: { total: 50 },
    },
    {
      id: 'pl-2',
      name: 'Bollywood Butter',
      description: 'Bolly hits from your favorite movies and artists.',
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80' }],
      tracks: { total: 40 },
    },
    {
      id: 'pl-3',
      name: 'Punjabi 101',
      description: 'Ultimate Punjabi party anthems and drill beats.',
      images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80' }],
      tracks: { total: 35 },
    },
    {
      id: 'pl-4',
      name: 'Beast Mode Gym',
      description: 'High adrenaline tracks to lift heavy.',
      images: [{ url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80' }],
      tracks: { total: 45 },
    },
    {
      id: 'pl-5',
      name: 'Chill Lofi Study',
      description: 'Gentle beats for late night focus and relaxation.',
      images: [{ url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80' }],
      tracks: { total: 60 },
    },
    {
      id: 'pl-6',
      name: 'Global Viral 50',
      description: 'The songs exploding everywhere on internet.',
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80' }],
      tracks: { total: 50 },
    },
  ];
}

/**
 * Search Tracks & Albums (Spotify + Zero-Config Fallback)
 */
export async function searchSpotify(query: string): Promise<{
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
}> {
  if (!query.trim()) return { tracks: [], albums: [] };

  const token = await getSpotifyToken();
  if (token && !isSpotifyRestricted) {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album&limit=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        return {
          tracks: data.tracks?.items || [],
          albums: data.albums?.items || [],
        };
      }
      if (res.status === 403) isSpotifyRestricted = true;
    } catch {}
  }

  // Fallback to open search
  return itunesSearch(query, 15);
}

/**
 * Get Playlist Tracks
 */
export async function getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();
  if (token && !isSpotifyRestricted) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.items
          .map((item: any) => item.track)
          .filter((t: any) => Boolean(t && t.id));
      }
    } catch {}
  }

  // Fallback tracks
  const defaultQuery = playlistId.includes('2')
    ? 'Arijit Singh'
    : playlistId.includes('3')
    ? 'Diljit Dosanjh'
    : playlistId.includes('4')
    ? 'Phonk Gym'
    : 'Taylor Swift';

  const res = await itunesSearch(defaultQuery, 20);
  return res.tracks;
}

/**
 * Get Album Tracks (Supports Spotify, iTunes collection lookup, and name search)
 */
export async function getAlbumTracks(albumId: string, albumName?: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();
  if (token && !isSpotifyRestricted) {
    try {
      const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (albumRes.ok) {
        const album = await albumRes.json();
        const tracksRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tracksRes.ok) {
          const data = await tracksRes.json();
          return (data.items || []).map((t: any) => ({
            ...t,
            album: { id: album.id, name: album.name, images: album.images },
          }));
        }
      }
    } catch {}
  }

  // 1. If albumId is numeric, use direct iTunes lookup
  if (/^\d+$/.test(albumId)) {
    try {
      const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`);
      if (lookupRes.ok) {
        const data = await lookupRes.json();
        const rawTracks = (data.results || []).filter((r: any) => r.wrapperType === 'track');
        if (rawTracks.length > 0) {
          return rawTracks.map((item: any) => ({
            id: String(item.trackId),
            name: item.trackName,
            artists: [{ id: String(item.artistId), name: item.artistName }],
            album: {
              id: String(item.collectionId),
              name: item.collectionName || albumName || 'Album',
              images: [{ url: upscaleArtwork(item.artworkUrl100) }],
            },
            duration_ms: item.trackTimeMillis || 210000,
          }));
        }
      }
    } catch {}
  }

  // 2. Lookup by album title if provided
  if (albumName) {
    const res = await itunesSearch(albumName, 25);
    if (res.tracks.length > 0) {
      return res.tracks;
    }
  }

  // 3. Fallback
  const res = await itunesSearch('Latest Hits', 15);
  return res.tracks;
}

/**
 * Curated metadata dictionary for famous artists (Spotify High-Res Avatars)
 */
const ARTIST_PRESETS: Record<string, { image: string; listeners: string; bio: string; related: Array<{ id: string; name: string; image: string }> }> = {
  pritam: {
    image: 'https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca',
    listeners: '51,642,890',
    bio: 'Pritam Chakraborty is an Indian music director, composer, singer, and record producer. With a career spanning over two decades, he has composed music for more than 125 Bollywood films and is one of the most prolific and celebrated composers in modern Indian cinema.',
    related: [
      { id: 'rel-1', name: 'Arijit Singh', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300' },
      { id: 'rel-2', name: 'Shreya Ghoshal', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' },
      { id: 'rel-3', name: 'Vishal-Shekhar', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
      { id: 'rel-4', name: 'Atif Aslam', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
      { id: 'rel-5', name: 'KK', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300' },
      { id: 'rel-6', name: 'Amit Trivedi', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300' },
    ],
  },
  'arijit singh': {
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    listeners: '42,890,120',
    bio: 'Arijit Singh is a globally revered Indian playback singer and music composer who has sung in Hindi, Bengali, and several other languages, widely regarded as one of the defining voices of modern Bollywood romance.',
    related: [
      { id: 'rel-pritam', name: 'Pritam', image: 'https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca' },
      { id: 'rel-2', name: 'Shreya Ghoshal', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' },
      { id: 'rel-4', name: 'Atif Aslam', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
      { id: 'rel-5', name: 'KK', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300' },
    ],
  },
};

/**
 * Get full Artist Profile with Top Tracks, Discography, and Bio
 */
export async function getArtistProfile(artistName: string, artistId?: string): Promise<{
  artist: {
    id: string;
    name: string;
    image: string;
    monthlyListeners: string;
    bio: string;
    verified: boolean;
  };
  topTracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  relatedArtists: Array<{ id: string; name: string; image: string }>;
}> {
  const norm = artistName.toLowerCase().trim();
  const preset = ARTIST_PRESETS[norm] || (artistId === '1wRPtKGflJrBx9BmLsSwlU' ? ARTIST_PRESETS['pritam'] : null);

  const [tracksRes, albumsRes] = await Promise.all([
    itunesSearch(artistName, 15),
    (async () => {
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=12`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || []).map((a: any) => ({
          id: String(a.collectionId),
          name: a.collectionName,
          release_date: a.releaseDate ? a.releaseDate.slice(0, 4) : '2026',
          images: [{ url: upscaleArtwork(a.artworkUrl100) }],
          artists: [{ id: String(a.artistId), name: a.artistName }],
        }));
      } catch {
        return [];
      }
    })(),
  ]);

  const defaultImage =
    tracksRes.tracks[0]?.album?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800';

  return {
    artist: {
      id: artistId || 'artist-' + norm,
      name: artistName,
      image: preset?.image || defaultImage,
      monthlyListeners: preset?.listeners || '18,450,290',
      bio: preset?.bio || `${artistName} is a critically acclaimed recording artist and performer.`,
      verified: true,
    },
    topTracks: tracksRes.tracks.slice(0, 10),
    albums: albumsRes.length > 0 ? albumsRes : tracksRes.albums,
    relatedArtists: preset?.related || [
      { id: 'rel-pritam', name: 'Pritam', image: 'https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca' },
      { id: 'rel-arijit', name: 'Arijit Singh', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300' },
      { id: 'rel-shreya', name: 'Shreya Ghoshal', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' },
    ],
  };
}
