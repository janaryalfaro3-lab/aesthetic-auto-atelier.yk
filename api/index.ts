import express from "express";
import path from "path";

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
    // Note: Vercel will serve static files via vercel.json rewrites normally,
    // but we keep this for standalone production node runtime.
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Small check to avoid crashing if dist/index.html is missing on Vercel
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(404).send("Frontend not build or routed incorrectly on Vercel backend function.");
        }
      });
    });
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

