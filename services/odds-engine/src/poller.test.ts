import { test } from "node:test";
import assert from "node:assert/strict";
import type { AdapterResult, SportAdapter } from "./adapters/base.js";
import { adapters } from "./adapters/index.js";
import { Poller } from "./poller.js";
import type { SportEvent, SportKey, WebSocketMessage } from "@bettin2win/types";

test("poller removes stale sport events when a fallback source replaces them", async () => {
  const original = adapters.baseball;
  const responses: AdapterResult[] = [
    { mode: "mock", events: [event("old-demo")] },
    { mode: "live", events: [event("real-live")] },
  ];
  adapters.baseball = {
    sport: "baseball",
    provider: "test-baseball",
    hasCredentials: () => true,
    fetchEvents: async () => responses.shift() ?? { mode: "live", events: [] },
  } satisfies SportAdapter;

  try {
    const messages: WebSocketMessage[] = [];
    const poller = new Poller((message) => messages.push(message));
    const poll = (poller as unknown as { poll: (sport: SportKey) => Promise<void> }).poll;

    await poll.call(poller, "baseball");
    assert.deepEqual(
      poller.snapshot("baseball").map((e) => e.id),
      ["old-demo"],
    );

    await poll.call(poller, "baseball");
    assert.deepEqual(
      poller.snapshot("baseball").map((e) => e.id),
      ["real-live"],
    );
  } finally {
    adapters.baseball = original;
  }
});

function event(id: string): SportEvent {
  return {
    id,
    sport: "baseball",
    name: `${id} Away @ ${id} Home`,
    startTime: "2026-06-18T17:35:00.000Z",
    status: "live",
    source: "test",
    runners: [],
  };
}
