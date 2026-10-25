import { notFound } from "next/navigation";
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

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="Checkout" />
      <main className="flex-1">
        <CheckoutForm initialPlanId={plan.id} />
      </main>
    </div>
  );
}
