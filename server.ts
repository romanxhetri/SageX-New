import express from "express";
import { createServer as createViteServer } from "vite";

const isBlockedHostname = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(normalized)) return true;

  // Basic private-network protections for proxy SSRF
  return (
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use raw body parser for the proxy route to forward exact payloads
  app.all("/api/proxy", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("No URL provided");
    }

    try {
      const urlObj = new URL(targetUrl);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return res.status(400).send("Only HTTP(S) URLs are supported");
      }
      if (isBlockedHostname(urlObj.hostname)) {
        return res.status(403).send("Target host is not allowed");
      }

      // Forward client headers, especially cookies and content-type
      const headersToForward: Record<string, string> = {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "en-US,en;q=0.9",
        "Referer": urlObj.origin,
        "Origin": urlObj.origin,
      };

      if (req.headers["cookie"]) headersToForward["cookie"] = req.headers["cookie"] as string;
      if (req.headers["content-type"]) headersToForward["content-type"] = req.headers["content-type"] as string;
      if (req.headers["authorization"]) headersToForward["authorization"] = req.headers["authorization"] as string;

      const fetchOptions: RequestInit = {
        method: req.method,
        headers: headersToForward,
        redirect: 'manual', // Handle redirects manually to rewrite them
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      };

      const response = await fetch(targetUrl, fetchOptions);

      // Handle Redirects (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          const absoluteLocation = new URL(location, targetUrl).href;
          return res.redirect(response.status, `/api/proxy?url=${encodeURIComponent(absoluteLocation)}`);
        }
      }

      const contentType = response.headers.get("content-type") || "";

      // Forward safe headers
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
          !["x-frame-options", "content-security-policy", "transfer-encoding", "content-encoding", "strict-transport-security", "access-control-allow-origin"].includes(lowerKey)
        ) {
          res.setHeader(key, value);
        }
      });

      // Handle Cookies: Rewrite domain and secure flags so they work on our proxy
      if (response.headers.getSetCookie) {
        const cookies = response.headers.getSetCookie();
        cookies.forEach(cookie => {
          let newCookie = cookie
            .replace(/Domain=[^;]+;?/i, '')
            .replace(/SameSite=[^;]+;?/i, 'SameSite=Lax;')
            .replace(/Secure;?/i, '');
          res.append('Set-Cookie', newCookie);
        });
      }

      // Enable CORS for the proxy
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (contentType.includes("text/html")) {
        let html = await response.text();
        
        // Base tag for relative assets
        const baseHref = `${urlObj.protocol}//${urlObj.host}/`;

        // Rewrite URLs in HTML
        const rewriteUrl = (url: string) => {
          if (!url || url.startsWith("data:") || url.startsWith("javascript:") || url.startsWith("#")) return url;
          try {
            const absoluteUrl = new URL(url, targetUrl).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          } catch (e) {
            return url;
          }
        };

        // Replace src, href, action attributes
        html = html.replace(/(src|href|action)=["']([^"']+)["']/gi, (match, attr, url) => {
          return `${attr}="${rewriteUrl(url)}"`;
        });

        // Basic Ad Blocker
        html = html.replace(/<script[^>]*src=["'][^"']*(doubleclick|google-analytics|googlesyndication|popads|adsense)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<iframe[^>]*src=["'][^"']*(doubleclick|googlesyndication|ads)[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi, '');
        
        const adBlockCSS = `<style>
          .ad, .ads, .ad-container, .advertisement, [id*="ad-"], [class*="ad-"], [id*="banner"], [class*="banner"] { display: none !important; }
        </style>`;

        const proxyScript = `<script>
          // Intercept all clicks to prevent target="_blank"
          document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && target.target === '_blank') {
              target.target = '_self'; 
            }
          }, true);

          // Intercept Form Submissions for Login/Signup
          document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form && form.action && !form.action.includes('/api/proxy')) {
              form.action = '/api/proxy?url=' + encodeURIComponent(new URL(form.action, "${targetUrl}").href);
            }
          }, true);

          // Inject proxy into fetch
          const originalFetch = window.fetch;
          window.fetch = function(input, init) {
            let url = typeof input === 'string' ? input : input.url;
            if (url && !url.startsWith('data:') && !url.startsWith('blob:') && !url.includes('/api/proxy')) {
              const proxiedUrl = "/api/proxy?url=" + encodeURIComponent(new URL(url, "${targetUrl}").href);
              if (typeof input === 'string') {
                input = proxiedUrl;
              } else {
                input = new Request(proxiedUrl, input);
              }
            }
            return originalFetch(input, init);
          };

          // Inject proxy into XMLHttpRequest
          const origOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
              if (typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:') && !url.includes('/api/proxy')) {
                  url = '/api/proxy?url=' + encodeURIComponent(new URL(url, "${targetUrl}").href);
              }
              return origOpen.call(this, method, url, async, user, password);
          };
          
          // Override pushState/replaceState to prevent URL breakage in SPAs
          const origPushState = history.pushState;
          history.pushState = function(state, title, url) {
              if (url && typeof url === 'string' && !url.includes('/api/proxy')) {
                  url = '/api/proxy?url=' + encodeURIComponent(new URL(url, "${targetUrl}").href);
              }
              return origPushState.call(this, state, title, url);
          };
          const origReplaceState = history.replaceState;
          history.replaceState = function(state, title, url) {
              if (url && typeof url === 'string' && !url.includes('/api/proxy')) {
                  url = '/api/proxy?url=' + encodeURIComponent(new URL(url, "${targetUrl}").href);
              }
              return origReplaceState.call(this, state, title, url);
          };
        </script>`;
        
        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head><base href="${baseHref}">${adBlockCSS}${proxyScript}`);
        } else {
          html = `<head><base href="${baseHref}">${adBlockCSS}${proxyScript}</head>` + html;
        }
        res.send(html);
      } else if (contentType.includes("text/css")) {
        let css = await response.text();
        // Rewrite URLs in CSS (url(...) functions)
        css = css.replace(/url\(["']?([^"'\)]+)["']?\)/gi, (match, url) => {
          if (url.startsWith("data:")) return match;
          try {
            const absoluteUrl = new URL(url, targetUrl).href;
            return `url("/api/proxy?url=${encodeURIComponent(absoluteUrl)}")`;
          } catch (e) {
            return match;
          }
        });
        res.send(css);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      }
    } catch (error: any) {
      console.error("Proxy error:", error);
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
