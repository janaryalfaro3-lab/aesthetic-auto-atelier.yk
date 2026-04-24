import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import postgres from "postgres";

const app = express();
const PORT = 3000;

// Initialize Neon connection lazily
let sql: ReturnType<typeof postgres> | null = null;

function getSql() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }
    sql = postgres(connectionString, { ssl: "require" });
  }
  return sql;
}

// Database Initialization
async function initDb() {
  try {
    const db = getSql();
    await db`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        service TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        location TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Database initialized");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

// API Routes
app.get("/api/db-test", async (req, res) => {
  try {
    const db = getSql();
    const result = await db`SELECT NOW() as now`;
    res.json({ success: true, timestamp: result[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: "Not Connected" });
  }
});

app.post("/api/appointments", express.json(), async (req, res) => {
  try {
    const db = getSql();
    const { fullName, phone, email, service, vehicleType, location, date, time } = req.body;
    
    const result = await db`
      INSERT INTO appointments (full_name, phone, email, service, vehicle_type, location, booking_date, booking_time)
      VALUES (${fullName}, ${phone}, ${email}, ${service}, ${vehicleType}, ${location}, ${date}, ${time})
      RETURNING id
    `;
    
    res.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Failed to save appointment:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

async function setupAndStart() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only start listening if not being called by a test runner or Vercel
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Attempt DB init in background
      if (process.env.DATABASE_URL) {
        console.log("Attempting to initialize database...");
        try {
          await initDb();
        } catch (err) {
          console.error("Delayed DB initialization failed:", err);
        }
      }
    });
  }
}

setupAndStart();

export default app;

