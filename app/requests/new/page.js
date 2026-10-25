import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import RequestForm from "./request-form";

export const metadata = {
  title: "New quote request — RingAround",
};

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
        <RequestForm />
      </main>
    </div>
  );
}
