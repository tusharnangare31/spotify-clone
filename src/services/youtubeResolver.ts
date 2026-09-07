/**
 * Public Piped and Invidious API instances for resolving YouTube video IDs from track names
 */
const RESOLVER_ENDPOINTS = [
  {
    type: 'piped',
    url: (q: string) => `https://api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=videos`,
    extract: (data: any) => {
      const items = data.items || data;
      if (Array.isArray(items) && items.length > 0) {
        // url is usually "/watch?v=VIDEO_ID"
        const match = items[0].url?.match(/v=([^&]+)/);
        return match ? match[1] : null;
      }
      return null;
    }
  },
  {
    type: 'piped',
    url: (q: string) => `https://pipedapi.tokhmi.xyz/search?q=${encodeURIComponent(q)}&filter=videos`,
    extract: (data: any) => {
      const items = data.items || data;
      if (Array.isArray(items) && items.length > 0) {
        const match = items[0].url?.match(/v=([^&]+)/);
        return match ? match[1] : null;
      }
      return null;
    }
  },
  {
    type: 'invidious',
    url: (q: string) => `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
    extract: (data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        return data[0].videoId || null;
      }
      return null;
    }
  },
  {
    type: 'invidious',
    url: (q: string) => `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
    extract: (data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        return data[0].videoId || null;
      }
      return null;
    }
  }
];

// Simple in-memory cache for track queries to avoid duplicate searches
const videoIdCache = new Map<string, string>();

/**
 * Resolve a Spotify song title + artist to a YouTube Video ID
 */
export async function resolveYouTubeVideoId(trackName: string, artistName: string): Promise<string | null> {
  const query = `${trackName} ${artistName} official audio`.trim();
  
  if (videoIdCache.has(query)) {
    return videoIdCache.get(query)!;
  }

  for (const endpoint of RESOLVER_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(endpoint.url(query), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      const videoId = endpoint.extract(data);

      if (videoId && videoId.length >= 8) {
        videoIdCache.set(query, videoId);
        return videoId;
      }
    } catch (e) {
      // Try next endpoint on failure/timeout
      continue;
    }
  }

  // Final fallback: try just the track name
  try {
    const fallbackUrl = `https://api.piped.private.coffee/search?q=${encodeURIComponent(trackName + ' audio')}&filter=videos`;
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      const match = data.items?.[0]?.url?.match(/v=([^&]+)/);
      if (match) {
        videoIdCache.set(query, match[1]);
        return match[1];
      }
    }
  } catch {}

  return null;
}
