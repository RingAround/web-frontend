import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { canStartCalls } from "@/lib/agent";
import { AppHeader } from "@/components/app-header";
import ApplicationForm from "./application-form";

export const metadata = { title: "Request access — RingAround" };

export default async function ApplyPage() {
  // Accounts on ALLOWED_EMAILS are already approved: no application step.
  await connection();
  const session = await getSession();
  // The application is saved to the signed-in account, so applying needs one.
  if (!session?.user?.id)
    redirect(`/sign-in?next=${encodeURIComponent("/apply")}`);
  if (canStartCalls(session.user.email)) redirect("/requests/new");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="Access application" />
      <main className="flex-1">
        <ApplicationForm
          defaults={{
            name: session.user.name || "",
            email: session.user.email || "",
          }}
        />
      </main>
    </div>
  );
}
