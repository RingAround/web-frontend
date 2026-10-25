import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { canStartCalls } from "@/lib/agent";
import { AppHeader } from "@/components/app-header";
import { PLANS, findPlan } from "@/lib/plans";
import CheckoutForm from "./checkout-form";

export async function generateStaticParams() {
  return PLANS.map((plan) => ({ plan: plan.id }));
}

export async function generateMetadata({ params }) {
  const plan = findPlan((await params).plan);
  return { title: plan ? `Checkout: ${plan.name} plan — RingAround` : "Checkout — RingAround" };
}

export default async function CheckoutPage({ params }) {
  const plan = findPlan((await params).plan);
  if (!plan) notFound();
  // Accounts on ALLOWED_EMAILS are already approved: no plan or payment step.
  await connection();
  const session = await getSession();
  if (canStartCalls(session?.user?.email)) redirect("/requests/new");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="Checkout" />
      <main className="flex-1">
        <CheckoutForm initialPlanId={plan.id} />
      </main>
    </div>
  );
}
