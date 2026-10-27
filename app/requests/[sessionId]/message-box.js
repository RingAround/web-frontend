"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Arrow } from "@/components/icons";
import { sendMessage } from "./actions";
import { MESSAGE_LIMIT } from "./limits";

// Lets the requester answer the agent's questions or steer it mid-request.
// `blockedReason` explains why messages can't be sent right now, if they can't.
export default function MessageBox({
  sessionId,
  blockedReason,
  waitingOnYou,
  receipts = [],
}) {
  const router = useRouter();
  const formRef = useRef(null);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [delayed, setDelayed] = useState(false);
  const [sending, startSending] = useTransition();
  const disabled = Boolean(blockedReason) || sending;
  const received =
    delivery?.eventId &&
    receipts.some(
      (receipt) => receipt.id === delivery.eventId && receipt.processed,
    );
  const awaitingReceipt = Boolean(
    delivery?.eventId && !received && !blockedReason,
  );

  useEffect(() => {
    if (!awaitingReceipt) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 2000);
    const delayedTimer = setTimeout(() => setDelayed(true), 30000);
    return () => {
      clearInterval(timer);
      clearTimeout(delayedTimer);
    };
  }, [awaitingReceipt, delivery?.eventId, router]);

  function submit(event) {
    event.preventDefault();
    if (disabled || !text.trim()) return;
    setError(null);
    startSending(async () => {
      const result = await sendMessage(sessionId, text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setText("");
      setDelivery({ eventId: result.eventId });
      setDelayed(false);
      router.refresh();
    });
  }

  // Enter sends; Shift+Enter adds a line.
  function onKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="rounded-[22px] border border-line bg-surface p-3 shadow-sm"
    >
      {delivery && (
        <p
          role="status"
          className="mb-3 rounded-xl bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft"
        >
          {received
            ? "Received by the agent. Follow its response in the activity above."
            : delayed
              ? "Your message is still queued. The agent may be finishing a call or waiting on a tool. You do not need to create a new request."
              : delivery.eventId
                ? "Message queued. Waiting for the agent to receive your instructions…"
                : "Message accepted. Follow the activity above for the agent’s response."}
        </p>
      )}
      <label htmlFor="agent-message" className="sr-only">
        Message the agent
      </label>
      <textarea
        id="agent-message"
        rows={3}
        maxLength={MESSAGE_LIMIT}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={Boolean(blockedReason)}
        placeholder={
          blockedReason ??
          (waitingOnYou
            ? "Answer the agent’s question, or tell it what to do next…"
            : "Add instructions for the agent, e.g. “Only call licensed and insured companies”")
        }
        aria-describedby={error ? "agent-message-error" : undefined}
        className="w-full resize-y rounded-2xl bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 disabled:cursor-not-allowed"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1">
        <p
          id="agent-message-error"
          role={error ? "alert" : undefined}
          className={`text-xs ${error ? "text-signal" : "text-ink-soft"}`}
        >
          {error ??
            (blockedReason
              ? ""
              : "Instructions stay in this request. Delivery is confirmed when the agent receives them. Enter to send; Shift+Enter for a new line.")}
        </p>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-busy={sending}
          className="group inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-on-signal transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/45"
        >
          {sending ? "Sending…" : "Send"}
          {!sending && <Arrow />}
        </button>
      </div>
    </form>
  );
}
