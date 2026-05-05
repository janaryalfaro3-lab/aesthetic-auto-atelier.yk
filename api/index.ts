import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Resolve paths relative to the current working directory (project root)
const rootDir = process.cwd();
const distPath = path.join(rootDir, "dist");
const publicPath = path.join(rootDir, "public");

console.log(`[Server] Root: ${rootDir}`);
console.log(`[Server] Dist: ${distPath}`);
console.log(`[Server] Public: ${publicPath}`);

// 1. Static files first - this should handle logo.png, banner.png, videocar.mp4 automatically
// if they exist in /dist or /public
app.use(express.static(distPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

app.use(express.static(publicPath));

// Fallback for assets if they aren't in the usual places
const serveAsset = (req: express.Request, res: express.Response) => {
  const fileName = path.basename(req.path);
  const possiblePaths = [
    path.join(distPath, fileName),
    path.join(publicPath, fileName),
    path.join(rootDir, fileName),
    path.join(rootDir, 'public', fileName)
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`[Server] Found ${fileName} at ${p}`);
      return res.sendFile(p);
    }
  }
  console.error(`[Server] 404: ${fileName} not found`);
  res.status(404).send('Not found');
};

app.get("/logo.png", serveAsset);
app.get("/banner.png", serveAsset);
app.get("/videocar.mp4", serveAsset);

// 2. Logging after static to avoid noise for every asset
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('/assets/')) {
    console.log(`[Request] ${req.method} ${req.url}`);
  }
  next();
});

// 3. API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/debug-files", (req, res) => {
  const distFiles = fs.existsSync(distPath) ? fs.readdirSync(distPath) : ["dist-not-found"];
  const publicFiles = fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : ["public-not-found"];
  res.json({
    distPath,
    publicPath,
    distFiles,
    publicFiles,
    cwd: process.cwd(),
    env: process.env.NODE_ENV
  });
});

// 4. SPA Fallback
app.get("*", (req, res) => {
  // If it looks like a file (has an extension), don't serve index.html for it
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).end();
  }
  
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Please run 'npm run build' to generate frontend assets.");
  }
});

// Always listen on port 3000 in this environment
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


export default app;

