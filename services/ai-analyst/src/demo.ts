import type { OddsMovement } from "@bettin2win/types";
import { InsightGenerator } from "./index.js";
import { PERSONAS } from "./personas.js";

const sample: OddsMovement = {
  eventId: "demo-1",
  runnerId: "demo-1-r0",
  runnerName: "Silver Comet",
  bookmaker: "best",
  from: 4.0,
  to: 3.4,
  changedAt: new Date().toISOString(),
  direction: "shortening",
};

const generator = new InsightGenerator();

for (const persona of PERSONAS) {
  const insight = await generator.fromMovement(sample, persona);
  console.log(`[${persona}] ${insight.text}`);
}
