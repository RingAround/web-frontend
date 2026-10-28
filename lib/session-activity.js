// The event history may contain queued and processed versions of the same
// message. Keep one entry, preferring the processed acknowledgement.
export function projectSessionActivity(events) {
  const unique = new Map();
  for (const event of events) {
    const existing = unique.get(event.id);
    if (!existing?.processed_at || event.processed_at)
      unique.set(event.id, event);
  }
  const activity = [];
  let idleReason = null;
  let seenBrief = false;
  for (const event of unique.values()) {
    const text = (event.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    if (event.type === "user.message") {
      if (
        !seenBrief &&
        text.includes("## Tracking") &&
        text.includes("Request reference:")
      ) {
        seenBrief = true;
        continue;
      }
      activity.push({
        id: event.id,
        at: event.processed_at ?? null,
        kind: "user",
        text,
      });
    } else if (event.type === "agent.message" && text) {
      activity.push({
        id: event.id,
        at: event.processed_at,
        kind: "agent",
        text,
      });
    } else if (event.type === "session.error") {
      activity.push({
        id: event.id,
        at: event.processed_at,
        kind: "error",
        text: event.error?.message ?? "The agent encountered an error.",
      });
    } else if (event.type === "session.status_idle") {
      idleReason = event.stop_reason?.type ?? null;
    }
  }
  return { activity, idleReason };
}
