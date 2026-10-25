import Link from "next/link";
import { auth, isAuthConfigured } from "@/auth";
import { signOutOfAccount } from "@/app/sign-in/actions";
import { SignOutButton } from "./sign-out-button";
import { Arrow } from "./icons";

const buttonClass = "inline-flex min-h-9 min-w-20 items-center justify-center whitespace-nowrap rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";
const requestButtonClass = "group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-signal hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

export function AuthNavigationFallback() {
  return (
    <>
      <button type="button" disabled aria-label="Loading request button" aria-busy="true" className={`${requestButtonClass} min-w-36 opacity-50`}>…</button>
      <button type="button" disabled aria-label="Checking your session" aria-busy="true" className={`${buttonClass} opacity-50`}>…</button>
    </>
  );
}

export async function AuthNavigation() {
  const session = isAuthConfigured() ? await auth() : null;

  const signedIn = Boolean(session?.user);

  return (
    <>
      <Link href={signedIn ? "/requests/new" : "/sign-in"} className={requestButtonClass}>
        {signedIn ? "New Request" : "Get early access"} <Arrow />
      </Link>
      {signedIn ? (
        <form action={signOutOfAccount}>
          <SignOutButton className={buttonClass} />
        </form>
      ) : (
        <Link href="/sign-in" className={buttonClass}>Sign in</Link>
      )}
    </>
  );
}
