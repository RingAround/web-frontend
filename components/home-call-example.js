"use client";

import { useState } from "react";
import { CallCount, CallList, RequestSummaryCard } from "./request-board";

const SERVICE_CALLS = [
  {
    business: "Soundview Event Electric",
    status: "quoted",
    detail: "$950 estimate · setup and power distribution included",
  },
  {
    business: "Cascade Lighting & Electric",
    status: "calling",
    detail: "Confirming venue access, lighting requirements, and availability",
  },
  {
    business: "Emerald City Event Power",
    status: "queued",
    detail: "Awaiting outreach",
  },
];
const CALLBACK_CALLS = [
  {
    business: "Your saved callback number",
    status: "calling",
    detail: "Presenting rental options and pickup requirements",
  },
];

export function HomeCallExample() {
  const [scenario, setScenario] = useState("services");
  const callback = scenario === "callback";
  return (
    <>
      <div
        role="group"
        aria-label="Example call workflow"
        className="mb-3 flex rounded-full border border-line bg-paper/80 p-1 text-xs"
      >
        {[
          ["services", "Find services"],
          ["callback", "Call me"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={scenario === value}
            onClick={() => setScenario(value)}
            className={`min-h-9 flex-1 rounded-full px-3 py-2 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${scenario === value ? "bg-signal text-on-signal" : "text-ink-soft hover:text-signal"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-[28px] border border-line bg-surface/90 p-2 shadow-[0_30px_80px_-30px_rgb(21_20_15/0.35),0_0_45px_-25px_var(--signal)] backdrop-blur">
        <RequestSummaryCard
          label={callback ? "Call me" : "Service request"}
          statusLabel="Example"
          title={
            callback
              ? "Call me with weekend car rental options"
              : "Find an electrician for conference lighting"
          }
          where={callback ? "Your saved number" : "Thinkspace Seattle"}
          when={callback ? "After researching" : "Before Friday"}
          budget={callback ? "Phone briefing" : "$750–$1,250"}
          whereLabel={callback ? "Who" : "Where"}
          budgetLabel={callback ? "Result" : "Budget"}
        />
        <CallList calls={callback ? CALLBACK_CALLS : SERVICE_CALLS} />
        {callback && (
          <p className="mx-3 mb-3 rounded-xl border border-line bg-paper/70 p-3 text-xs leading-relaxed text-ink-soft">
            Example briefing: two rental options identified, with prices, pickup
            hours, and deposit requirements to confirm.
          </p>
        )}
        <CallCount placed={callback ? 1 : 2} cap={callback ? 1 : 5}>
          <span className="flex items-center gap-2 text-signal-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-signal motion-safe:animate-pulse" />
            Example call in progress
          </span>
        </CallCount>
      </div>
    </>
  );
}
