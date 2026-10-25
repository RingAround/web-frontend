import Link from "next/link";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { signOutOfAccount } from "@/app/sign-in/actions";
import { SignOutButton } from "./sign-out-button";
import { Arrow } from "./icons";

const buttonClass = "inline-flex min-h-9 min-w-20 items-center justify-center whitespace-nowrap rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";
const requestButtonClass = "group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-signal hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

// Read per request: without connection() the nav is prerendered once at build
// time, so signed-in visitors would still see "Get early access".
async function isSignedIn() {
  await connection();
  return Boolean((await getSession())?.user);
}

function AccountAction({ signedIn }) {
  return signedIn ? (
    <form action={signOutOfAccount}>
      <SignOutButton className={buttonClass} />
    </form>
  ) : (
    <Link href="/sign-in" className={buttonClass}>Sign in</Link>
  );
}

export function AccountNavigationFallback() {
  return <button type="button" disabled aria-label="Checking your session" aria-busy="true" className={`${buttonClass} opacity-50`}>…</button>;
}

export function AuthNavigationFallback() {
  return (
    <>
      <button type="button" disabled aria-label="Loading request button" aria-busy="true" className={`${requestButtonClass} min-w-36 opacity-50`}>…</button>
      <AccountNavigationFallback />
    </>
  );
}

export async function AuthNavigation() {
  const signedIn = await isSignedIn();

  return (
    <>
      <Link href={signedIn ? "/requests/new" : "/sign-in"} className={requestButtonClass}>
        {signedIn ? "New Request" : "Get early access"} <Arrow />
      </Link>
      <AccountAction signedIn={signedIn} />
    </>
  );
}

// Sign out for signed-in visitors, Sign in for everyone else.
export async function AccountNavigation() {
  return <AccountAction signedIn={await isSignedIn()} />;
}
