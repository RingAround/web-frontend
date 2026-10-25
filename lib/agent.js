import Anthropic from "@anthropic-ai/sdk";
import { categoryLabel } from "@/lib/service-categories";
import { describeArrival, describeBudget, describeTiming, timeZoneLabel } from "@/lib/request";
import { listRequests, recordRequest } from "@/lib/db";

// Server-only: reads the API key. Never import this from a client component.

// Hard cap on what one request's session may spend, at list prices, in US
// cents. The session pauses (it is not killed) when it reaches this.
const SESSION_BUDGET_CENTS = "200";

export function isAgentConfigured() {
  return Boolean(
    process.env.CLAUDE_API_KEY &&
      process.env.CLAUDE_AGENT_ID &&
      process.env.CLAUDE_ENVIRONMENT_ID &&
      process.env.CLAUDE_VAULT_ID,
  );
}

// Accounts allowed to start sessions, from ALLOWED_EMAILS (comma or
// whitespace separated). Unset or empty means nobody: this gates real calls
// and real spend, so it fails closed.
function allowedEmails() {
  return new Set(
    (process.env.ALLOWED_EMAILS ?? "")
      .split(/[\s,]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function canStartCalls(email) {
  return isAgentConfigured() && typeof email === "string" && allowedEmails().has(email.trim().toLowerCase());
}

function client() {
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
}

// The first message the agent sees: the validated request plus who it is
// calling on behalf of. Plain labelled lines, so the agent can quote them back
// to a provider word for word.
export function writeBrief(request, profile) {
  const { location, timing, budget } = request;
  const lines = [
    "New quote request. Find providers near the job site, call them, and get quotes.",
    "",
    "## Customer",
    `Name: ${profile.name}`,
    `Callback phone: ${profile.phone}`,
    profile.company ? `Company: ${profile.company}` : null,
    "",
    "## Job",
    `Service: ${request.serviceDescription}`,
    `Category: ${categoryLabel(request.serviceCategory)}`,
    `Address: ${location.formattedAddress}`,
    `When: ${describeTiming(timing)}`,
    describeArrival(request.arrivalWindow) ? `Arrival window: ${describeArrival(request.arrivalWindow)}` : null,
    `Time zone: ${timeZoneLabel(request.timeZone)} (${request.timeZone})`,
    `Budget: ${describeBudget(budget)}`,
    `Special instructions: ${request.specialInstructions || "None"}`,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export async function startRequestSession({ request, profile, userId, email }) {
  const session = await client().beta.sessions.create({
    agent: process.env.CLAUDE_AGENT_ID,
    environment_id: process.env.CLAUDE_ENVIRONMENT_ID,
    vault_ids: [process.env.CLAUDE_VAULT_ID],
    title: request.serviceDescription.slice(0, 120),
    // Who sent it, so a misused callback number can be traced to an account.
    metadata: { user_id: userId, user_email: email },
    budget: { type: "limit", max_list_cost: { amount: SESSION_BUDGET_CENTS, currency: "USD" } },
    initial_events: [{ type: "user.message", content: [{ type: "text", text: writeBrief(request, profile) }] }],
  });
  try {
    await recordRequest(userId, { sessionId: session.id, title: session.title ?? request.serviceDescription.slice(0, 120) });
  } catch (error) {
    // The agent is already running, so don't report failure to the user: the
    // request page still works, it just won't be in their list.
    console.error("Failed to record request", session.id, error);
  }
  return session.id;
}

// The session, or null when it doesn't exist or belongs to someone else.
// Both look the same to the caller so session IDs can't be probed.
export async function getOwnedSession(sessionId, userId) {
  if (!/^sesn_[A-Za-z0-9]+$/.test(sessionId)) return null;
  try {
    const session = await client().beta.sessions.retrieve(sessionId);
    return session.metadata?.user_id === userId ? session : null;
  } catch (error) {
    if (error instanceof Anthropic.NotFoundError) return null;
    throw error;
  }
}

const SHOWN_EVENTS = ["agent.message", "agent.tool_use", "agent.mcp_tool_use", "session.error", "session.status_idle"];

// What the agent has said and done so far, oldest first, flattened for display,
// plus why it last went idle (the session object itself doesn't say).
export async function listActivity(sessionId) {
  const activity = [];
  let idleReason = null;
  for await (const event of client().beta.sessions.events.list(sessionId, { order: "asc", types: SHOWN_EVENTS })) {
    if (event.type === "agent.message") {
      const text = event.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
      if (text) activity.push({ id: event.id, at: event.processed_at, kind: "message", text });
    } else if (event.type === "agent.tool_use" || event.type === "agent.mcp_tool_use") {
      activity.push({ id: event.id, at: event.processed_at, kind: "tool", text: event.name });
    } else if (event.type === "session.error") {
      activity.push({ id: event.id, at: event.processed_at, kind: "error", text: event.error?.message ?? "The agent hit an error." });
    } else if (event.type === "session.status_idle") {
      idleReason = event.stop_reason?.type ?? null;
    }
  }
  return { activity, idleReason };
}

const LIST_SHOW_LIMIT = 50;

async function lastIdleReason(sessionId) {
  const page = await client().beta.sessions.events.list(sessionId, {
    order: "desc",
    types: ["session.status_idle"],
    limit: 1,
  });
  return page.data[0]?.stop_reason?.type ?? null;
}

// The user's most recent requests, newest first, each with its live session
// and the reason it last went idle. `truncated` means older requests exist.
export async function listOwnedSessions(userId) {
  const requests = await listRequests(userId, LIST_SHOW_LIMIT + 1);
  const shown = requests.slice(0, LIST_SHOW_LIMIT);
  const sessions = await Promise.all(
    shown.map(async ({ sessionId }) => {
      try {
        return await client().beta.sessions.retrieve(sessionId);
      } catch (error) {
        if (error instanceof Anthropic.NotFoundError) return null; // deleted on the platform
        throw error;
      }
    }),
  );
  const owned = sessions.filter((session) => session && session.metadata?.user_id === userId);
  const reasons = await Promise.all(owned.map((session) => (session.status === "idle" ? lastIdleReason(session.id) : null)));
  return {
    sessions: owned.map((session, i) => ({ session, idleReason: reasons[i] })),
    truncated: requests.length > LIST_SHOW_LIMIT,
  };
}
