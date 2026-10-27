import { Suspense } from "react";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { canStartCalls } from "@/lib/agent";
import { getApplication, getProfile, listLocations } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import {
  AccountNavigation,
  AccountNavigationFallback,
} from "@/components/auth-navigation";
import ProfileGate from "./profile-gate";
import RequestForm from "./request-form";

export const metadata = {
  title: "New call request — RingAround",
};

async function NewRequest() {
  // Check the session per request. Without this the page is prerendered at
  // build time, where auth isn't configured.
  await connection();
  const session = await getSession();
  if (!session?.user?.id) {
    return (
      <RequestForm
        initialLocations={[]}
        canCall={false}
        hasApplication={false}
      />
    );
  }
  const userId = session.user.id;
  const [profile, locations, application] = await Promise.all([
    getProfile(userId),
    listLocations(userId),
    getApplication(userId),
  ]);
  return (
    <ProfileGate
      user={{ id: userId, name: session.user.name || "" }}
      canCall={canStartCalls(session.user.email)}
      hasApplication={Boolean(application)}
      initialProfile={profile}
      initialLocations={locations}
    />
  );
}

export default function NewRequestPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="New call request">
        <Suspense fallback={<AccountNavigationFallback />}>
          <AccountNavigation />
        </Suspense>
      </AppHeader>
      <main className="flex-1">
        <Suspense
          fallback={
            <p role="status" className="px-6 py-16 text-center text-ink-soft">
              Loading your request…
            </p>
          }
        >
          <NewRequest />
        </Suspense>
      </main>
    </div>
  );
}
