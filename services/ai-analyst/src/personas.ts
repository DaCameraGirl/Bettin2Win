/** Each persona shapes how an insight is phrased for a different kind of fan. */
export type Persona = "casual" | "bettor" | "fantasy" | "analyst";

export const PERSONA_PROMPTS: Record<Persona, string> = {
  casual:
    "Explain in one friendly sentence, no jargon, like talking to a new fan.",
  bettor:
    "Focus on value vs market price and whether the move looks like steam or drift.",
  fantasy:
    "Frame it around player/runner upside and roster decisions.",
  analyst:
    "Be precise and quantitative: cite the price change and implied probability shift.",
};

export const PERSONAS: Persona[] = Object.keys(PERSONA_PROMPTS) as Persona[];
