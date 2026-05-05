import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API Routes (Synchronous registration)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function setupAndStart() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    // Dynamic import vite only for local development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production (AI Studio Managed) or Vercel Proxy
    // Note: On Vercel, static files are served via the edge network, not this function.
    if (!process.env.VERCEL) {
      // Use __dirname for more reliable path resolution in different environments
      const distPath = path.resolve(__dirname, "..", "dist");
      
      // Serve static files from /dist
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true,
        setHeaders: (res, path) => {
          if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
          }
        }
      }));

      // Fallback to index.html for SPA routing
      app.get("*", (req, res) => {
        // If the request looks like a file (has an extension), but wasn't found by express.static, 
        // don't serve index.html, just 404
        if (req.path.includes('.') && !req.path.endsWith('.html')) {
          return res.status(404).end();
        }
        res.sendFile(path.resolve(distPath, "index.html"), (err) => {
          if (err) {
            res.status(404).send("Frontend assets not found.");
          }
        });
      });
    }
  }

  // Skip listening if running on Vercel
  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupAndStart();

export default app;

