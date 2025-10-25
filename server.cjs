// server.cjs
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());                // allow all in dev
app.use(express.json());

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

let appToken = null;
let appTokenExpiry = 0;

async function getAppToken() {
  const now = Date.now();
  if (appToken && now < appTokenExpiry - 60_000) return appToken;

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("TOKEN ERROR:", res.status, txt);
    throw new Error(`Token error ${res.status}`);
  }
  const data = await res.json();
  appToken = data.access_token;
  appTokenExpiry = Date.now() + data.expires_in * 1000;
  console.log("Fetched new app token, expires in", data.expires_in, "s");
  return appToken;
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/search", async (req, res) => {
  try {
    const token = await getAppToken();
    const params = new URLSearchParams({
      q: String(req.query.q || ""),
      type: String(req.query.type || "track"),
      limit: String(req.query.limit || "10"),
    });
    console.log("SEARCH:", params.toString());
    const r = await fetch(`${SPOTIFY_API}/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await r.json();
    if (!r.ok) console.error("SPOTIFY /search ERROR:", r.status, json);
    res.status(r.status).json(json);
  } catch (e) {
    console.error("SEARCH HANDLER ERROR:", e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
