import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { signOutOfAccount } from "@/app/sign-in/actions";
import ProfileGate from "./profile-gate";

export const metadata = {
  title: "New quote request — RingAround",
};

async function AuthenticatedRequest() {
  const session = isAuthConfigured() ? await auth() : null;
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
            <form action={signOutOfAccount}>
              <SignOutButton className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal" />
            </form>
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
