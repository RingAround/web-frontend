"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { isAuthConfigured, signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  if (!isAuthConfigured()) {
    redirect("/sign-in?error=Configuration");
  }

  try {
    await signIn("google", { redirectTo: "/requests/new" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/sign-in?error=${encodeURIComponent(error.type)}`);
    }
    // Successful sign-in throws a Next.js redirect, which must propagate.
    throw error;
  }
}

export async function signOutOfAccount() {
  // Without auth configured there is no session, and signOut() would fail.
  if (!isAuthConfigured()) redirect("/");
  await signOut({ redirectTo: "/" });
}
