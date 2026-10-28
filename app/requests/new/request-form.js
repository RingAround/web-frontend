"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow } from "@/components/icons";
import {
  FieldError,
  RadioDot,
  cardChoiceClass,
  fieldBase,
  focusRing,
  inputClass,
} from "@/components/form-parts";
import { PENDING_REQUEST_KEY, REQUEST_DRAFT_KEY } from "@/lib/account";
import {
  ARRIVAL_WINDOWS,
  INSTRUCTIONS_LIMIT,
  TIME_ZONES,
  TIMING_OPTIONS,
  describeArrival,
  describeBudget,
  describeTiming,
  makeRequestSchema,
  normalizePhone,
  timeZoneLabel,
  todayIn,
} from "@/lib/request";
import {
  SERVICE_CATEGORIES,
  categoryLabel,
  suggestCategory,
} from "@/lib/service-categories";
import { useBrowserValue } from "@/lib/use-browser-value";
import { RequestSummary, ReviewPanel } from "./request-summary";
import { saveLocationAction, sendRequest } from "./actions";
import CallbackNumber from "./callback-number";

const DRAFT_KEY = REQUEST_DRAFT_KEY;

const REQUEST_STEPS = [
  { id: 0, label: "Call details", fields: ["destination", "serviceDescription", "serviceCategory"] },
  { id: 2, label: "Location", fields: ["location"] },
  { id: 3, label: "Timing", fields: ["timing", "arrivalWindow", "timeZone"] },
  { id: 4, label: "Budget", fields: ["budget"] },
  { id: 5, label: "Instructions", fields: ["specialInstructions"] },
];

function requestFromForm(form, categoryId, savedLocation, timeZone) {
  const directCall = form.callMode !== "discover";
  return {
    destination: form.callMode === "callback"
      ? { mode: "callback" }
      : directCall
        ? { mode: "direct", name: form.businessName, phone: form.businessPhone }
        : { mode: "discover" },
    serviceDescription: form.service,
    serviceCategory: directCall ? "other" : (categoryId ?? "other"),
    location: savedLocation
      ? { savedLocationId: savedLocation.id, label: savedLocation.label, formattedAddress: savedLocation.address }
      : { savedLocationId: null, label: form.otherLabel, formattedAddress: form.otherAddress },
    timing: timingFromForm(form),
    arrivalWindow: form.arrival,
    timeZone,
    budget: directCall ? { mode: "unsure" } : budgetFromForm(form),
    specialInstructions: form.instructions,
  };
}

const EMPTY_FORM = {
  callMode: "discover",
  businessName: "",
  businessPhone: "",
  service: "",
  category: null, // null = use the suggestion from the description
  locationId: "other", // a saved location id, or "other" for a new address
  otherAddress: "",
  otherLabel: "",
  saveLocation: true,
  timing: "asap",
  date: "",
  rangeStart: "",
  rangeEnd: "",
  arrival: "any",
  timeZone: "", // "" = follow the location, then the browser
  budget: "unsure",
  budgetMin: "",
  budgetMax: "",
  instructions: "",
};

// Schema issue path -> form field. Inputs use the id `field-<name>`.
const FIELD_FOR_PATH = {
  "destination.mode": "callMode",
  "destination.name": "businessName",
  "destination.phone": "businessPhone",
  serviceDescription: "service",
  serviceCategory: "service",
  "location.formattedAddress": "otherAddress",
  "location.label": "otherLabel",
  timing: "timing",
  "timing.mode": "timing",
  "timing.date": "date",
  "timing.start": "rangeStart",
  "timing.end": "rangeEnd",
  "budget.min": "budgetMin",
  "budget.max": "budgetMax",
  specialInstructions: "instructions",
};
const FIELD_ORDER = Object.values(FIELD_FOR_PATH);

// Editing a field also clears errors on the fields it's checked against.
const RELATED_FIELDS = {
  locationId: ["otherAddress", "otherLabel"],
  timing: ["date", "rangeStart", "rangeEnd"],
  rangeStart: ["rangeEnd"],
  budget: ["budgetMin", "budgetMax"],
  budgetMin: ["budgetMax"],
  budgetMax: ["budgetMin"],
};

const cardClass =
  "rounded-2xl border bg-surface/70 p-4 transition-colors sm:p-5";
const segmentClass = `flex cursor-pointer items-center justify-center rounded-2xl border border-line bg-surface px-3 py-3 text-sm font-medium transition hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper ${focusRing}`;
const chipClass = `inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm transition hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper ${focusRing}`;

function readDraft(locations, draftKey) {
  const emptyForm = {
    ...EMPTY_FORM,
    locationId:
      locations.find((location) => location.isDefault)?.id ||
      locations[0]?.id ||
      "other",
  };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(draftKey) ??
        window.localStorage.getItem(DRAFT_KEY) ??
        "null",
    );
    if (!saved || typeof saved !== "object") return emptyForm;
    // Keep only fields the form knows, with the right types and ids that still
    // exist; a stale or hand-edited draft could otherwise submit unknown values.
    const draft = Object.fromEntries(
      Object.entries(emptyForm).map(([key, fallback]) => [
        key,
        typeof fallback === "string" && typeof saved[key] !== "string"
          ? fallback
          : (saved[key] ?? fallback),
      ]),
    );
    const known = (value, options) => options.some((o) => o.id === value);
    if (draft.callMode !== "direct" && draft.callMode !== "callback")
      draft.callMode = "discover";
    if (!known(draft.category, SERVICE_CATEGORIES)) draft.category = null;
    if (draft.locationId !== "other" && !known(draft.locationId, locations))
      draft.locationId = emptyForm.locationId;
    if (!known(draft.timing, TIMING_OPTIONS)) draft.timing = emptyForm.timing;
    if (!known(draft.arrival, ARRIVAL_WINDOWS))
      draft.arrival = emptyForm.arrival;
    if (draft.budget !== "unsure" && draft.budget !== "range")
      draft.budget = emptyForm.budget;
    if (typeof draft.saveLocation !== "boolean")
      draft.saveLocation = emptyForm.saveLocation;
    return draft;
  } catch {
    return emptyForm;
  }
}

function toAmount(value) {
  const cleaned = value.replace(/,/g, "").trim();
  return cleaned === "" ? null : Number(cleaned);
}

function timingFromForm(form) {
  if (form.timing === "date") return { mode: "date", date: form.date };
  if (form.timing === "range")
    return { mode: "range", start: form.rangeStart, end: form.rangeEnd };
  return { mode: form.timing };
}

function budgetFromForm(form) {
  if (form.budget !== "range") return { mode: "unsure" };
  return {
    mode: "range",
    min: toAmount(form.budgetMin),
    max: toAmount(form.budgetMax),
  };
}

function isVague(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length < 4;
}

function listAssumptions(view, form, savedNow) {
  const notes = [];
  if (view.category?.source === "suggested") {
    notes.push(
      `We guessed the category from your description: ${view.category.label}.`,
    );
  } else if (!view.category) {
    notes.push("No category picked — the agent will go by your description.");
  }
  if (savedNow) {
    notes.push("We saved this address to your locations.");
  } else if (view.location.address && view.location.isNew) {
    notes.push("This address won’t be saved to your locations.");
  } else if (view.location.address && !view.location.isDefault) {
    notes.push(
      `This request is for ${view.location.label}, not your default location.`,
    );
  }
  if (form.arrival === "any") notes.push("Any arrival time works for you.");
  notes.push(
    `Times are in ${view.timeZone.label} time (${view.timeZone.id}), ${view.timeZone.source}.`,
  );
  if (form.budget === "unsure" && form.callMode === "discover")
    notes.push("No budget yet — you’ll compare quotes before deciding.");
  if (form.callMode === "direct")
    notes.push(
      `Only call ${form.businessName.trim()} at ${normalizePhone(form.businessPhone)}. No provider search is requested.`,
    );
  return notes;
}

export default function RequestForm({
  profile,
  initialLocations,
  userId,
  canCall,
  hasApplication,
}) {
  const inBrowser = useBrowserValue(() => true);
  const profileLocation = profile
    ? {
        id: "profile-default",
        label: "Default address",
        address: profile.defaultAddress,
        isDefault: true,
      }
    : null;
  const draftKey = userId
    ? `${DRAFT_KEY}:${encodeURIComponent(userId)}`
    : DRAFT_KEY;
  return inBrowser ? (
    <RequestFormBody
      profileLocation={profileLocation}
      callbackPhone={profile?.phone || ""}
      profile={profile}
      initialLocations={initialLocations}
      draftKey={draftKey}
      canCall={canCall}
      hasApplication={hasApplication}
      signedIn={Boolean(userId)}
    />
  ) : (
    <FormSkeleton />
  );
}

function RequestFormBody({
  profileLocation,
  callbackPhone: initialCallbackPhone,
  profile,
  initialLocations,
  draftKey,
  canCall,
  hasApplication,
  signedIn,
}) {
  const router = useRouter();
  const [callbackPhone, setCallbackPhone] = useState(initialCallbackPhone);
  // The profile address comes first as the default; addresses saved from this form follow.
  const [savedLocations, setSavedLocations] = useState(initialLocations);
  const locations = profileLocation
    ? [profileLocation, ...savedLocations]
    : savedLocations;
  const [form, setForm] = useState(() => readDraft(locations, draftKey));
  // Claim an anonymous draft once after sign-in, keeping account drafts separate.
  useEffect(() => {
    if (!signedIn) return;
    try {
      if (window.localStorage.getItem(draftKey) !== null) return;
      const guestDraft = window.localStorage.getItem(DRAFT_KEY);
      if (guestDraft === null) return;
      window.localStorage.setItem(draftKey, guestDraft);
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // The form remains usable when browser storage is unavailable.
    }
  }, [draftKey, signedIn]);
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const [review, setReview] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const saveTimer = useRef(null);
  const browserTimeZone = useBrowserValue(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const suggested = suggestCategory(form.service);
  const selfCallback = form.callMode === "callback";
  const directCall = form.callMode !== "discover";
  const categoryId = form.category ?? suggested;
  const savedLocation = locations.find((l) => l.id === form.locationId) ?? null;
  const timeZone =
    form.timeZone ||
    savedLocation?.timeZone ||
    browserTimeZone ||
    "America/Los_Angeles";
  const timeZoneSource = form.timeZone
    ? "chosen by you"
    : savedLocation?.timeZone
      ? `from ${savedLocation.label}`
      : "from your browser";
  // Today where the job is, re-read every render so it can't go stale overnight.
  const today = useBrowserValue(() => todayIn(timeZone));
  const timeZoneOptions = TIME_ZONES.some((z) => z.id === timeZone)
    ? TIME_ZONES
    : [...TIME_ZONES, { id: timeZone, label: timeZone }];

  const timing = timingFromForm(form);
  const budget = budgetFromForm(form);
  const timingText = describeTiming(timing);
  const budgetText = describeBudget(budget);
  const validation = makeRequestSchema(todayIn(timeZone)).safeParse(
    requestFromForm(form, categoryId, savedLocation, timeZone),
  );
  const issues = validation.success ? [] : validation.error.issues;
  const steps = REQUEST_STEPS.filter((step) => !directCall || step.id !== 4);
  const completed = steps.map((step) =>
    !issues.some((issue) => step.fields.includes(issue.path[0])) &&
    !(step.id === 0 && selfCallback && signedIn && !/^\+[1-9]\d{6,14}$/.test(normalizePhone(callbackPhone))),
  );
  const stepIndex = steps.findIndex((step) => step.id === activeStep);
  const reviewReady = validation.success && completed.every(Boolean);
  const view = {
    destination: selfCallback
      ? {
          mode: "callback",
          name: signedIn ? "Your saved callback number" : "Your callback number",
          phone: callbackPhone || "Added after sign-in",
        }
      : directCall
        ? {
            mode: "direct",
            name: form.businessName.trim(),
            phone: normalizePhone(form.businessPhone),
          }
        : { mode: "discover" },
    service: form.service.trim(),
    category:
      categoryId && !directCall
        ? {
            label: categoryLabel(categoryId),
            source: form.category ? "chosen" : "suggested",
          }
        : null,
    location: savedLocation
      ? {
          label: savedLocation.label,
          address: savedLocation.address,
          isDefault: savedLocation.isDefault,
        }
      : {
          label: form.otherLabel.trim() || "New address",
          address: form.otherAddress.trim(),
          isDefault: false,
          isNew: true,
        },
    timing: timingText,
    arrival: describeArrival(form.arrival),
    timeZone: {
      id: timeZone,
      label: timeZoneLabel(timeZone),
      source: timeZoneSource,
    },
    budget: directCall ? "No payment authorized" : budgetText,
    instructions: form.instructions.trim(),
    answered: completed,
  };

  function update(patch) {
    const next = { ...form, ...patch };
    setForm(next);
    if (Object.keys(errors).length > 0) {
      const cleared = Object.keys(patch).flatMap((key) => [
        key,
        ...(RELATED_FIELDS[key] ?? []),
      ]);
      setErrors((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([key]) => key !== "form" && !cleared.includes(key),
          ),
        ),
      );
    }
    clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(next));
        setSaveState("saved");
      } catch {
        setSaveState("unavailable");
      }
    }, 500);
  }

  function startOver() {
    clearTimeout(saveTimer.current);
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Storage blocked: nothing to clear.
    }
    setForm(readDraft(locations, draftKey));
    setErrors({});
    setSaveState("idle");
    setActiveStep(0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!reviewReady) return;
    const request = requestFromForm(form, categoryId, savedLocation, timeZone);
    const result = makeRequestSchema(todayIn(timeZone)).safeParse(request);
    if (!result.success) {
      const next = {};
      for (const issue of result.error.issues) {
        const field = FIELD_FOR_PATH[issue.path.join(".")];
        if (field && !next[field]) next[field] = issue.message;
      }
      next.form =
        "A few answers need attention — check the highlighted fields.";
      setErrors(next);
      const first = FIELD_ORDER.find((field) => next[field]);
      if (first) document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setErrors({});
    let reviewView = view;
    let savedNow = false;
    if (
      signedIn &&
      !savedLocation &&
      form.saveLocation &&
      result.data.location.formattedAddress.length >= 8
    ) {
      const address = result.data.location.formattedAddress;
      const match = locations.find(
        (l) => l.address.toLowerCase() === address.toLowerCase(),
      );
      let location = match;
      if (!match) {
        const saved = await saveLocationAction({
          label: result.data.location.label,
          address,
          timeZone,
        });
        if (saved.location) {
          setSavedLocations((current) =>
            current.some((l) => l.id === saved.location.id)
              ? current
              : [...current, saved.location],
          );
          location = saved.location;
          savedNow = saved.added;
        }
      }
      // Saving the address is a convenience: if it failed, the request still
      // goes ahead with the address as typed.
      if (location) {
        update({ locationId: location.id, otherAddress: "", otherLabel: "" });
        reviewView = {
          ...view,
          location: {
            label: location.label,
            address: location.address,
            isDefault: location.isDefault,
          },
        };
      }
    }
    // Flush the latest edits before the visitor leaves the review to sign in.
    clearTimeout(saveTimer.current);
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {
      // Reviewing does not require browser storage.
    }
    setReview({
      request: result.data,
      view: reviewView,
      assumptions: listAssumptions(reviewView, form, savedNow),
    });
    window.scrollTo({ top: 0 });
  }

  // Approved accounts start the agent; the server checks again. Everyone else
  // goes to checkout or the account review page, and the draft stays saved.
  // Resolves with an error message, or navigates away.
  async function send() {
    if (!signedIn) return "Sign in to complete this request.";
    let applied = hasApplication;
    if (canCall) {
      const result = await sendRequest({ request: review.request });
      if (result.sessionId) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // Storage blocked: the stale draft is harmless.
        }
        router.push(`/requests/${result.sessionId}`);
        return null;
      }
      if (!result.needsAccount) return result.error;
      applied = result.hasApplication;
    }
    try {
      window.sessionStorage.setItem(PENDING_REQUEST_KEY, "1");
    } catch {
      // Storage blocked: the draft itself is still saved.
    }
    router.push(applied ? "/account/pending" : "/checkout/starter");
    return null;
  }

  if (review) {
    return (
      <ReviewPanel
        {...review}
        canCall={canCall}
        signedIn={signedIn}
        onEdit={() => setReview(null)}
        onSend={send}
      />
    );
  }

  const describedBy = (field) =>
    errors[field] ? `field-${field}-error` : undefined;

  return (
    <div className="request-workspace mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
      <FormHeading saveState={saveState} />

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        <form noValidate onSubmit={handleSubmit} className="col-start-1 row-start-1 flex max-h-full min-h-0 min-w-0 flex-col rounded-3xl border border-line bg-surface/40">
          <nav aria-label="Request steps" className="border-b border-line px-3 py-4 sm:px-5">
            <ol className="flex items-start">
              {steps.map((step, index) => (
                <li key={step.id} className="relative min-w-0 flex-1">
                  {index < steps.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 right-[-50%] top-3.5 h-px ${completed[index] ? "bg-sage/50" : "bg-line"}`} />}
                  <button
                    type="button"
                    aria-current={activeStep === step.id ? "step" : undefined}
                    aria-controls={`request-step-${step.id}`}
                    aria-label={`${step.label}${completed[index] ? ", complete" : ", incomplete"}`}
                    onClick={() => setActiveStep(step.id)}
                    className="relative flex w-full flex-col items-center gap-2 rounded-lg px-0.5 text-[10px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-signal sm:text-xs"
                  >
                    <span aria-hidden="true" className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${activeStep === step.id ? "border-signal bg-signal text-on-signal ring-4 ring-signal/10" : completed[index] ? "border-sage bg-sage-soft text-sage" : "border-line bg-paper text-ink-soft"}`}>
                      {completed[index] ? "✓" : index + 1}
                    </span>
                    <span className={activeStep === step.id ? "text-ink" : "text-ink-soft"}>{step.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="request-step-content min-h-0 overflow-y-auto p-3 sm:p-4">
          <section
            id="request-step-0"
            hidden={activeStep !== 0}
            className={cardClass + " border-line"}
            aria-labelledby="call-mode-heading"
          >
            <h2 id="call-mode-heading" className="font-display text-2xl leading-tight tracking-tight">
              Who should RingAround call?
            </h2>
            <fieldset className="mt-4 grid gap-2 sm:grid-cols-3">
              <legend className="sr-only">Call destination</legend>
              {[
                [
                  "discover",
                  "Find businesses for me",
                  "Search for relevant providers and request pricing or availability.",
                ],
                [
                  "direct",
                  "Call a specific business",
                  "Provide the business name, phone number, and task.",
                ],
                [
                  "callback",
                  "Call me",
                  "Receive a call on your own number with research findings or a briefing you request.",
                ],
              ].map(([mode, title, hint]) => (
                <label key={mode} className={cardChoiceClass}>
                  <input
                    id={mode === "discover" ? "field-callMode" : undefined}
                    type="radio"
                    name="callMode"
                    value={mode}
                    checked={form.callMode === mode}
                    onChange={() =>
                      update({
                        callMode: mode,
                        locationId:
                          mode === "discover"
                            ? locations.find((location) => location.isDefault)
                                ?.id || "other"
                            : "other",
                        otherAddress: "",
                        otherLabel: "",
                        saveLocation: mode === "discover",
                      })
                    }
                    className="sr-only"
                  />
                  <RadioDot />
                  <span>
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                      {hint}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            {selfCallback && (
              <p className="mt-5 rounded-xl border border-line bg-paper p-4 text-sm leading-relaxed text-ink-soft">
                {signedIn ? (
                  <>
                    RingAround will call you at your saved number:{" "}
                    <span className="font-medium text-ink">{callbackPhone}</span>.
                  </>
                ) : (
                  "After sign-in, add your own phone number to your profile so RingAround can call you with the information you request."
                )}{" "}
                Use this for research findings or a spoken briefing. The call
                takes place as part of this request.
              </p>
            )}
            {selfCallback && signedIn && (
              <CallbackNumber profile={profile} onSaved={setCallbackPhone} />
            )}
            {directCall && !selfCallback && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="field-businessName"
                    className="text-sm font-medium"
                  >
                    Business name
                  </label>
                  <input
                    id="field-businessName"
                    value={form.businessName}
                    maxLength={120}
                    onChange={(event) =>
                      update({ businessName: event.target.value })
                    }
                    className={inputClass}
                    aria-invalid={Boolean(errors.businessName)}
                    aria-describedby={describedBy("businessName")}
                  />
                  <FieldError
                    field="businessName"
                    message={errors.businessName}
                  />
                </div>
                <div>
                  <label
                    htmlFor="field-businessPhone"
                    className="text-sm font-medium"
                  >
                    Business phone number
                  </label>
                  <input
                    id="field-businessPhone"
                    type="tel"
                    value={form.businessPhone}
                    maxLength={40}
                    placeholder="+1 206 555 0123"
                    onChange={(event) =>
                      update({ businessPhone: event.target.value })
                    }
                    className={inputClass}
                    aria-invalid={Boolean(errors.businessPhone)}
                    aria-describedby={describedBy("businessPhone")}
                  />
                  <FieldError
                    field="businessPhone"
                    message={errors.businessPhone}
                  />
                </div>
                <p className="text-xs leading-relaxed text-ink-soft sm:col-span-2">
                  Use the business’s published number. This starts an
                  information-gathering call after submission; it does not
                  schedule a future call or authorize bookings or payments.
                </p>
              </div>
            )}
          <Question
            step={0} activeStep={activeStep}
            embedded
            id="q-service"
            title={
              selfCallback
                ? "What would you like the call to cover?"
                : directCall
                ? "What should the call accomplish?"
                : "What service do you need?"
            }
            hint={
              selfCallback
                ? "Describe what you want to hear and anything the assistant should research first."
                : directCall
                ? "Explain the question, the context, and the result you need."
                : "Describe the job in your own words."
            }
            invalid={Boolean(errors.service)}
          >
            <label htmlFor="field-service" className="sr-only">
              Describe the job
            </label>
            <textarea
              id="field-service"
              rows={3}
              maxLength={1000}
              value={form.service}
              onChange={(e) => update({ service: e.target.value })}
              placeholder={
                selfCallback
                  ? "e.g. Call me with a briefing on weekend car rental options in Seattle, including prices and pickup requirements."
                  : directCall
                    ? "e.g. Call the hotel to confirm whether late check-in is available after midnight."
                    : "e.g. Deep cleaning for a 2-bedroom apartment before move-in"
              }
              className={`${inputClass} resize-y`}
              aria-invalid={Boolean(errors.service)}
              aria-describedby={describedBy("service")}
            />
            <FieldError field="service" message={errors.service} />
            {!errors.service && isVague(form.service) && (
              <p className="mt-2 text-sm text-amber">
                {directCall
                  ? "Include the question you need answered and any relevant context."
                  : "Add a detail or two — size, what’s wrong, or how often — so providers can quote accurately."}
              </p>
            )}

            {!directCall && (
              <fieldset className="mt-2">
                <legend className="text-sm font-medium">
                  Category{" "}
                  <span className="font-normal text-ink-soft">
                    {form.category
                      ? ""
                      : suggested
                        ? "— suggested from your description"
                        : "— optional"}
                  </span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map((c) => (
                    <label key={c.id} className={chipClass}>
                      <input
                        type="radio"
                        name="category"
                        value={c.id}
                        checked={categoryId === c.id}
                        onChange={() => update({ category: c.id })}
                        className="sr-only"
                      />
                      {c.label}
                      {!form.category && suggested === c.id && (
                        <>
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-signal"
                          />
                          <span className="sr-only">(suggested)</span>
                        </>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </Question>
          </section>

          <Question
            step={2} activeStep={activeStep}
            id="q-where"
            title={
              directCall
                ? "Relevant address (optional)"
                : "Where is the service needed?"
            }
            hint={
              directCall
                ? "Add an address only if it is relevant to this call."
                : locations.length > 0
                  ? "Your default location is selected — pick another for this request only."
                  : "Add the address where the work happens."
            }
            invalid={Boolean(errors.otherAddress || errors.otherLabel)}
          >
            {locations.length > 0 && (
              <fieldset>
                <legend className="sr-only">Service location</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {locations.map((loc) => (
                    <label key={loc.id} className={cardChoiceClass}>
                      <input
                        type="radio"
                        name="location"
                        value={loc.id}
                        checked={form.locationId === loc.id}
                        onChange={() =>
                          update({ locationId: loc.id, timeZone: "" })
                        }
                        className="sr-only"
                      />
                      <RadioDot />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 font-medium">
                          {loc.label}
                          {loc.isDefault && (
                            <span className="rounded-full bg-sage-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sage">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-soft">
                          {loc.address}
                        </span>
                      </span>
                    </label>
                  ))}
                  <label
                    className={`${cardChoiceClass} border-dashed sm:col-span-2`}
                  >
                    <input
                      type="radio"
                      name="location"
                      value="other"
                      checked={!savedLocation}
                      onChange={() =>
                        update({ locationId: "other", timeZone: "" })
                      }
                      className="sr-only"
                    />
                    <RadioDot />
                    <span>
                      <span className="block font-medium">
                        Use another address
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-soft">
                        For a job somewhere else
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
            )}

            {!savedLocation && (
              <div className={locations.length > 0 ? "mt-5" : ""}>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
                  <div>
                    <label
                      htmlFor="field-otherAddress"
                      className="text-sm font-medium"
                    >
                      Address
                    </label>
                    <input
                      id="field-otherAddress"
                      autoComplete="street-address"
                      value={form.otherAddress}
                      onChange={(e) => update({ otherAddress: e.target.value })}
                      placeholder="Street, city, state, ZIP"
                      className={inputClass}
                      aria-invalid={Boolean(errors.otherAddress)}
                      aria-describedby={describedBy("otherAddress")}
                    />
                    <FieldError
                      field="otherAddress"
                      message={errors.otherAddress}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="field-otherLabel"
                      className="text-sm font-medium"
                    >
                      Label{" "}
                      <span className="font-normal text-ink-soft">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="field-otherLabel"
                      maxLength={60}
                      value={form.otherLabel}
                      onChange={(e) => update({ otherLabel: e.target.value })}
                      placeholder="e.g. Eastside office"
                      className={inputClass}
                      aria-invalid={Boolean(errors.otherLabel)}
                      aria-describedby={describedBy("otherLabel")}
                    />
                    <FieldError
                      field="otherLabel"
                      message={errors.otherLabel}
                    />
                  </div>
                </div>
                {signedIn && (
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.saveLocation}
                      onChange={(e) => update({ saveLocation: e.target.checked })}
                      className="h-4 w-4 accent-signal"
                    />
                    Save to my locations
                  </label>
                )}
              </div>
            )}
            {locations.length > 0 && (
              <p className="mt-4 text-xs text-ink-soft">
                Choosing a location here doesn’t change your default.
              </p>
            )}
          </Question>

          <Question
            step={3} activeStep={activeStep}
            id="q-when"
            title={
              directCall
                ? "When do you need the information?"
                : "When do you need it?"
            }
            invalid={Boolean(
              errors.timing ||
              errors.date ||
              errors.rangeStart ||
              errors.rangeEnd,
            )}
          >
            <fieldset>
              <legend className="sr-only">Timing</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIMING_OPTIONS.map((opt, i) => (
                  <label key={opt.id} className={segmentClass}>
                    <input
                      id={i === 0 ? "field-timing" : undefined}
                      type="radio"
                      name="timing"
                      value={opt.id}
                      checked={form.timing === opt.id}
                      onChange={() => update({ timing: opt.id })}
                      className="sr-only"
                      aria-describedby={describedBy("timing")}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <FieldError field="timing" message={errors.timing} />
            </fieldset>

            {form.timing === "date" && (
              <div className="mt-4 max-w-xs">
                <label htmlFor="field-date" className="text-sm font-medium">
                  Date
                </label>
                <input
                  id="field-date"
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => update({ date: e.target.value })}
                  className={inputClass}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={describedBy("date")}
                />
                <FieldError field="date" message={errors.date} />
              </div>
            )}
            {form.timing === "range" && (
              <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="field-rangeStart"
                    className="text-sm font-medium"
                  >
                    From
                  </label>
                  <input
                    id="field-rangeStart"
                    type="date"
                    min={today}
                    value={form.rangeStart}
                    onChange={(e) => update({ rangeStart: e.target.value })}
                    className={inputClass}
                    aria-invalid={Boolean(errors.rangeStart)}
                    aria-describedby={describedBy("rangeStart")}
                  />
                  <FieldError field="rangeStart" message={errors.rangeStart} />
                </div>
                <div>
                  <label
                    htmlFor="field-rangeEnd"
                    className="text-sm font-medium"
                  >
                    To
                  </label>
                  <input
                    id="field-rangeEnd"
                    type="date"
                    min={form.rangeStart || today}
                    value={form.rangeEnd}
                    onChange={(e) => update({ rangeEnd: e.target.value })}
                    className={inputClass}
                    aria-invalid={Boolean(errors.rangeEnd)}
                    aria-describedby={describedBy("rangeEnd")}
                  />
                  <FieldError field="rangeEnd" message={errors.rangeEnd} />
                </div>
              </div>
            )}

            <fieldset className="mt-6">
              <legend className="text-sm font-medium">
                Preferred arrival{" "}
                <span className="font-normal text-ink-soft">(optional)</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {ARRIVAL_WINDOWS.map((slot) => (
                  <label key={slot.id} className={chipClass}>
                    <input
                      type="radio"
                      name="arrival"
                      value={slot.id}
                      checked={form.arrival === slot.id}
                      onChange={() => update({ arrival: slot.id })}
                      className="sr-only"
                    />
                    {slot.label}
                    {slot.hint && (
                      <span className="opacity-60">{slot.hint}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <label htmlFor="field-timeZone" className="text-ink-soft">
                Time zone
              </label>
              <select
                id="field-timeZone"
                value={timeZone}
                onChange={(e) => update({ timeZone: e.target.value })}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-ink focus:ring-4 focus:ring-ink/5"
              >
                {timeZoneOptions.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label} — {z.id}
                  </option>
                ))}
              </select>
              <span className="text-xs text-ink-soft">{timeZoneSource}</span>
            </div>
          </Question>

          {!directCall && (
            <Question
              step={4} activeStep={activeStep}
              id="q-budget"
              title="What’s your budget?"
              hint="Optional — it’s fine to get quotes first."
              invalid={Boolean(errors.budgetMin || errors.budgetMax)}
            >
              <fieldset>
                <legend className="sr-only">Budget</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={cardChoiceClass}>
                    <input
                      type="radio"
                      name="budget"
                      value="unsure"
                      checked={form.budget === "unsure"}
                      onChange={() => update({ budget: "unsure" })}
                      className="sr-only"
                    />
                    <RadioDot />
                    <span>
                      <span className="block font-medium">
                        Not sure — get quotes first
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-soft">
                        Compare prices before setting a number.
                      </span>
                    </span>
                  </label>
                  <label className={cardChoiceClass}>
                    <input
                      type="radio"
                      name="budget"
                      value="range"
                      checked={form.budget === "range"}
                      onChange={() => update({ budget: "range" })}
                      className="sr-only"
                    />
                    <RadioDot />
                    <span>
                      <span className="block font-medium">I have a budget</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">
                        Set a minimum, maximum, or both.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
              {form.budget === "range" && (
                <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
                  <MoneyField
                    field="budgetMin"
                    label="Minimum"
                    placeholder="150"
                    value={form.budgetMin}
                    error={errors.budgetMin}
                    onChange={(value) => update({ budgetMin: value })}
                  />
                  <MoneyField
                    field="budgetMax"
                    label="Maximum"
                    placeholder="300"
                    value={form.budgetMax}
                    error={errors.budgetMax}
                    onChange={(value) => update({ budgetMax: value })}
                  />
                </div>
              )}
            </Question>
          )}

          <Question
            step={5} activeStep={activeStep}
            id="q-notes"
            title="Special agent instructions"
            hint="Preferences the agent should mention or ask about."
            optional
            invalid={Boolean(errors.instructions)}
          >
            <label htmlFor="field-instructions" className="sr-only">
              Special agent instructions
            </label>
            <textarea
              id="field-instructions"
              rows={4}
              maxLength={INSTRUCTIONS_LIMIT}
              value={form.instructions}
              onChange={(e) => update({ instructions: e.target.value })}
              placeholder="Anything else the agent should know? e.g., pet-friendly products, weekend visits only, licensed/insured, do not call before 10 a.m."
              className={`${inputClass} resize-y`}
              aria-invalid={Boolean(errors.instructions)}
              aria-describedby={
                errors.instructions
                  ? "field-instructions-error"
                  : "instructions-help"
              }
            />
            <div className="mt-2 flex items-start justify-between gap-4 text-xs text-ink-soft">
              <p id="instructions-help">
                Treated as preferences — they don’t override your approvals or
                the agent’s call rules.
              </p>
              <span className="shrink-0 tabular-nums">
                {form.instructions.length}/{INSTRUCTIONS_LIMIT}
              </span>
            </div>
            <FieldError field="instructions" message={errors.instructions} />
          </Question>

            {issues.some((issue) => steps[stepIndex].fields.includes(issue.path[0])) && (
              <p className="mt-3 px-1 text-sm text-ink-soft" aria-live="polite">
                {[...new Set(issues.filter((issue) => steps[stepIndex].fields.includes(issue.path[0])).map((issue) => issue.message))].join(" ")}
              </p>
            )}
          </div>
          <div className="shrink-0 border-t border-line p-3 sm:px-5 sm:py-4">
            {errors.form && (
              <p role="alert" className="mb-4 text-sm font-medium text-signal">
                {errors.form}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={startOver}
                className="self-start text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                Start over
              </button>
              <div className="flex items-center gap-2">
                <button type="button" disabled={stepIndex === 0} onClick={() => setActiveStep(steps[stepIndex - 1].id)} className="rounded-full border border-line px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-35">Back</button>
                <button type="button" disabled={stepIndex === steps.length - 1} onClick={() => setActiveStep(steps[stepIndex + 1].id)} className="rounded-full border border-line px-3 py-2 text-sm font-medium hover:border-ink disabled:cursor-not-allowed disabled:opacity-35">Next</button>
                <button
                  type="submit"
                  disabled={!reviewReady}
                  aria-describedby="review-readiness"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-medium text-on-signal transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink-soft disabled:shadow-none"
                >
                  Review request <Arrow />
                </button>
              </div>
            </div>
            <p id="review-readiness" aria-live="polite" className="mt-2 text-xs text-ink-soft">
              {reviewReady ? "Ready to review. Nothing is sent until you confirm." : `Complete ${steps.filter((_, index) => !completed[index]).map((step) => step.label.toLowerCase()).join(" and ")} to review. You can explore any step.`}
            </p>
          </div>
        </form>

        <aside aria-label="Request summary" className="request-summary-panel hidden max-h-full min-h-0 min-w-0 overflow-y-auto lg:col-start-2 lg:row-start-1 lg:block">
          <div>
            <RequestSummary view={view} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function FormHeading({ saveState }) {
  const status = {
    idle: "Drafts save on this device",
    saving: "Saving draft…",
    saved: "Draft saved on this device",
    unavailable: "Drafts can’t be saved in this browser",
  }[saveState];
  const dot = {
    idle: "bg-ink/25",
    saving: "bg-amber",
    saved: "bg-sage",
    unavailable: "bg-signal",
  }[saveState];
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div>
        <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Create a call request
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Explore the steps in any order. Review when the required details are complete.
        </p>
      </div>
      <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {status}
      </p>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div
      className="request-workspace mx-auto w-full max-w-6xl px-4 py-4 sm:px-6"
      aria-busy="true"
    >
      <FormHeading saveState="idle" />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="col-start-1 row-start-1 h-96 animate-pulse rounded-3xl border border-line bg-surface/50" />
        <div className="hidden h-96 animate-pulse rounded-[28px] border border-line bg-surface/50 lg:col-start-2 lg:row-start-1 lg:block" />
      </div>
    </div>
  );
}

function Question({
  embedded = false,
  step,
  activeStep,
  id,
  title,
  hint,
  optional = false,
  invalid = false,
  children,
}) {
  return (
    <section
      id={embedded ? undefined : `request-step-${step}`}
      hidden={step !== activeStep}
      aria-labelledby={`${id}-title`}
      className={embedded ? "mt-5 border-t border-line pt-5" : `${cardClass} ${invalid ? "border-signal/50" : "border-line"}`}
    >
      <div className="flex items-baseline gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id={`${id}-title`}
            className="font-display text-2xl leading-tight tracking-tight"
          >
            {title}
          </h2>
          {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
        </div>
        {optional && (
          <span className="shrink-0 rounded-full bg-paper-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
            Optional
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MoneyField({ field, label, placeholder, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={`field-${field}`} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-ink-soft">
          $
        </span>
        <input
          id={`field-${field}`}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder={placeholder}
          className={`${fieldBase} pl-8 pr-4`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `field-${field}-error` : undefined}
        />
      </div>
      <FieldError field={field} message={error} />
    </div>
  );
}
