# Aesthetic Auto Atelier - Official Website

This is the source code for the Aesthetic Auto Atelier website, featuring a premium UI, AI Chatbot, and Database integration for appointments.

## Deployment Instructions

### 1. Most Recommended: AI Studio Deployment
The easiest way to host this app is using the built-in **Deploy** or **Share** button in the top right of the Google AI Studio interface. This handles the database and server automatically.

### 2. Deploying to Vercel via GitHub
If you prefer using Vercel, follow these steps to avoid build errors:

**A. Correct GitHub Sync (CRITICAL)**
*   **DO NOT** upload a `.zip` file to GitHub manually.
*   In AI Studio, click the **"GitHub"** button in the top right corner.
*   Sign in and choose **"Push"** or **"Sync"**.
*   This will upload the actual source code files (the `src` folder, `index.html`, etc.) so Vercel can see them.

**B. Vercel Configuration**
*   Go to your Vercel Dashboard and import the repository.
*   In **Environment Variables**, add the following:
    *   `DATABASE_URL`: Your Neon connection string.
    *   `GEMINI_API_KEY`: Your Google Gemini API Key.
*   Click **Deploy**.

## Tech Stack
*   React 19 + Vite
*   Tailwind CSS 4
*   Neon (PostgreSQL)
*   Google Gemini AI
*   Express (Server)
