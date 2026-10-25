"use server";

import { getSession } from "@/auth";
import { canStartCalls, startRequestSession } from "@/lib/agent";
import { makeRequestSchema, todayIn } from "@/lib/request";
import { userProfileSchema } from "@/lib/user-profile";

// Starts the agent on a reviewed request. Returns { sessionId }, { needsAccount }
// for accounts that aren't approved to call yet, or { error }.
export async function sendRequest({ request, profile }) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Your sign-in expired. Sign in again to send this request." };
  // The page hides the button for unapproved accounts; this is the check that counts.
  if (!canStartCalls(session.user.email)) return { needsAccount: true };

  // Re-validate: everything from the browser is untrusted, including what the
  // form already checked. "Today" is the job site's date, as the form uses.
  const timeZone = typeof request?.timeZone === "string" ? request.timeZone : "UTC";
  const parsedRequest = makeRequestSchema(todayIn(timeZone)).safeParse(request);
  const parsedProfile = userProfileSchema.safeParse(profile);
  if (!parsedRequest.success || !parsedProfile.success) {
    return { error: "Some details are missing or out of date. Edit the request and try again." };
  }

  try {
    const sessionId = await startRequestSession({
      request: parsedRequest.data,
      profile: parsedProfile.data,
      userId: session.user.id,
      email: session.user.email,
    });
    return { sessionId };
  } catch (error) {
    console.error("Failed to start agent session", error);
    return { error: "We couldn’t start the agent. Nothing was sent — try again in a minute." };
  }
}
