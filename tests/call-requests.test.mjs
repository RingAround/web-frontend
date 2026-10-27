import test from "node:test";
import assert from "node:assert/strict";
import { makeRequestSchema } from "../lib/request.js";
import { projectSessionActivity } from "../lib/session-activity.js";

const request = {
  serviceDescription: "Ask whether late check-in is available after midnight.",
  serviceCategory: "other",
  location: { savedLocationId: null, label: "", formattedAddress: "" },
  timing: { mode: "asap" },
  arrivalWindow: "any",
  timeZone: "America/Los_Angeles",
  budget: { mode: "unsure" },
  specialInstructions: "",
};
const schema = makeRequestSchema("2026-10-26");

test("requester callbacks cannot supply a destination phone from the browser", () => {
  const parsed = schema.parse({
    ...request,
    destination: {
      mode: "callback",
      phone: "+19995550123",
      name: "Other person",
    },
  });
  assert.deepEqual(parsed.destination, { mode: "callback" });
});

test("direct requests normalize a formatted international number and allow no service address", () => {
  const result = schema.parse({
    ...request,
    destination: {
      mode: "direct",
      name: "  Example Hotel  ",
      phone: "+1 (206) 555-0123",
    },
  });
  assert.deepEqual(result.destination, {
    mode: "direct",
    name: "Example Hotel",
    phone: "+12065550123",
  });
});

test("invalid direct destinations cannot reach the agent", () => {
  for (const destination of [
    { mode: "direct", name: "", phone: "+12065550123" },
    { mode: "direct", name: "Example Hotel", phone: "2065550123" },
    { mode: "direct", name: "Example Hotel", phone: "+123" },
    { mode: "direct", name: "Example Hotel", phone: "+12065550123 ext 4" },
    { mode: "unknown" },
  ])
    assert.equal(schema.safeParse({ ...request, destination }).success, false);
});

test("existing provider-search requests retain their default mode and address validation", () => {
  assert.equal(schema.safeParse(request).success, false);
  const parsed = schema.parse({
    ...request,
    location: {
      ...request.location,
      formattedAddress: "1220 Pine St, Seattle",
    },
  });
  assert.deepEqual(parsed.destination, { mode: "discover" });
});

test("queued instructions become one acknowledged message without exposing the initial brief", () => {
  const brief = {
    id: "brief",
    type: "user.message",
    processed_at: null,
    content: [
      {
        type: "text",
        text: "## Tracking\nRequest reference: req_0123456789abcdef",
      },
    ],
  };
  const queued = {
    id: "reply",
    type: "user.message",
    processed_at: null,
    content: [
      {
        type: "text",
        text: "The hotel is open 24/7; please verify and proceed.",
      },
    ],
  };
  const processed = { ...queued, processed_at: "2026-10-26T12:00:00Z" };
  const result = projectSessionActivity([
    brief,
    { ...brief, processed_at: "2026-10-26T11:59:00Z" },
    queued,
    processed,
    queued,
  ]);
  assert.equal(result.activity.length, 1);
  assert.equal(result.activity[0].id, "reply");
  assert.equal(result.activity[0].at, processed.processed_at);
});

test("an idle agent can still have queued instructions that need continued polling", () => {
  const result = projectSessionActivity([
    {
      id: "idle",
      type: "session.status_idle",
      stop_reason: { type: "end_turn" },
    },
    {
      id: "reply",
      type: "user.message",
      processed_at: null,
      content: [{ type: "text", text: "Please continue." }],
    },
  ]);
  assert.equal(result.idleReason, "end_turn");
  assert(result.activity.some((item) => item.kind === "user" && !item.at));
});
