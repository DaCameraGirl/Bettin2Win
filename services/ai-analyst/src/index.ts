import type { AIInsight, OddsMovement } from "@bettin2win/types";
import { PERSONA_PROMPTS, type Persona } from "./personas.js";

export type { Persona } from "./personas.js";
export { PERSONAS, PERSONA_PROMPTS } from "./personas.js";

export interface InsightProvider {
  readonly name: string;
  explain(movement: OddsMovement, persona: Persona): Promise<string>;
}

/**
 * Default provider: deterministic templated explanations, no external API.
 * Swap this for an LLM-backed provider (Claude, etc.) by implementing
 * {@link InsightProvider} and reading AI_API_KEY. The template provider keeps
 * the app fully functional and free with zero credentials.
 */
export class TemplateProvider implements InsightProvider {
  readonly name = "template";

  async explain(movement: OddsMovement, persona: Persona): Promise<string> {
    const pct = Math.abs(((movement.to - movement.from) / movement.from) * 100).toFixed(1);
    const impliedFrom = (100 / movement.from).toFixed(1);
    const impliedTo = (100 / movement.to).toFixed(1);
    const verb = movement.direction === "shortening" ? "shortened" : "drifted";

    switch (persona) {
      case "casual":
        return `${movement.runnerName} ${verb} - the market now likes them ${
          movement.direction === "shortening" ? "more" : "less"
        } than a moment ago.`;
      case "bettor":
        return `${movement.runnerName} ${verb} from ${movement.from.toFixed(2)} to ${movement.to.toFixed(
          2,
        )} (${pct}% move). ${movement.direction === "shortening" ? "Looks like steam." : "Could be value if you liked them earlier."}`;
      case "fantasy":
        return `${movement.runnerName} is trending ${
          movement.direction === "shortening" ? "up" : "down"
        } - worth a second look before you lock your lineup.`;
      case "analyst":
        return `${movement.runnerName}: ${movement.from.toFixed(2)} -> ${movement.to.toFixed(
          2,
        )} (${pct}%), implied probability ${impliedFrom}% -> ${impliedTo}%.`;
    }
  }
}

export class InsightGenerator {
  constructor(private readonly provider: InsightProvider = new TemplateProvider()) {}

  async fromMovement(movement: OddsMovement, persona: Persona = "casual"): Promise<AIInsight> {
    const text = await this.provider.explain(movement, persona);
    return {
      eventId: movement.eventId,
      runnerId: movement.runnerId,
      persona,
      text,
      generatedAt: new Date().toISOString(),
    };
  }
}

/** Re-exported for callers that want to inspect available prompt templates. */
export { PERSONA_PROMPTS as personaPrompts };
export type { OddsMovement } from "@bettin2win/types";
export type { AIInsight } from "@bettin2win/types";
export const _personaPromptKeys = Object.keys(PERSONA_PROMPTS) as Persona[];
