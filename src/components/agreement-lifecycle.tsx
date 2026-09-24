"use client";

import { useState, type FormEvent } from "react";

type LifecycleAgreement = {
  id: string;
  status: string;
  payments: Array<{ id: string; amountMinor: number; currency: string; status: string; capturedAt: string | null; releasedAt: string | null }>;
  deliveryConfirmation: { confirmedAt: string; note: string | null } | null;
  dispute: { status: string; reason: string; resolutionNote: string | null; createdAt: string; resolvedAt: string | null } | null;
  match: {
    request: { title: string };
    itinerary: { originName: string; destinationName: string; arrivalBy: string };
  };
};

const stages = ["Terms agreed", "Payment protected", "Handoff", "Received"];

function stageIndex(status: string) {
  if (status === "COMPLETED") return stages.length;
  if (["FUNDED", "IN_HANDOFF", "DELIVERED", "RELEASE_PENDING", "COMPLETED", "DISPUTED"].includes(status)) {
    return status === "FUNDED" ? 1 : status === "IN_HANDOFF" || status === "DISPUTED" ? 2 : 3;
  }
  return 0;
}

function friendlyDate(value: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function AgreementLifecycle({
  agreement,
  isTraveler,
  submitting,
  onBeginHandoff,
  onConfirmDelivery,
  onReportIssue,
}: {
  agreement: LifecycleAgreement;
  isTraveler: boolean;
  submitting: boolean;
  onBeginHandoff: () => void;
  onConfirmDelivery: () => void;
  onReportIssue: (reason: string) => void;
}) {
  const [issueOpen, setIssueOpen] = useState(false);
  const progress = stageIndex(agreement.status);
  const payment = agreement.payments[0];
  const hasProtectedFunds = agreement.payments.some(({ status }) => ["CAPTURED", "HELD"].includes(status));
  const paymentIsProtected = agreement.payments.some(({ status }) => ["CAPTURED", "HELD", "RELEASE_PENDING", "RELEASED"].includes(status));
  const hasActivePayment = agreement.payments.some(({ status }) => ["CAPTURED", "HELD", "RELEASE_PENDING"].includes(status));
  const canReportIssue = ["FUNDED", "IN_HANDOFF", "DELIVERED", "RELEASE_PENDING", "DISPUTED"].includes(agreement.status) && hasActivePayment;
  const issueActive = agreement.dispute && ["OPEN", "UNDER_REVIEW"].includes(agreement.dispute.status);

  function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    onReportIssue(reason);
    setIssueOpen(false);
  }

  return (
    <section className="mt-5 border-t border-courier-line pt-5" aria-label="Delivery progress">
      <div className="flex items-center justify-between gap-3">
        <p className="mb-0 text-[9px] font-bold uppercase tracking-[.16em] text-courier-muted">Trip progress</p>
        {payment && <span className="text-[9px] font-semibold uppercase tracking-widest text-courier-green">Payment · {payment.status.toLowerCase().replaceAll("_", " ")}</span>}
      </div>

      <div className="mt-4 grid grid-cols-4" role="list" aria-label="Agreement progress">
        {stages.map((stage, index) => {
          const complete = index < progress;
          const current = index === progress;
          return (
            <div className="relative flex flex-col items-center text-center" role="listitem" key={stage}>
              {index > 0 && <span className={`absolute right-1/2 top-[7px] h-px w-full ${complete ? "bg-courier-green" : "bg-courier-line"}`} aria-hidden="true" />}
              <span className={`relative z-10 grid h-[15px] w-[15px] place-items-center border ${complete ? "border-courier-green bg-courier-green text-white" : current ? "border-courier-green bg-white" : "border-courier-line bg-white"}`} aria-label={complete ? "Complete" : current ? "Current" : "Upcoming"}>
                {complete && <span className="text-[8px] leading-none" aria-hidden="true">✓</span>}
                {current && <span className="h-[5px] w-[5px] bg-courier-gold" aria-hidden="true" />}
              </span>
              <span className={`mt-2 px-1 text-[8px] leading-4 sm:text-[9px] ${current ? "font-semibold text-courier-green" : "text-courier-muted"}`}>{stage}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 border-y border-courier-line py-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <svg className="h-[46px] w-[17px] shrink-0" viewBox="0 0 17 46" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="5" r="4" fill="#145b4c" />
            <path d="M8.5 11v24" stroke="#bd8845" strokeDasharray="2 4" />
            <rect x="4.5" y="37" width="8" height="8" fill="#bd8845" />
          </svg>
          <div className="min-w-0">
            <p className="mb-0 truncate text-[10px] font-semibold text-courier-ink">{agreement.match.itinerary.originName}</p>
            <p className="mb-0 mt-0.5 truncate text-[9px] text-courier-muted">{agreement.match.itinerary.destinationName}</p>
          </div>
        </div>
        <p className="mb-0 text-[9px] text-courier-muted sm:text-right">Arriving by {friendlyDate(agreement.match.itinerary.arrivalBy)}</p>
      </div>

      {agreement.dispute && (
        <div className="mt-4 border-l-2 border-courier-gold bg-[#faf8f2] px-3 py-3" role="status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="mb-0 text-[10px] font-semibold text-courier-ink">Support case · {agreement.dispute.status.toLowerCase().replaceAll("_", " ")}</p>
            <time className="text-[9px] text-courier-muted" dateTime={agreement.dispute.createdAt}>{friendlyDate(agreement.dispute.createdAt)}</time>
          </div>
          <p className="mb-0 mt-1.5 text-[10px] leading-5 text-courier-muted">{agreement.dispute.reason}</p>
          {agreement.dispute.resolutionNote && <p className="mb-0 mt-2 border-t border-courier-line pt-2 text-[10px] leading-5 text-courier-ink">Support update: {agreement.dispute.resolutionNote}</p>}
        </div>
      )}

      {agreement.deliveryConfirmation && (
        <div className="mt-4 border-l-2 border-courier-green bg-[#f5f8f5] px-3 py-3" role="status">
          <p className="mb-0 text-[10px] font-semibold text-courier-green">Receipt confirmed · {friendlyDate(agreement.deliveryConfirmation.confirmedAt)}</p>
          {agreement.deliveryConfirmation.note && <p className="mb-0 mt-1 text-[10px] leading-5 text-courier-muted">{agreement.deliveryConfirmation.note}</p>}
        </div>
      )}

      {!paymentIsProtected && ["ACCEPTED", "FUNDED"].includes(agreement.status) && (
        <p className="mb-0 mt-4 text-[10px] leading-5 text-courier-muted">Payment protection will appear here after the payment provider is connected. Handoff actions stay locked until payment is confirmed.</p>
      )}
      {agreement.status === "RELEASE_PENDING" && !agreement.dispute && (
        <p className="mb-0 mt-4 text-[10px] leading-5 text-courier-muted">Receipt is recorded. Release is awaiting payment-provider processing; no funds have been transferred by this confirmation.</p>
      )}
      {agreement.status === "COMPLETED" && <p className="mb-0 mt-4 text-[10px] leading-5 text-courier-green">This delivery is complete.</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {agreement.status === "FUNDED" && isTraveler && hasProtectedFunds && !agreement.dispute && (
          <button className="min-h-[42px] bg-courier-green px-4 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:cursor-wait disabled:opacity-60" type="button" disabled={submitting || Boolean(agreement.dispute)} onClick={onBeginHandoff}>
            {submitting ? "Updating trip…" : "Start handoff"}
          </button>
        )}
        {agreement.status === "IN_HANDOFF" && !isTraveler && hasProtectedFunds && !agreement.deliveryConfirmation && !agreement.dispute && (
          <button className="min-h-[42px] bg-courier-green px-4 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:cursor-wait disabled:opacity-60" type="button" disabled={submitting} onClick={onConfirmDelivery}>
            {submitting ? "Recording receipt…" : "Confirm I received the item"}
          </button>
        )}
        {canReportIssue && !issueActive && !agreement.dispute && (
          <button className="min-h-[42px] border border-courier-line px-4 text-[10px] font-semibold text-courier-ink transition-colors hover:border-courier-gold disabled:opacity-60" type="button" disabled={submitting} onClick={() => setIssueOpen((open) => !open)}>
            {issueOpen ? "Close support form" : "Report a handoff issue"}
          </button>
        )}
      </div>

      {issueOpen && !agreement.dispute && (
        <form className="mt-4 border border-courier-line p-4 motion-safe:animate-enter" onSubmit={submitIssue}>
          <label className="block text-[9px] font-bold uppercase tracking-[.13em] text-courier-muted" htmlFor={`issue-${agreement.id}`}>What happened?</label>
          <textarea className="mt-2 min-h-[90px] w-full resize-y border border-courier-line bg-white p-3 text-[12px] leading-5 text-courier-ink outline-none transition-colors placeholder:text-[#a5aea7] focus:border-courier-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-courier-green/25" id={`issue-${agreement.id}`} name="reason" minLength={10} maxLength={2000} placeholder="Describe the delay, missed meetup, or item concern. Please do not include sensitive payment details." required />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="mb-0 text-[9px] leading-4 text-courier-muted">Opening a case pauses release while support reviews it.</p>
            <button className="min-h-[38px] bg-courier-ink px-4 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green disabled:opacity-60" type="submit" disabled={submitting}>Send to support</button>
          </div>
        </form>
      )}

      {payment && <p className="mb-0 mt-3 text-[9px] text-courier-muted">{payment.status === "RELEASED" && payment.releasedAt ? `Paid out ${friendlyDate(payment.releasedAt)}.` : payment.status === "HELD" || payment.status === "CAPTURED" ? "Payment protected · funds stay on hold until delivery is confirmed." : `Payment status: ${payment.status.toLowerCase().replaceAll("_", " ")}.`}</p>}
    </section>
  );
}
