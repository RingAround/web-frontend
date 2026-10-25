"use server";

import { auth, isAuthConfigured } from "@/auth";
import { isAgentConfigured, startRequestSession } from "@/lib/agent";
import { makeRequestSchema, toISODate } from "@/lib/request";
import { userProfileSchema } from "@/lib/user-profile";

const DAY_MS = 24 * 60 * 60 * 1000;

// The form validates against the requester's local date; accept that date only
// when it is plausibly "today" somewhere (UTC-12 to UTC+14).
function plausibleToday(today) {
  const now = Date.now();
  const candidates = [toISODate(new Date(now - DAY_MS)), toISODate(new Date(now)), toISODate(new Date(now + DAY_MS))];
  return candidates.includes(today) ? today : toISODate(new Date(now));
}

// Starts the agent on a reviewed request. Returns { sessionId } or { error }.
export async function sendRequest({ request, profile, today }) {
  const session = isAuthConfigured() ? await auth() : null;
  if (!session?.user?.id) return { error: "Your sign-in expired. Sign in again to send this request." };
  if (!isAgentConfigured()) return { error: "Calling isn’t switched on for this site yet." };

  // Re-validate: everything from the browser is untrusted, including what the
  // form already checked.
  const parsedRequest = makeRequestSchema(plausibleToday(today)).safeParse(request);
  const parsedProfile = userProfileSchema.safeParse(profile);
  if (!parsedRequest.success || !parsedProfile.success) {
    return { error: "Some details are missing or out of date. Edit the request and try again." };
  }

  try {
    const sessionId = await startRequestSession({
      request: parsedRequest.data,
      profile: parsedProfile.data,
      userId: session.user.id,
    });
    return { sessionId };
  } catch (error) {
    console.error("Failed to start agent session", error);
    return { error: "We couldn’t start the agent. Nothing was sent — try again in a minute." };
  }
}
