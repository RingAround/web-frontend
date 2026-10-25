import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { isAgentConfigured, listOwnedSessions } from "@/lib/agent";
import { AppHeader } from "@/components/app-header";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import { Arrow } from "@/components/icons";
import { StatusPill, describeStatus, formatStarted } from "./status";
import AutoRefresh from "./auto-refresh";

export const metadata = {
  title: "Your requests — RingAround",
  robots: { index: false, follow: false },
};

async function RequestList() {
  // Per request: the list depends on who's signed in.
  await connection();
  const authSession = await getSession();
  if (!authSession?.user?.id) redirect("/sign-in");

  const { sessions, truncated } = isAgentConfigured()
    ? await listOwnedSessions(authSession.user.id)
    : { sessions: [], truncated: false };
  const rows = sessions.map(({ session, idleReason }) => ({ session, status: describeStatus(session, idleReason) }));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      {rows.some((row) => row.status.live) && <AutoRefresh seconds={10} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Requests</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-tight">Your requests</h1>
        </div>
        <Link
          href="/requests/new"
          className="group inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 font-medium text-white transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
        >
          New request <Arrow />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-line bg-surface/60 p-8">
          <p className="font-medium">No requests yet.</p>
          <p className="mt-2 text-sm text-ink-soft">Requests you send to the agent show up here with their progress.</p>
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {rows.map(({ session, status }) => (
            <li key={session.id}>
              <Link
                href={`/requests/${session.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/60 p-5 transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block break-words font-medium">{session.title || "Quote request"}</span>
                  <span className="mt-1 block text-sm text-ink-soft">Started {formatStarted(session.created_at)}</span>
                </span>
                <StatusPill status={status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {truncated && (
        <p className="mt-6 text-sm text-ink-soft">Showing your most recent requests. Older ones may not be listed.</p>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="Your requests">
        <Suspense fallback={<AccountNavigationFallback />}>
          <AccountNavigation />
        </Suspense>
      </AppHeader>
      <main className="flex-1">
        <Suspense fallback={<p role="status" className="px-6 py-16 text-center text-ink-soft">Loading your requests…</p>}>
          <RequestList />
        </Suspense>
      </main>
    </div>
  );
}
