import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Resolve paths correctly relative to this file's location in /api
const rootDir = path.resolve(__dirname, "..");
const distPath = path.resolve(rootDir, "dist");
const publicPath = path.resolve(rootDir, "public");

console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
console.log(`[Server] Root Dir: ${rootDir}`);
console.log(`[Server] Dist Path: ${distPath}`);
console.log(`[Server] Public Path: ${publicPath}`);

// 1. Logging middleware
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('/assets/')) {
    console.log(`[Request] ${req.method} ${req.url} - From: ${req.ip}`);
  }
  next();
});

// Helper for explicit file serving with existence checks
const serveFileResiliently = (res: express.Response, fileName: string) => {
  const possiblePaths = [
    path.join(distPath, fileName),
    path.join(publicPath, fileName),
    path.join(rootDir, fileName)
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`[Server] Serving ${fileName} from ${filePath}`);
      if (fileName.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
      return res.sendFile(filePath);
    }
  }

  console.error(`[Server] ERROR: ${fileName} not found in any expected location.`);
  res.status(404).send(`Asset ${fileName} not found`);
};

// Explicit routes for problematic assets as high-priority fallbacks
app.get("/logo.png", (req, res) => serveFileResiliently(res, "logo.png"));
app.get("/videocar.mp4", (req, res) => serveFileResiliently(res, "videocar.mp4"));
app.get("/banner.png", (req, res) => serveFileResiliently(res, "banner.png"));

// Debug route to verify file existence
app.get("/api/debug-files", (req, res) => {
  const distFiles = fs.existsSync(distPath) ? fs.readdirSync(distPath) : ["dist-not-found"];
  const publicFiles = fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : ["public-not-found"];
  res.json({
    env: process.env.NODE_ENV,
    distPath,
    publicPath,
    distFiles,
    publicFiles,
    cwd: process.cwd(),
    __dirname
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

