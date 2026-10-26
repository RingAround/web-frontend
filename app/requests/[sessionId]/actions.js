"use server";

import { getSession } from "@/auth";
import { getOwnedSession, sendUserMessage } from "@/lib/agent";
import { MESSAGE_LIMIT } from "./limits";

// Sends the requester's reply or steering note to the agent working on their
// request. Returns { ok } or { error }.
export async function sendMessage(sessionId, text) {
  const userId = (await getSession())?.user?.id;
  if (!userId) return { error: "Your sign-in expired. Sign in again to message the agent." };
  const message = typeof text === "string" ? text.trim() : "";
  if (!message) return { error: "Type a message first." };
  if (message.length > MESSAGE_LIMIT) return { error: `Keep messages under ${MESSAGE_LIMIT} characters.` };

  // Only the requester can steer their own agent.
  const session = await getOwnedSession(sessionId, userId);
  if (!session) return { error: "This request couldn’t be found." };
  if (session.status === "terminated") return { error: "This request has finished, so the agent can’t take messages." };

  try {
    return await sendUserMessage(session.id, message);
  } catch (error) {
    console.error("Failed to send message", session.id, error);
    return { error: "Your message didn’t go through. Try again in a minute." };
  }
}
