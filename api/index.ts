import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from /dist at the very beginning
const rootDir = process.cwd();
const distPath = path.resolve(rootDir, "dist");

console.log(`[Server] Static Root: ${distPath}`);

// API routes next
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/debug-paths", (req, res) => {
  const files = fs.existsSync(distPath) ? fs.readdirSync(distPath) : ["dist-not-found"];
  res.json({
    processCwd: rootDir,
    __dirname,
    distPath,
    distFiles: files,
    publicDir: path.resolve(rootDir, "public"),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    }
  });
});

// Explicit routes for problematic assets (as a backup)
app.get("/logo.png", (req, res, next) => {
  const logoPath = path.join(distPath, "logo.png");
  if (fs.existsSync(logoPath)) {
    return res.sendFile(logoPath);
  }
  next();
});

app.get("/videocar.mp4", (req, res, next) => {
  const videoPath = path.join(distPath, "videocar.mp4");
  if (fs.existsSync(videoPath)) {
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    return res.sendFile(videoPath);
  }
  next();
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
      // Serve static files from /dist
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Accept-Ranges', 'bytes');
          }
        }
      }));

      // Fallback to index.html for SPA routing
      app.get("*", (req, res) => {
        // If the request looks like a file (has an extension), but wasn't found by express.static, 
        // don't serve index.html, just 404
        if (req.path.includes('.') && !req.path.endsWith('.html')) {
          console.log(`[Server] 404 for asset: ${req.path}`);
          return res.status(404).end();
        }
        res.sendFile(path.resolve(distPath, "index.html"), (err) => {
          if (err) {
            console.error(`[Server] Failed to serve index.html: ${err.message}`);
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

