import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function youtubeSearchPlugin(): Plugin {
  return {
    name: 'youtube-search-middleware',
    configureServer(server) {
      server.middlewares.use('/api/yt-search', async (req, res) => {
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const query = url.searchParams.get('q');
          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing query' }));
            return;
          }

          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          const ytRes = await fetch(searchUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });

          if (!ytRes.ok) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'YouTube request failed' }));
            return;
          }

          const html = await ytRes.text();
          // Extract the first video ID from the search results
          const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (match && match[1]) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ videoId: match[1] }));
            return;
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'No video found' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    youtubeSearchPlugin(),
  ],
})

