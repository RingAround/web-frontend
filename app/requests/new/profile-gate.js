"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { profileStorageKey, readUserProfile, userProfileSchema } from "@/lib/user-profile";
import RequestForm from "./request-form";

const subscribe = () => () => {};
const browserSnapshot = () => true;
const serverSnapshot = () => false;
const inputClass = "mt-2 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-signal focus:ring-4 focus:ring-signal/15 aria-[invalid=true]:border-signal";

export default function ProfileGate({ user, canCall }) {
  const hydrated = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  if (!hydrated) return <p role="status" className="px-6 py-16 text-center text-ink-soft">Loading your profile…</p>;
  return <ProfileGateBody key={user.id} user={user} canCall={canCall} />;
}

function ProfileGateBody({ user, canCall }) {
  const [profile, setProfile] = useState(() => readUserProfile(user.id));

  if (profile) return <RequestForm profile={profile} userId={user.id} canCall={canCall} />;

  return <ProfileModal user={user} onSaved={setProfile} />;
}

function ProfileModal({ user, onSaved }) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function saveProfile(event) {
    event.preventDefault();
    const result = userProfileSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      const nextErrors = {};
      for (const issue of result.error.issues) {
        nextErrors[issue.path[0]] ??= issue.message;
      }
      setErrors(nextErrors);
      formRef.current.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }

    try {
      window.localStorage.setItem(profileStorageKey(user.id), JSON.stringify(result.data));
      if (!readUserProfile(user.id)) throw new Error("Profile was not saved.");
    } catch {
      setErrors({ storage: "Your profile could not be saved. Enable browser storage for this site and try again." });
      return;
    }

    onSaved(result.data);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="profile-title"
      aria-describedby="profile-description"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[28px] border border-line bg-surface p-6 text-ink shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:p-8"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Profile setup</p>
      <h1 id="profile-title" className="mt-3 font-display text-4xl tracking-tight">Complete your profile</h1>
      <p id="profile-description" className="mt-3 text-sm leading-relaxed text-ink-soft">Enter your contact information and default service address to continue. This information will be shared with service providers to obtain quotes and coordinate your service requests. All fields are required unless marked optional.</p>

      <form ref={formRef} onSubmit={saveProfile} noValidate className="mt-7 space-y-4">
        <ProfileField name="name" label="Full name" autoComplete="name" defaultValue={user.name || ""} maxLength={120} error={errors.name} />
        <ProfileField name="phone" label="Phone number" type="tel" autoComplete="tel" placeholder="+1 (206) 555-0123" maxLength={40} error={errors.phone} />
        <ProfileField name="company" label="Company" optional autoComplete="organization" maxLength={120} error={errors.company} />
        <div>
          <label htmlFor="profile-defaultAddress" className="text-sm font-medium">Default service address</label>
          <textarea id="profile-defaultAddress" name="defaultAddress" autoComplete="street-address" required rows={3} maxLength={300} placeholder="Street address, unit, city, state, and postal code" aria-invalid={Boolean(errors.defaultAddress)} aria-describedby={errors.defaultAddress ? "profile-defaultAddress-error" : undefined} className={`${inputClass} resize-y`} />
          {errors.defaultAddress && <p id="profile-defaultAddress-error" role="alert" className="mt-1 text-sm text-signal">{errors.defaultAddress}</p>}
        </div>
        {errors.storage && <p role="alert" className="rounded-xl border border-signal/30 bg-signal-soft p-3 text-sm">{errors.storage}</p>}
        <button type="submit" className="min-h-12 w-full rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">Save and continue</button>
        <p className="text-center text-xs leading-relaxed text-ink-soft">Your profile is stored for your account in this browser. Your default address will be selected for new requests.</p>
      </form>
    </dialog>
  );
}

function ProfileField({ name, label, optional = false, error, ...props }) {
  return (
    <div>
      <label htmlFor={`profile-${name}`} className="text-sm font-medium">{label}{optional && <span className="font-normal text-ink-soft"> (optional)</span>}</label>
      <input id={`profile-${name}`} name={name} required={!optional} aria-invalid={Boolean(error)} aria-describedby={error ? `profile-${name}-error` : undefined} className={inputClass} {...props} />
      {error && <p id={`profile-${name}-error`} role="alert" className="mt-1 text-sm text-signal">{error}</p>}
    </div>
  );
}
