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
import { HomeCallExample } from "@/components/home-call-example";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "RingAround — AI calls on your behalf",
  description:
    "Give RingAround the instructions and delegate the calls. Find services, contact a business, and follow the results in one place.",
};

const REQUEST_PATH = "/requests/new";
const APPLY_PATH = "/apply";
// Add the recorded walkthrough's video URL and optional WebVTT captions here.
const EXAMPLE_VIDEO_URL = "";
const EXAMPLE_CAPTIONS_URL = "";
const primaryButton =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-on-signal transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";
const secondaryButton =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

const WORKFLOW = [
  {
    title: "Define the request",
    body: "Explain the outcome you need. Ask RingAround to find businesses or provide a business name and number to contact directly.",
  },
  {
    title: "Delegate the outreach",
    body: "After you submit, the AI assistant follows your brief and makes the business calls. Add context or follow-up instructions in the same request.",
  },
  {
    title: "Review and decide",
    body: "Read the results, progress summaries, and available transcript excerpts. Handle bookings, purchases, or other commitments yourself.",
  },
];

const USE_CASES = [
  {
    category: "Find and compare services",
    title: "Get answers from local businesses.",
    example:
      "Find a cleaner, repair service, or rental company. Ask about pricing and availability without repeating the same brief on every call.",
    details:
      "Available for approved accounts. Results and call updates appear on your request page.",
    icon: "building",
  },
  {
    category: "Call a specific business",
    title: "Provide the number. Set the task.",
    example:
      "Ask a hotel about late check-in, follow up on a refund, or contact a business you already know. Supply its number and the outcome you need.",
    details:
      "Review the destination before sending. The assistant gathers information without making financial commitments.",
    icon: "tools",
  },
  {
    category: "Research, then call you",
    title: "Get the result in a phone call.",
    example:
      "Give the assistant a research task, then receive a call with the findings instead of checking another dashboard.",
    details:
      "Select Call me to receive research findings or a spoken briefing on your own number. Calls use the number saved in your profile; calling access requires approval.",
    icon: "calendar",
  },
];

const HACKATHON_LINKS = [
  {
    source: "Claude Impact Lab",
    title: "Claude Impact Lab Hackathon, Seattle",
    href: "https://hack.claudeseattle.org/",
  },
  {
    source: "GitHub",
    title: "Projects from the hackathon, with RingAround listed as a finalist",
    href: "https://github.com/00Zero/claude-impact-lab-seattle-oct-2026",
  },
  {
    source: "GeekWire",
    title: "Seattle AI Week: Claude Impact Lab Hackathon",
    href: "https://www.geekwire.com/calendar-event/seattle-ai-week-claude-impact-lab-hackathon/",
  },
  {
    source: "Luma",
    title: "Claude Impact Lab event page",
    href: "https://luma.com/claude-impact",
  },
];

const FAQS = [
  {
    q: "What happens after I submit a request?",
    a: "For approved accounts, submission starts your selected workflow: find businesses, call a supplied business number, or research a task and call your saved number. Results, reported transcript excerpts, and agent messages appear in the request. You can add instructions without starting a new request.",
  },
  {
    q: "Can I use RingAround immediately?",
    a: "You can prepare and review a request without signing in. Sign in to complete it. Calling access requires account review and activation. Submitting an access application does not start calls or guarantee approval.",
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
      className="relative isolate w-full scroll-mt-40 lg:scroll-mt-28"
    >
      <svg
        viewBox="0 0 600 600"
        className="spin-slow pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 text-ink"
        aria-hidden="true"
      >
        {[90, 150, 210, 270].map((radius, index) => (
          <circle
            key={radius}
            cx="300"
            cy="300"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.12 - index * 0.02}
            strokeWidth="1"
            strokeDasharray={index % 2 ? "2 8" : undefined}
          />
        ))}
        <circle cx="300" cy="30" r="5" fill="var(--signal)" />
        <circle cx="510" cy="300" r="3.5" fill="var(--sage)" />
        <circle cx="140" cy="480" r="3.5" fill="var(--ink)" fillOpacity="0.4" />
      </svg>
      <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs text-ink-soft">
        <span className="font-medium text-ink">Your request, in one place</span>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider">
          Illustrative example
        </span>
      </div>
      <HomeCallExample />
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
    <div className="flex flex-1 flex-col overflow-x-clip">
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
            <Logo animated />
          </a>
          <div className="hidden items-center gap-6 text-[13px] text-ink-soft xl:flex">
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#who" className="transition hover:text-ink">
              Use cases
            </a>
            <a href="#access" className="transition hover:text-ink">
              Access
            </a>
            <a href="#hackathon" className="transition hover:text-ink">
              Hackathon
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
          <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 md:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
            <div>
              <SectionLabel>AI calls on your behalf</SectionLabel>
              <h1
                id="hero-heading"
                className="mt-6 max-w-xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[3.6rem] lg:text-[3.25rem]"
              >
                Less time on the phone.
                <br />
                <span className="font-display text-[1.13em] font-normal text-signal-ink">
                  We’ll ring around.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
                Give RingAround the task and the instructions. Find services or
                call a specific business, follow the conversation, and get the
                information you need to move forward.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={REQUEST_PATH} className={primaryButton}>
                  New request <Arrow />
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
                  "Call summaries and transcript excerpts",
                  "Add instructions as the task progresses",
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
                "Keep the task, destination, and relevant instructions together.",
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
          className="mx-auto max-w-6xl scroll-mt-[71px] px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-12"
        >
          <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end md:gap-16">
            <div>
              <SectionLabel>How it works</SectionLabel>
              <h2
                id="workflow-heading"
                className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              >
                From your instructions
                <br className="hidden sm:block" /> to a call with a purpose.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Set a task, choose who gets called, and follow the conversation
              from a dedicated request page.
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
          id="example"
          aria-labelledby="example-heading"
          className="mx-auto max-w-6xl scroll-mt-[71px] px-4 pb-16 pt-[10px] sm:px-6 sm:pb-20"
        >
          <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end md:gap-16">
            <div>
              <SectionLabel>See it in action</SectionLabel>
              <h2
                id="example-heading"
                className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              >
                A cleaning request, from brief to call result.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Follow one request in a single video: the screen recording,
              the phone conversation, and the information returned to the request page.
            </p>
          </div>

          <div className="mt-10 grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-line bg-surface/50 p-6 sm:p-7">
              <h3 className="text-sm font-semibold">The example request</h3>
              <blockquote className="mt-4 border-l-2 border-signal pl-4 text-sm leading-relaxed text-ink-soft">
                Find a cleaner for a two-bedroom apartment this Saturday.
                Ask about pricing, availability, and whether supplies are included.
              </blockquote>
              <p className="mt-6 text-xs font-medium text-ink-soft">What the walkthrough will cover</p>
              <ol className="mt-4 space-y-4">
                {[
                  ["Prepare the request", "Enter the service, address, and timing, then review the instructions."],
                  ["Hear the conversation", "Watch the request progress and hear the assistant ask a provider about the job."],
                  ["Review the response", "See the call summary and available transcript excerpts before deciding what to do next."],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-xs text-signal-ink">0{index + 1}</span>
                    <div>
                      <h4 className="text-sm font-medium">{title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
              {EXAMPLE_VIDEO_URL ? (
                <video
                  controls
                  playsInline
                  preload="none"
                  aria-label="Cleaning request walkthrough with screen recording and phone conversation"
                  className="aspect-video w-full bg-night"
                >
                  <source src={EXAMPLE_VIDEO_URL} />
                  <track kind="captions" src={EXAMPLE_CAPTIONS_URL || undefined} srcLang="en" label="English" />
                  Your browser does not support video playback. <a href={EXAMPLE_VIDEO_URL}>Open the walkthrough video.</a>
                </video>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-night px-6 text-center text-on-night">
                  <span className="rounded-full border border-on-night/20 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-on-night/70">
                    Screen recording + phone call
                  </span>
                  <button
                    type="button"
                    disabled
                    aria-describedby="example-video-status"
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-on-night/25 bg-on-night/10 px-5 py-3 text-sm font-medium text-on-night/80"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play walkthrough
                  </button>
                  <p id="example-video-status" className="text-sm text-on-night/70">Recording coming soon.</p>
                </div>
              )}
              <figcaption className="border-t border-line px-5 py-4 text-xs leading-relaxed text-ink-soft">
                One recording, from request setup to the call result. Playback
                will include audio; watching the video does not start a call.
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="who"
          aria-labelledby="use-cases-heading"
          className="scroll-mt-[71px] border-y border-line/70 bg-surface/40"
        >
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
            <SectionLabel>Practical use cases</SectionLabel>
            <h2
              id="use-cases-heading"
              className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              More than finding a quote.
              <br className="hidden sm:block" /> A way to get the call done.
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
              Choose a service search, a direct business call, or research
              followed by a callback to your saved number. Account activation is
              required before calls can start.
            </p>
            <div className="mt-8 rounded-2xl border border-dashed border-line p-6">
              <h3 className="text-sm font-semibold">
                Further workflows we’re exploring
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Appointment scheduling within your availability, scheduled
                reminder calls, and connecting you once a business
                representative is on the line. These require additional
                scheduling, authorization, and telephony support and are not
                available yet.
              </p>
            </div>
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
          id="access"
          aria-labelledby="access-heading"
          className="scroll-mt-[71px] border-y border-line/70 bg-surface/40"
        >
          <div className="mx-auto max-w-6xl px-4 pb-4 pt-8 sm:px-6 sm:pb-5 sm:pt-12">
            <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end md:gap-16">
              <div>
                <SectionLabel>Access</SectionLabel>
                <h2
                  id="access-heading"
                  className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                >
                  Start with an access review.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-ink-soft">
                New accounts are reviewed before calling is enabled. Applying
                is free, and no card or payment details are requested.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
                <h3 className="text-lg font-semibold">Request access</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Tell us who you are and how you plan to use RingAround. We
                  enable calling once your account is reviewed.
                </p>
                <Link
                  href={APPLY_PATH}
                  className={`${secondaryButton} mt-7 w-full`}
                >
                  Apply for access <Arrow />
                </Link>
              </article>
              <article className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
                <h3 className="text-lg font-semibold">No credit card</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  RingAround does not take credit cards or collect payment
                  details. Paid plans are paused for now.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                  {[
                    "No card required to apply",
                    "No payment details stored",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckGlyph className="h-3.5 w-3.5 shrink-0 text-sage" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-soft">
              A request initiates provider outreach; it does not guarantee a
              quote or booking. Provider service charges are between you and
              the provider.
            </p>
            <section
              aria-labelledby="next-step-heading"
              className="mt-4 sm:mt-5"
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
                      Your next call
                    </p>
                    <h2
                      id="next-step-heading"
                      className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                    >
                      Give the next call
                      <br className="hidden sm:block" /> to RingAround.
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-on-night/65">
                      Start with a clear request. Review access requirements, then
                      put RingAround to work on the calls.
                    </p>
                  </div>
                  <Link
                    href={REQUEST_PATH}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-on-night px-6 py-3 text-sm font-semibold text-night transition hover:bg-signal hover:text-on-signal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
                  >
                    New request <Arrow />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="mx-auto grid max-w-6xl scroll-mt-[71px] gap-8 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20"
        >
          <div>
            <SectionLabel>Before you start</SectionLabel>
            <h2
              id="faq-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Starter Guide
            </h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((item) => (
              <details key={item.q} name="starter-guide" className="group py-5">
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
          id="hackathon"
          aria-labelledby="hackathon-heading"
          className="scroll-mt-[71px] border-t border-line/70 bg-surface/40"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <div>
              <SectionLabel>Where it started</SectionLabel>
              <h2
                id="hackathon-heading"
                className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              >
                Built at the Claude Impact Lab in Seattle.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
                RingAround was built in a day at the Claude Impact Lab
                Hackathon on October 25, 2026, during Seattle AI Week. The
                theme was AI tools small businesses can adopt, and RingAround
                was a finalist.
              </p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {HACKATHON_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-5 rounded-sm py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
                  >
                    <span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                        {item.source}
                      </span>
                      <span className="mt-1 block text-sm font-medium transition group-hover:text-signal-ink">
                        {item.title}
                      </span>
                    </span>
                    <span className="shrink-0">
                      <Arrow />
                    </span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
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
              <a href="#access" className="hover:text-ink">
                Access
              </a>
              <a href="#hackathon" className="hover:text-ink">
                Claude Impact Lab
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
            <p>Calls on your behalf. Results and updates in one place.</p>
            <p>© 2026 RingAround</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
