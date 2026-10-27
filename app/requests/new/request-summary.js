"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Arrow, CheckGlyph } from "@/components/icons";

function Badge({ children }) {
  return (
    <span className="ml-2 inline-block rounded-full bg-sage-soft px-2 py-0.5 align-middle font-mono text-[9px] uppercase tracking-wider text-sage">
      {children}
    </span>
  );
}

function SummaryRow({ label, empty, children }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-2.5">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="min-w-0">
        {children || <span className="text-ink-soft">{empty}</span>}
      </dd>
    </div>
  );
}

// Live recap of the draft, shown beside the form (below it on small screens).
export function RequestSummary({ view }) {
  const answeredCount = view.answered.filter(Boolean).length;
  return (
    <div className="rounded-[28px] border border-line bg-surface/80 p-2 shadow-[0_30px_80px_-40px_rgb(21_20_15/0.35)]">
      <div className="rounded-[22px] bg-night p-5 text-on-night">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-night/50">
            Request summary
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal-on-night">
            Draft
          </span>
        </div>
        <p className="mt-3 line-clamp-3 break-words font-display text-2xl leading-tight">
          {view.service || (
            <span className="text-on-night/65">What do you need done?</span>
          )}
        </p>
        {view.category && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-on-night/10 px-2.5 py-1 text-xs text-on-night/80">
            {view.category.label}
            {view.category.source === "suggested" && (
              <span className="text-on-night/45">· suggested</span>
            )}
          </p>
        )}
      </div>

      <dl className="divide-y divide-line/70 px-4 text-sm">
        {view.destination && view.destination.mode !== "discover" && (
          <SummaryRow label="Who" empty="Add a business and number">
            <span className="font-medium">
              {view.destination.name || "Business name required"}
            </span>
            <span className="block text-ink-soft">
              {view.destination.phone || "Phone number required"}
            </span>
          </SummaryRow>
        )}
        <SummaryRow
          label="Where"
          empty={
            view.destination?.mode !== "discover"
              ? "Not provided (optional)"
              : "Add an address"
          }
        >
          {view.location.address && (
            <>
              <span className="font-medium">{view.location.label}</span>
              {view.location.isDefault && <Badge>Default</Badge>}
              <span className="mt-0.5 block break-words text-ink-soft">
                {view.location.address}
              </span>
            </>
          )}
        </SummaryRow>
        <SummaryRow label="When" empty="Pick a timing">
          {view.timing && (
            <>
              <span>{view.timing}</span>
              {view.arrival && (
                <span className="block text-ink-soft">{view.arrival}</span>
              )}
              <span className="block text-xs text-ink-soft">
                {view.timeZone.label} time
              </span>
            </>
          )}
        </SummaryRow>
        <SummaryRow label="Budget" empty="Enter an amount">
          {view.budget}
        </SummaryRow>
        <SummaryRow label="Notes" empty="None">
          {view.instructions && (
            <span className="line-clamp-3 break-words">
              {view.instructions}
            </span>
          )}
        </SummaryRow>
      </dl>

      <div className="rounded-[18px] bg-paper-2/70 px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-soft">
            <b className="font-semibold text-ink">{answeredCount} of {view.answered.length}</b>{" "}
            steps complete
          </span>
          {answeredCount === view.answered.length && (
            <span className="inline-flex items-center gap-1 font-medium text-sage">
              <CheckGlyph className="h-3.5 w-3.5" /> Ready to review
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {view.answered.map((done, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${done ? "bg-signal" : "bg-ink/10"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, children }) {
  return (
    <div className="bg-surface p-6">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
        {label}
      </dt>
      <dd className="mt-2 break-words leading-relaxed">{children}</dd>
    </div>
  );
}

// Approved accounts send straight to the agent; everyone else goes through
// an access application or account review first.
const NEXT_STEPS = [
  {
    title: "Find providers",
    body: "We search for relevant businesses near the job site.",
  },
  {
    title: "Account review",
    body: "Calling is enabled after your account is reviewed and activated.",
  },
  {
    title: "Get quotes",
    body: "The agent calls during business hours and reports back.",
  },
];

const CALLING_STEPS = [
  {
    title: "Find providers",
    body: "The agent searches for relevant businesses near the job site.",
  },
  {
    title: "Make the calls",
    body: "It calls them during business hours, giving your name and callback number.",
  },
  {
    title: "Get quotes",
    body: "Progress and quotes show up on the request page as they come in.",
  },
];

// Read-back of a validated request before anything is sent.
export function ReviewPanel({
  request,
  view,
  assumptions,
  canCall,
  signedIn,
  onEdit,
  onSend,
}) {
  const [pending, startSending] = useTransition();
  const [error, setError] = useState(null);
  const selfCallback = request.destination?.mode === "callback";
  const directCall =
    request.destination?.mode !== "discover" && Boolean(request.destination);
  const steps = directCall
    ? [
        {
          title: "Use your destination",
          body: selfCallback
            ? `The agent will call your saved number with the information you requested: ${view.destination.phone}.`
            : `The agent will call ${request.destination.name} at the number you provided.`,
        },
        {
          title: canCall ? "Start the call" : "Account review",
          body: canCall
            ? "It asks your questions and reports progress in the same request."
            : "Calling requires account review and activation.",
        },
        {
          title: "Review the result",
          body: "Read call summaries and available transcript excerpts. Add follow-up instructions in the request.",
        },
      ]
    : canCall
      ? CALLING_STEPS
      : NEXT_STEPS;

  // onSend resolves with an error message, or navigates away.
  function send() {
    if (!signedIn) return;
    setError(null);
    startSending(async () => setError((await onSend()) ?? null));
  }

  return (
    <div className="mx-auto max-w-[55.2rem] px-4 pt-5 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        Review
      </p>
      <div className="flex items-center gap-3">
        <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
        Review your request
      </h1>

      </div>
      <p className="mt-4 text-ink-soft">
        {canCall
          ? "Review the details before sending. Submitting this request starts the agent and may initiate calls."
          : "This is what the agent will work from. Nothing has been sent, and no one has been called."}
      </p>

      <div className="mt-10 overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_30px_80px_-40px_rgb(21_20_15/0.4)]">
        <div className="bg-night p-6 text-on-night sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-night/50">
            {view.category ? view.category.label : "Service"}
          </p>
          <p className="mt-3 break-words font-display text-3xl leading-tight sm:text-4xl">
            {request.serviceDescription}
          </p>
        </div>
        <dl className="grid gap-px bg-line sm:grid-cols-2">
          {directCall && (
            <ReviewItem label="Call destination">
              <span className="font-medium">{view.destination.name}</span>
              <span className="block text-ink-soft">
                {view.destination.phone}
              </span>
            </ReviewItem>
          )}
          <ReviewItem label="Where">
            <span className="font-medium">{view.location.label}</span>
            {view.location.isDefault && <Badge>Default</Badge>}
            <span className="block text-ink-soft">
              {request.location.formattedAddress || "No address provided"}
            </span>
          </ReviewItem>
          <ReviewItem label="When">
            {view.timing}
            {view.arrival && (
              <span className="block text-ink-soft">{view.arrival}</span>
            )}
            <span className="block text-ink-soft">
              {view.timeZone.label} time · {view.timeZone.id}
            </span>
          </ReviewItem>
          <ReviewItem label="Budget">{view.budget}</ReviewItem>
          <ReviewItem label="Special instructions">
            {request.specialInstructions || (
              <span className="text-ink-soft">None</span>
            )}
          </ReviewItem>
        </dl>
      </div>



      <div className="mt-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          What happens next
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-surface/60 p-5"
            >
              <span className="font-mono text-xs text-signal">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onEdit}
          className="group inline-flex items-center gap-2 self-start rounded-full border border-ink/15 px-5 py-3 font-medium transition hover:border-ink"
        >
          <span className="inline-flex rotate-180">
            <Arrow />
          </span>
          Edit request
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex items-center gap-3">
        {assumptions.length > 0 && (
          <div className="group relative shrink-0">
            <button
              type="button"
              aria-label="Request notes"
              aria-describedby="review-request-notes"
              className="grid h-7 w-7 place-items-center rounded-full border border-line text-sm font-semibold text-ink-soft transition hover:border-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              ?
            </button>
            <div
              id="review-request-notes"
              role="tooltip"
              className="invisible absolute left-0 bottom-full z-50 w-[min(22rem,calc(100vw-2rem))] pb-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <ul className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft shadow-xl">
                {assumptions.map((note) => (
                  <li key={note} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
          {signedIn ? (
            <button
            type="button"
            onClick={send}
            disabled={pending || !signedIn}
            aria-busy={pending}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-signal px-7 py-3.5 font-medium text-on-signal shadow-[0_10px_30px_-10px_var(--signal)] transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/45 disabled:shadow-none"
          >
            {pending
              ? "Starting the agent…"
              : canCall
                ? selfCallback
                  ? "Start my call"
                  : directCall
                    ? "Start business call"
                    : "Find providers"
                : "Request calling access"}
            {!pending && <Arrow />}
          </button>
          ) : (
            <p className="text-xs text-ink-soft">
              <Link
                href="/sign-in?next=%2Frequests%2Fnew"
                className="underline underline-offset-4"
              >
                Sign in
              </Link>{" "}
              to complete this request.
            </p>
          )}
          </div>
          {error ? (
            <p
              role="alert"
              className="max-w-xs text-sm text-signal sm:text-right"
            >
              {error}
            </p>
          ) : signedIn ? (
            <p className="text-xs text-ink-soft">
              {canCall ? (
                "The agent starts calling as soon as you send this."
              ) : (
                "Calling remains disabled until your account is approved."
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
