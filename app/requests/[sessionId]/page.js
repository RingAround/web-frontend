import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getOwnedSession, isAgentConfigured, listActivity } from "@/lib/agent";
import { AppHeader } from "@/components/app-header";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import AutoRefresh from "./auto-refresh";

export const metadata = {
  title: "Your request — RingAround",
  robots: { index: false, follow: false },
};

// Session status -> what the requester sees. `idle` covers both "finished this
// turn" and "paused", so its stop reason picks the wording.
function describeStatus(session, reason) {
  if (session.status === "running") return { label: "Working on it", tone: "signal", live: true };
  if (session.status === "rescheduling") return { label: "Reconnecting", tone: "amber", live: true };
  if (session.status === "terminated") return { label: "Stopped", tone: "ink", live: false };
  if (reason === "retries_exhausted" || reason === "refusal") return { label: "Stopped — the agent couldn’t continue", tone: "ink", live: false };
  if (reason === "budget_reached") return { label: "Paused — spending limit reached", tone: "amber", live: false };
  if (reason === "requires_action") return { label: "Waiting on an approval", tone: "amber", live: false };
  return { label: "Done for now", tone: "sage", live: false };
}

const TONES = {
  signal: "bg-signal-soft text-signal",
  amber: "bg-amber-soft text-amber",
  sage: "bg-sage-soft text-sage",
  ink: "bg-ink/10 text-ink-soft",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

async function RequestStatus({ params }) {
  const { sessionId } = await params;
  const authSession = await getSession();
  if (!authSession?.user?.id) redirect("/sign-in");
  if (!isAgentConfigured()) notFound();

  const session = await getOwnedSession(sessionId, authSession.user.id);
  if (!session) notFound();
  const { activity, idleReason } = await listActivity(session.id);
  const status = describeStatus(session, idleReason);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      {status.live && <AutoRefresh seconds={5} />}
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Request</p>
      <h1 className="mt-3 break-words font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        {session.title || "Your quote request"}
      </h1>
      <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${TONES[status.tone]}`}>
          {status.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />}
          {status.label}
        </span>
        <span>Started {new Date(session.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
      </p>

      <section aria-labelledby="activity-heading" className="mt-10">
        <h2 id="activity-heading" className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          Activity
        </h2>
        {activity.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-surface/60 p-5 text-ink-soft">
            The agent is getting started. Updates appear here as it works.
          </p>
        ) : (
          <ol className="mt-4 space-y-3" aria-live="polite">
            {activity.map((item) => (
              <li key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl border border-line bg-surface/60 p-5">
                <time dateTime={item.at} className="font-mono text-xs text-ink-soft">
                  {formatTime(item.at)}
                </time>
                {item.kind === "message" && <p className="whitespace-pre-wrap break-words">{item.text}</p>}
                {item.kind === "tool" && <p className="text-sm text-ink-soft">Used {item.text}</p>}
                {item.kind === "error" && (
                  <p role="alert" className="text-sm text-signal">
                    {item.text}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-10 border-t border-line pt-6">
        <Link href="/requests/new" className="font-medium underline-offset-4 hover:underline">
          Start another request
        </Link>
      </div>
    </div>
  );
}

export default function RequestPage({ params }) {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="Your request">
        <Suspense fallback={<AccountNavigationFallback />}>
          <AccountNavigation />
        </Suspense>
      </AppHeader>
      <main className="flex-1">
        <Suspense fallback={<p role="status" className="px-6 py-16 text-center text-ink-soft">Loading your request…</p>}>
          <RequestStatus params={params} />
        </Suspense>
      </main>
    </div>
  );
}
