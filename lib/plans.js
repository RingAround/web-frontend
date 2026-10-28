export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 20,
    quota: "Up to 200 quote requests a month",
    blurb: "For everyday service searches and calls to businesses.",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 100,
    quota: "Unlimited quote requests",
    blurb: "For frequent requests and ongoing business outreach.",
  },
];

// Every plan includes the full product; plans differ only in request volume.
export const PLAN_FEATURES = [
  "Four-question requests with special instructions",
  "Saved locations for your properties, stores, or sites",
  "Shortlist review before any call goes out",
  "AI calls during business hours, always disclosed",
  "Side-by-side comparison, labeled firm, estimate, or conditional",
  "A full record of who was contacted and what they said",
];

export function findPlan(id) {
  return PLANS.find((plan) => plan.id === id) ?? null;
}
