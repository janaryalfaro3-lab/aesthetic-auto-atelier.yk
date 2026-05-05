import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const rootDir = process.cwd();
const distPath = path.resolve(rootDir, "dist");
const publicPath = path.resolve(rootDir, "public");

// 1. Logging middleware
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('/assets/')) {
    console.log(`[Request] ${req.method} ${req.url} - From: ${req.ip}`);
  }
  next();
});

// Debug route to verify file existence
app.get("/api/debug-files", (req, res) => {
  const files = fs.existsSync(distPath) ? fs.readdirSync(distPath) : ["dist-not-found"];
  res.json({
    distPath,
    files,
    cwd: process.cwd()
  });
});

// 2. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const staticOptions = {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
};

// Serve static files with high priority
app.use(express.static(distPath, staticOptions));
app.use(express.static(publicPath, staticOptions));

async function setupAndStart() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode");
    // In production, everything not handled by static above or API goes to index.html
    app.get("*", (req, res) => {
      if (req.path.includes('.') && !req.path.endsWith('.html')) {
        return res.status(404).end();
      }
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Frontend assets not found. Please run 'npm run build' first.");
      }
    });
  }

  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupAndStart();

export default app;

