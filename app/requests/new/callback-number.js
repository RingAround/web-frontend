"use client";

import { useState, useTransition } from "react";
import { normalizePhone } from "@/lib/request";
import { saveProfileAction } from "./actions";

export default function CallbackNumber({ profile, onSaved }) {
  const [phone, setPhone] = useState(profile.phone);
  const [message, setMessage] = useState(null);
  const [pending, startSaving] = useTransition();

  function save() {
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
      setMessage({
        error: true,
        text: "Include a country code, such as +1 206 555 0123.",
      });
      return;
    }
    startSaving(async () => {
      try {
        const result = await saveProfileAction({
          ...profile,
          phone: normalized,
        });
        if (!result.profile) {
          setMessage({
            error: true,
            text:
              result.error ||
              result.errors?.phone ||
              "Your callback number could not be saved.",
          });
          return;
        }
        onSaved(result.profile.phone);
        setMessage({ text: "Callback number saved." });
      } catch {
        setMessage({
          error: true,
          text: "Your callback number could not be saved. Try again.",
        });
      }
    });
  }

  return (
    <div className="mt-4">
      <label htmlFor="callback-phone" className="text-sm font-medium">
        Your callback number
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="callback-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={40}
          aria-describedby="callback-phone-help"
          className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-signal"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full border border-line px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save callback number"}
        </button>
      </div>
      <p
        id="callback-phone-help"
        className="mt-2 text-xs leading-relaxed text-ink-soft"
      >
        Use your own number with its country code. Save any changes before
        reviewing the request.
      </p>
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className="mt-2 text-xs text-ink-soft"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
