"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow, CheckGlyph } from "@/components/icons";
import { inputClass } from "@/components/form-parts";
import { hasRequestDraft } from "@/lib/account";
import { submitApplication } from "@/app/account/actions";
import { useBrowserValue } from "@/lib/use-browser-value";

const ROLES = [
  "Property manager",
  "Facilities manager",
  "Office manager",
  "Business owner",
  "Operations lead",
  "Procurement",
  "Other",
];
const EMPTY_DETAILS = { name: "", email: "", company: "", role: "" };

function validate(details) {
  const errors = {};
  if (!details.name.trim()) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
    errors.email = "Enter a valid email address.";
  return errors;
}

export default function ApplicationForm({ defaults }) {
  const router = useRouter();
  const [details, setDetails] = useState(() => ({
    ...EMPTY_DETAILS,
    ...defaults,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const requestWaiting = useBrowserValue(hasRequestDraft);

  function editDetails(patch) {
    setDetails((current) => ({ ...current, ...patch }));
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => key !== "form" && !Object.hasOwn(patch, key),
        ),
      ),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validate(details);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(`application-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await submitApplication({
        name: details.name.trim(),
        email: details.email.trim(),
        company: details.company.trim(),
        role: details.role,
      });
      if (result.error) {
        setErrors({ form: result.error });
        setSubmitting(false);
        return;
      }
      router.push("/account/pending");
    } catch {
      setErrors({
        form: "Your application could not be submitted. Please try again.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal-ink">
        Access application
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        Request access to RingAround.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
        Tell us about your account. Calling access requires review and
        activation. RingAround does not take credit cards or collect any
        payment details.
      </p>
      {requestWaiting && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-sage/30 bg-sage-soft p-4 text-sm text-sage">
          <CheckGlyph className="mt-0.5 h-4 w-4 shrink-0" />
          Your request draft is saved in this browser. You can submit it once
          calling access is enabled.
        </p>
      )}

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <form
          noValidate
          onSubmit={handleSubmit}
          aria-label="Access application"
          className="space-y-7 rounded-2xl border border-line bg-surface/60 p-6 sm:p-8"
        >
          <fieldset
            disabled={submitting}
            className="min-w-0 space-y-5 disabled:opacity-60"
          >
            <legend className="mb-5 text-base font-semibold">
              Your details
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field name="name" label="Full name" error={errors.name}>
                <input
                  id="application-name"
                  name="name"
                  required
                  autoComplete="name"
                  maxLength={120}
                  value={details.name}
                  onChange={(event) =>
                    editDetails({ name: event.target.value })
                  }
                  className={inputClass}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "application-name-error" : undefined
                  }
                />
              </Field>
              <Field name="email" label="Email address" error={errors.email}>
                <input
                  id="application-email"
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={details.email}
                  onChange={(event) =>
                    editDetails({ email: event.target.value })
                  }
                  className={inputClass}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "application-email-error" : undefined
                  }
                />
              </Field>
              <Field name="company" label="Company" optional>
                <input
                  id="application-company"
                  name="company"
                  autoComplete="organization"
                  maxLength={120}
                  value={details.company}
                  onChange={(event) =>
                    editDetails({ company: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field name="role" label="Role" optional>
                <select
                  id="application-role"
                  name="role"
                  value={details.role}
                  onChange={(event) =>
                    editDetails({ role: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Select a role</option>
                  {ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>

          {errors.form && (
            <p
              role="alert"
              className="rounded-xl border border-signal/30 bg-signal-soft p-3 text-sm"
            >
              {errors.form}
            </p>
          )}
          <div className="border-t border-line pt-6">
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-on-signal transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-50"
            >
              {submitting
                ? "Submitting application…"
                : "Submit access application"}
              <Arrow />
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft">
              Submitting an application does not activate calling. No card or
              payment details are requested.
            </p>
          </div>
        </form>

        <aside
          aria-labelledby="application-summary"
          className="rounded-2xl border border-line bg-surface/40 p-6"
        >
          <h2 id="application-summary" className="text-sm font-semibold">
            What happens next
          </h2>
          <ol className="mt-5 space-y-5 text-sm">
            {[
              [
                "Application review",
                "Your account details are submitted for review.",
              ],
              [
                "Account activation",
                "Calling remains unavailable until your account is approved and enabled.",
              ],
              [
                "Your first request",
                "Once enabled, submit your service requirements and follow provider responses.",
              ],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 font-mono text-xs text-signal-ink">
                  0{index + 1}
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-ink-soft">
            <p className="font-medium text-ink">No payment collected</p>
            <p className="mt-2">
              RingAround does not take credit cards. Provider service charges
              are between you and the provider. Responses, quotes, and
              availability depend on the providers contacted.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ name, label, optional = false, error, children }) {
  return (
    <div>
      <label htmlFor={`application-${name}`} className="text-sm font-medium">
        {label}
        {optional && (
          <span className="font-normal text-ink-soft"> (optional)</span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`application-${name}-error`}
          role="alert"
          className="mt-1 text-sm text-signal-ink"
        >
          {error}
        </p>
      )}
    </div>
  );
}
