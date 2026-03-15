import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("No URL provided");
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      // Forward safe headers
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
          !["x-frame-options", "content-security-policy", "transfer-encoding", "content-encoding", "strict-transport-security"].includes(lowerKey)
        ) {
          res.setHeader(key, value);
        }
      });

      if (contentType.includes("text/html")) {
        let html = await response.text();
        
        // Basic Ad Blocker: Remove known ad scripts and iframes
        html = html.replace(/<script[^>]*src=["'][^"']*(doubleclick|google-analytics|googlesyndication|popads|adsense)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<iframe[^>]*src=["'][^"']*(doubleclick|googlesyndication|ads)[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi, '');
        
        // Inject base tag to fix relative URLs and add cosmetic ad blocker CSS
        const urlObj = new URL(targetUrl);
        const baseHref = `${urlObj.protocol}//${urlObj.host}/`;
        
        const adBlockCSS = `<style>
          .ad, .ads, .ad-container, .advertisement, [id*="ad-"], [class*="ad-"], [id*="banner"], [class*="banner"] { display: none !important; }
        </style>`;

        const adBlockScript = `<script>
          // Aggressive Popup Blocker
          window.open = function() { console.log('Popup blocked by SageX AdBlocker'); return null; };
          
          // Intercept all clicks to prevent target="_blank" and hidden popups
          document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && target.target === '_blank') {
              target.target = '_self'; // Force open in same frame
            }
          }, true);

          // Override common ad network variables
          window._pop = window.PopAds = window.popunder = function() {};
        </script>`;
        
        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head><base href="${baseHref}">${adBlockCSS}${adBlockScript}`);
        } else {
          html = `<head><base href="${baseHref}">${adBlockCSS}${adBlockScript}</head>` + html;
        }
        res.send(html);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      }
    } catch (error: any) {
      res.status(500).send(`Proxy error: ${error.message}`);
    }
  });

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server: httpServer }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }
}

startServer();
