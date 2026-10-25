import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getOwnedSession, isAgentConfigured, listActivity } from "@/lib/agent";
import { AppHeader } from "@/components/app-header";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import { StatusPill, describeStatus, formatStarted } from "../status";
import AutoRefresh from "../auto-refresh";

export const metadata = {
  title: "Your request — RingAround",
  robots: { index: false, follow: false },
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
        <StatusPill status={status} />
        <span>Started {formatStarted(session.created_at)}</span>
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
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/requests" className="font-medium underline-offset-4 hover:underline">
            All your requests
          </Link>
          <Link href="/requests/new" className="font-medium underline-offset-4 hover:underline">
            Start another request
          </Link>
        </div>
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
