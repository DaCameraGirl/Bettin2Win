import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { ALL_SPORTS, env } from "./config.js";
import { Poller } from "./poller.js";
import { Broadcaster } from "./broadcaster.js";
import { highlightly } from "./highlightly/client.js";
import { isEnrichSport } from "./highlightly/types.js";

const app = express();

// Health endpoint used by CI (odds-health.yml) and uptime checks.
let poller: Poller;
app.get("/health", (_req, res) => {
  res.json({ status: "ok", sports: ALL_SPORTS, providers: poller?.healthReport() ?? [] });
});

// Lightweight REST snapshot for debugging / non-WS clients.
app.get("/api/snapshot/:sport", (req, res) => {
  const sport = req.params.sport as (typeof ALL_SPORTS)[number];
  if (!ALL_SPORTS.includes(sport)) {
    res.status(404).json({ error: "unknown sport" });
    return;
  }
  res.json(poller.snapshot(sport));
});

// Highlightly enrichment: real team standings/records (no odds on Basic plan).
// e.g. GET /api/enrich/nfl/standings?season=2024
app.get("/api/enrich/:sport/standings", async (req, res) => {
  const sport = req.params.sport;
  if (!isEnrichSport(sport)) {
    res.status(404).json({ error: "unsupported sport", supported: ["nfl", "mlb", "nba"] });
    return;
  }
  const season = Number(req.query.season ?? new Date().getFullYear() - 1);
  try {
    res.json(await highlightly.getStandings(sport, season));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "enrichment failed" });
  }
});

const server = createServer(app);
const broadcaster = new Broadcaster(server);

poller = new Poller((message) => broadcaster.broadcast(message));

// Seed each freshly connected browser with the latest snapshots + health.
broadcaster.onConnection((socket) => {
  for (const sport of ALL_SPORTS) {
    socket.send(JSON.stringify({ type: "snapshot", sport, events: poller.snapshot(sport) }));
  }
  socket.send(JSON.stringify({ type: "health", providers: poller.healthReport() }));
});

server.listen(env.port, () => {
  console.log(`[odds-engine] listening on http://localhost:${env.port}`);
  console.log(`[odds-engine] WebSocket at ws://localhost:${env.port}/ws`);
  poller.start();
});

process.on("SIGINT", () => {
  poller.stop();
  server.close(() => process.exit(0));
});
