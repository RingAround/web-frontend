import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import ProfileGate from "./profile-gate";

export const metadata = {
  title: "New quote request — RingAround",
};

async function AuthenticatedRequest() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");
  return <ProfileGate user={{ id: session.user.id, name: session.user.name || "" }} />;
}

export default function NewRequestPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="RingAround home">
              <Logo />
            </Link>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <span className="hidden text-sm text-ink-soft sm:block">New quote request</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Suspense fallback={<AccountNavigationFallback />}>
              <AccountNavigation />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Suspense fallback={<p role="status" className="px-6 py-16 text-center text-ink-soft">Loading your profile…</p>}>
          <AuthenticatedRequest />
        </Suspense>
      </main>
    </div>
  );
}
