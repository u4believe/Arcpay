/**
 * Base URL for all API calls.
 *
 * Development: leave VITE_API_URL unset (or empty) — Vite's dev proxy
 *   forwards /api/* to localhost:8080 automatically.
 *
 * Production (Vercel / Render / etc.): set VITE_API_URL to the full origin
 *   of your deployed API server, e.g.:
 *     VITE_API_URL=https://arcpay-api.onrender.com
 *
 * The value must NOT have a trailing slash.
 */
const raw = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE: string = raw ? raw.replace(/\/$/, "") : "";
