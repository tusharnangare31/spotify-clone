/**
 * Robust YouTube video ID resolver for Spotify tracks
 */

// Title sanitization to strip soundtrack, feature, and release tags that confuse search engines
export function cleanTrackTitle(title: string): string {
  if (!title) return '';
  return title
    // Remove (From "...") or [From "..."]
    .replace(/\s*[\(\[](?:from|soundtrack|feat|featuring|remastered|version|remix|audio|original|motion picture)[\s\S]*?[\)\]]/gi, '')
    // Remove quotes
    .replace(/["'“”]/g, '')
    // Remove trailing dashes e.g. "Song - Remastered"
    .replace(/\s*-\s*(?:remastered|single|bonus track|live|soundtrack|version).*$/gi, '')
    .trim();
}

// Instant cache for top trending & Bollywood/Pop tracks to avoid waiting
const CURATED_TRACK_IDS: Record<string, string> = {
  'chaleya': 'VAdGW7QDJiU',
  'kesariya': 'BddP6PYo2gs',
  'tum hi ho': 'IJq0yyWug1k',
  'apna bana le': 'u2NAus-VO8A',
  'o maahi': '8vdNKq3n890',
  'raataan lambiyan': 'gvyUuxdRdR4',
  'shayad': 'b4OzS1O-n7Y',
  'deva deva': 'Vzst_h0Tz94',
  'satranga': 'HR5x256oJqA',
  'channa mereya': 'bzSTpdcs-EI',
  'gerua': 'AEIVhBS63RI',
  'hawayein': 'cYOB941gyXI',
  'kalank': 'Grr0Exhy-lQ',
  'pee loon': 'i0u53wR-4G8',
  'subhanallah': 'm-t3h4Yj_w4',
  'kabira': 'jHNNMj5bNQw',
  'illahi': 'fdubeMFwuGs',
  'badtameez dil': 'II2EO3NwUrQ',
  'agar tum saath ho': 'sK7riqg2mr4',
  'ae dil hai mushkil': '6FURuLYrR_Q',
  'bulleya': 'hXh35C24sF4',
  'tere vaaste': 'EGqQXvgf_pY',
  'lut gaye': 'sCBBnG_H78A',
  'heeriye': 'RLzC55ai0eo',
};

// In-memory runtime cache
const videoIdCache = new Map<string, string>();

/**
 * Resolve a Spotify song title + artist to a YouTube Video ID
 */
export async function resolveYouTubeVideoId(trackName: string, artistName: string): Promise<string | null> {
  const cleanedTitle = cleanTrackTitle(trackName);
  const primaryArtist = artistName.split(',')[0].trim();
  const cacheKey = `${trackName.toLowerCase()}::${artistName.toLowerCase()}`;

  // 1. Check in-memory cache
  if (videoIdCache.has(cacheKey)) {
    return videoIdCache.get(cacheKey)!;
  }

  // 2. Check curated instant hit map
  const normalizedClean = cleanedTitle.toLowerCase();
  if (CURATED_TRACK_IDS[normalizedClean]) {
    const id = CURATED_TRACK_IDS[normalizedClean];
    videoIdCache.set(cacheKey, id);
    return id;
  }

  // Search queries in prioritized order
  const queries = [
    `${cleanedTitle} ${primaryArtist} official audio`,
    `${cleanedTitle} ${primaryArtist}`,
    `${trackName} ${primaryArtist}`,
    `${cleanedTitle} song`
  ];

  // 3. Try local Vite server API first (fastest, most reliable, no CORS issues)
  for (const q of queries.slice(0, 2)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.videoId && data.videoId.length >= 8) {
          videoIdCache.set(cacheKey, data.videoId);
          return data.videoId;
        }
      }
    } catch {
      // Local endpoint not responding or aborted, fall through to public APIs
    }
  }

  // 4. Try public Piped / Invidious fallback instances
  const publicEndpoints = [
    (q: string) => `https://api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=videos`,
  ];

  for (const q of queries) {
    for (const getUrl of publicEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(getUrl(q), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          const match = items[0].url?.match(/v=([^&]+)/) || items[0].videoId;
          const videoId = typeof match === 'string' ? match : (match ? match[1] : null);
          if (videoId && videoId.length >= 8) {
            videoIdCache.set(cacheKey, videoId);
            return videoId;
          }
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}
