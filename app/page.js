import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/auth";
import { hasRequests } from "@/lib/db";
import {
  AuthNavigation,
  AuthNavigationFallback,
} from "@/components/auth-navigation";
import { Arrow, CheckGlyph } from "@/components/icons";
import {
  CallCount,
  CallList,
  RequestSummaryCard,
} from "@/components/request-board";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLANS } from "@/lib/plans";

export const metadata = {
  title: "RingAround — Local service quotes, less follow-up",
  description:
    "Delegate local provider outreach. RingAround uses AI phone calls to request pricing and availability, with provider responses and updates in one place.",
};

const ACCESS_PATH = "/checkout/starter";
const primaryButton =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-night transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";
const secondaryButton =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

const EXAMPLE_CALLS = [
  {
    business: "Brightline Cleaning Co.",
    status: "quoted",
    detail: "$320 estimate · supplies included · Friday AM",
  },
  {
    business: "Evergreen Maid Service",
    status: "declined",
    detail: "Unavailable for the requested date",
  },
  {
    business: "Harbor Home Care",
    status: "queued",
    detail: "Awaiting outreach",
  },
];

const WORKFLOW = [
  {
    title: "Define the request",
    body: "Describe the service, location, timing, and budget. Add requirements such as access hours or equipment details.",
  },
  {
    title: "Delegate the outreach",
    body: "After you submit, the AI assistant searches for relevant providers and calls to ask about pricing and availability.",
  },
  {
    title: "Review and decide",
    body: "Follow provider responses and agent updates in your request. Confirm the scope and arrange any booking directly with your chosen provider.",
  },
];

const USE_CASES = [
  {
    category: "Property operations",
    title: "Prepare a unit for its next tenant.",
    example:
      "Request cleaning availability for a two-bedroom apartment before Friday’s move-in.",
    details: "Include unit size, access instructions, and the completion date.",
    icon: "building",
  },
  {
    category: "Facilities management",
    title: "Find a provider for routine maintenance.",
    example:
      "Ask local HVAC companies about servicing the equipment at your building.",
    details:
      "Include the equipment type, symptoms, and preferred service window.",
    icon: "tools",
  },
  {
    category: "Office & site management",
    title: "Source services around your schedule.",
    example:
      "Request carpet cleaning estimates for an office, with work outside business hours.",
    details:
      "Include the floor area, location, and after-hours access requirements.",
    icon: "calendar",
  },
];

const FAQS = [
  {
    q: "What happens after I submit a request?",
    a: "For approved accounts, submission starts the agent’s provider search and outreach. Businesses and their reported outcomes appear on your request page. The agent may ask you for more information as it works.",
  },
  {
    q: "Can I use RingAround immediately?",
    a: "You can sign in and prepare a request. Calling access requires account review and activation. Submitting an access application does not start calls or guarantee approval.",
  },
  {
    q: "Will every provider return a quote?",
    a: "No. A provider may be unavailable, may not answer, or may need an inspection or additional details before quoting. Pricing and availability must be confirmed directly with the provider.",
  },
  {
    q: "Does the assistant identify itself?",
    a: "The calling assistant is instructed to identify itself as AI and disclose call recording at the start of the call. It uses the contact and request details you provide when speaking with providers.",
  },
  {
    q: "What information is shared with providers?",
    a: "The assistant uses your name, callback number, company if supplied, service address, and job requirements to request pricing and availability. Include only information relevant to the service request.",
  },
  {
    q: "Does RingAround book or pay for the service?",
    a: "No. RingAround is for provider outreach and information gathering. You confirm pricing, select a provider, and handle bookings, contracts, and payments directly.",
  },
  {
    q: "Can I make requests for different locations?",
    a: "Yes. Save service addresses and choose the appropriate location for each request. Selecting a location for one job does not change your default address.",
  },
];

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-signal-ink sm:text-[11px]">
      {children}
    </p>
  );
}

function UseCaseIcon({ type }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "building" ? (
        <>
          <path d="M4 21V5l8-3v19M12 8h8v13M2 21h20M7 7v1M7 11v1M7 15v1M16 12h1M16 16h1" />
        </>
      ) : type === "tools" ? (
        <>
          <path d="m14 6 4 4M4 20l6-6M14 3a6 6 0 0 0-7 7L3 20l1 1 10-4a6 6 0 0 0 7-7l-4 4-5-5 4-4Z" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 5-4" />
        </>
      )}
    </svg>
  );
}

function ProductExample() {
  return (
    <figure
      id="example"
      className="relative w-full scroll-mt-40 lg:scroll-mt-28"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs text-ink-soft">
        <span className="font-medium text-ink">Your request, in one place</span>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider">
          Illustrative example
        </span>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-line bg-surface p-2 shadow-[0_24px_64px_-32px_rgb(0_0_0/0.5)]">
        <RequestSummaryCard
          label="Service request"
          statusLabel="Example"
          title="Turnover clean · 2-bedroom unit"
          where="Pine St property"
          when="Before Friday"
          budget="$250–$400"
        />
        <CallList calls={EXAMPLE_CALLS} />
        <CallCount placed={2} cap={5} />
      </div>
      <figcaption className="mt-4 px-1 text-xs leading-relaxed text-ink-soft">
        Fictional businesses and illustrative pricing. Actual responses depend
        on the service, location, and provider availability.
      </figcaption>
    </figure>
  );
}

export default async function Home() {
  await connection();
  const userId = (await getSession())?.user?.id;
  if (userId && (await hasRequests(userId))) redirect("/requests");

  return (
    <div className="flex flex-1 flex-col">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/95 backdrop-blur-md">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6"
        >
          <a
            href="#"
            aria-label="RingAround home"
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
          >
            <Logo />
          </a>
          <div className="hidden items-center gap-6 text-[13px] text-ink-soft xl:flex">
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#who" className="transition hover:text-ink">
              Use cases
            </a>
            <a href="#faq" className="transition hover:text-ink">
              Questions
            </a>
          </div>
          <div className="flex w-full items-center justify-end gap-2 min-[620px]:w-auto">
            <ThemeToggle />
            <Suspense fallback={<AuthNavigationFallback />}>
              <AuthNavigation />
            </Suspense>
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section
          aria-labelledby="hero-heading"
          className="relative border-b border-line/70"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--signal-soft),transparent_60%)] opacity-40"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-24">
            <div>
              <SectionLabel>For property & operations managers</SectionLabel>
              <h1
                id="hero-heading"
                className="mt-6 max-w-xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[3.6rem] lg:text-[3.25rem]"
              >
                Local service quotes.
                <br />
                <span className="font-display text-[1.13em] font-normal text-signal-ink">
                  Less time on the phone.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
                RingAround calls local service providers to request pricing and
                availability. Delegate the outreach and review the responses in
                one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={ACCESS_PATH} className={primaryButton}>
                  Request access <Arrow />
                </Link>
                <a href="#example" className={secondaryButton}>
                  View an example <Arrow />
                </a>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-soft">
                Account review required before calling is enabled.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-5 text-xs text-ink-soft">
                {[
                  "AI-assisted phone outreach",
                  "Provider response tracking",
                  "You handle the final booking",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckGlyph className="h-3.5 w-3.5 shrink-0 text-sage" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <ProductExample />
          </div>
        </section>

        <section
          aria-label="Core capabilities"
          className="border-b border-line/70 bg-surface/40"
        >
          <dl className="mx-auto grid max-w-6xl divide-y divide-line px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              [
                "One brief",
                "Keep the location, timing, budget, and service requirements together.",
              ],
              [
                "Visible progress",
                "See which businesses are queued, contacted, or have provided a response.",
              ],
              [
                "Your decision",
                "Review the available information and choose how to proceed.",
              ],
            ].map(([title, body], index) => (
              <div
                key={title}
                className={`py-7 ${index > 0 ? "md:pl-8" : ""} ${index < 2 ? "md:pr-8" : ""}`}
              >
                <dt className="text-sm font-semibold">{title}</dt>
                <dd className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="how"
          aria-labelledby="workflow-heading"
          className="mx-auto max-w-6xl scroll-mt-40 px-4 py-16 sm:px-6 sm:py-20 lg:scroll-mt-28"
        >
          <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end md:gap-16">
            <div>
              <SectionLabel>How it works</SectionLabel>
              <h2
                id="workflow-heading"
                className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              >
                From service requirements
                <br className="hidden sm:block" /> to provider responses.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Give the assistant the details you would otherwise repeat on every
              call. Follow the outreach from a dedicated request page.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {WORKFLOW.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-line bg-surface/50 p-6 sm:p-7"
              >
                <span className="font-mono text-xs text-signal-ink">
                  0{index + 1}
                </span>
                <h3 className="mt-7 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
            For approved accounts, submitting a request can start calls. Review
            your requirements before sending.
          </p>
        </section>

        <section
          id="who"
          aria-labelledby="use-cases-heading"
          className="scroll-mt-40 border-y border-line/70 bg-surface/40 lg:scroll-mt-28"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionLabel>Practical use cases</SectionLabel>
            <h2
              id="use-cases-heading"
              className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              For the work that keeps
              <br className="hidden sm:block" /> your properties and sites
              running.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {USE_CASES.map((item) => (
                <article
                  key={item.category}
                  className="flex flex-col rounded-2xl border border-line bg-paper p-6 sm:p-7"
                >
                  <div className="mb-6 flex items-center gap-3 text-ink-soft">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface">
                      <UseCaseIcon type={item.icon} />
                    </span>
                    <p className="text-xs font-medium">{item.category}</p>
                  </div>
                  <h3 className="text-xl font-semibold leading-snug tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mb-6 mt-4 text-sm leading-relaxed text-ink-soft">
                    {item.example}
                  </p>
                  <p className="mt-auto border-t border-line pt-5 text-xs leading-relaxed text-ink-soft">
                    {item.details}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-soft">
              Examples of service requests, not a guarantee of coverage or
              provider availability. Some work requires an on-site assessment
              before pricing.
            </p>
          </div>
        </section>

        <section
          id="trust"
          aria-labelledby="control-heading"
          className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"
        >
          <div>
            <SectionLabel>Clear responsibilities</SectionLabel>
            <h2
              id="control-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Delegate the calls.
              <br />
              Keep the decisions.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              RingAround helps gather information. Provider selection, final
              pricing, and any commitment remain with you.
            </p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {[
              [
                "Outreach with context",
                "Your service requirements and relevant contact details are used to ask providers about the job. The assistant is instructed to disclose its AI identity and call recording.",
              ],
              [
                "Responses with limitations",
                "A price may be an estimate, depend on an inspection, or exclude part of the scope. Confirm the details directly before proceeding.",
              ],
              [
                "No automatic booking",
                "The assistant is instructed to gather pricing and availability, not book appointments, accept terms, or provide payment information.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="py-6">
                <dt className="flex items-center gap-3 text-sm font-semibold">
                  <CheckGlyph className="h-4 w-4 shrink-0 text-sage" />
                  {title}
                </dt>
                <dd className="mt-2 pl-7 text-sm leading-relaxed text-ink-soft">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="pricing"
          aria-labelledby="access-heading"
          className="scroll-mt-40 border-y border-line/70 bg-surface/40 lg:scroll-mt-28"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end md:gap-16">
              <div>
                <SectionLabel>Plans & access</SectionLabel>
                <h2
                  id="access-heading"
                  className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                >
                  Start with an access review.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-ink-soft">
                New accounts are reviewed before calling is enabled. Select a
                plan to submit your application. No payment details are required
                to apply.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {PLANS.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-2xl border border-line bg-paper p-6 sm:p-8"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-3xl font-semibold tracking-tight">
                      ${plan.price}
                      <span className="ml-1 text-sm font-normal tracking-normal text-ink-soft">
                        / month
                      </span>
                    </p>
                  </div>
                  <p className="mt-4 text-sm font-medium">{plan.quota}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {plan.blurb}
                  </p>
                  <Link
                    href={`/checkout/${plan.id}`}
                    className={`${secondaryButton} mt-7 w-full`}
                  >
                    Apply for {plan.name} <Arrow />
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-soft">
              A request initiates provider outreach; it does not guarantee a
              quote or booking. Provider service charges are separate from your
              RingAround plan.
            </p>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="mx-auto grid max-w-6xl scroll-mt-40 gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:scroll-mt-28 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20"
        >
          <div>
            <SectionLabel>Before you start</SectionLabel>
            <h2
              id="faq-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Common questions.
            </h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-5 rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
                  {item.q}
                  <span
                    className="faq-plus grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-lg font-normal text-ink-soft transition-transform"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-10 text-sm leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="next-step-heading"
          className="px-4 pb-16 sm:px-6 sm:pb-20"
        >
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-line bg-night px-6 py-10 text-on-night sm:p-12">
            <svg
              viewBox="0 0 400 400"
              className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] text-on-night/[0.07]"
              aria-hidden="true"
            >
              {[100, 145, 190].map((radius) => (
                <circle
                  key={radius}
                  cx="200"
                  cy="200"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                />
              ))}
            </svg>
            <div className="relative flex flex-wrap items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-night/60">
                  Your next service request
                </p>
                <h2
                  id="next-step-heading"
                  className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                >
                  Put provider outreach
                  <br className="hidden sm:block" /> on your team’s terms.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-on-night/65">
                  Start with a clear request. Review access requirements, then
                  put RingAround to work on the calls.
                </p>
              </div>
              <Link
                href={ACCESS_PATH}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-night transition hover:bg-on-night hover:text-night focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
              >
                Request access <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <a href="#" aria-label="RingAround home">
              <Logo />
            </a>
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-ink-soft"
            >
              <a href="#how" className="hover:text-ink">
                How it works
              </a>
              <a href="#pricing" className="hover:text-ink">
                Plans & access
              </a>
              <Link href="/requests" className="hover:text-ink">
                Your requests
              </Link>
              <Link href="/sign-in" className="hover:text-ink">
                Sign in
              </Link>
            </nav>
          </div>
          <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-xs leading-relaxed text-ink-soft">
            <p>
              Provider outreach and information gathering. You arrange the
              service.
            </p>
            <p>© 2026 RingAround</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
