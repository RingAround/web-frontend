import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { canStartCalls } from "@/lib/agent";
import { AppHeader } from "@/components/app-header";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import ProfileGate from "./profile-gate";

export const metadata = {
  title: "New quote request — RingAround",
};

async function AuthenticatedRequest() {
  // Check the session per request. Without this the page is prerendered at
  // build time, where auth isn't configured, and always redirects to /sign-in.
  await connection();
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");
  return (
    <ProfileGate
      user={{ id: session.user.id, name: session.user.name || "" }}
      canCall={canStartCalls(session.user.email)}
    />
  );
}

export default function NewRequestPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="New quote request">
        <Suspense fallback={<AccountNavigationFallback />}>
          <AccountNavigation />
        </Suspense>
      </AppHeader>
      <main className="flex-1">
        <Suspense fallback={<p role="status" className="px-6 py-16 text-center text-ink-soft">Loading your profile…</p>}>
          <AuthenticatedRequest />
        </Suspense>
      </main>
    </div>
  );
}
