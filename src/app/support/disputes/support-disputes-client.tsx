"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type Dispute = {
  id: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED_REQUESTER" | "RESOLVED_TRAVELER" | "CANCELLED";
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  openedBy: { id: string; displayName: string; email: string };
  agreement: {
    id: string;
    status: string;
    match: {
      request: { title: string; originName: string; destinationName: string; currency: string; itemCostMinor: number };
      itinerary: { departureAt: string; arrivalBy: string };
    };
    requester: { id: string; displayName: string; email: string };
    traveler: { id: string; displayName: string; email: string };
    payments: Array<{ id: string; amountMinor: number; currency: string; status: string; createdAt: string }>;
    deliveryConfirmation: { confirmedAt: string; note: string | null } | null;
  };
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function money(minor: number, currency: string) {
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / (10 ** digits));
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}

export function SupportDisputesClient() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/support/disputes", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "The support queue is unavailable.");
      setDisputes(result.data as Dispute[]);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The support queue is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  async function beginReview(disputeId: string) {
    setBusyId(disputeId);
    setError(null);
    try {
      const response = await fetch(`/api/v1/support/disputes/${disputeId}/review`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "This case could not be moved into review.");
      setNotice("Case assigned for review.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This case could not be moved into review.");
    } finally {
      setBusyId(null);
    }
  }

  const activeCases = disputes.filter(({ status }) => ["OPEN", "UNDER_REVIEW"].includes(status));
  const resolvedCases = disputes.filter(({ status }) => !["OPEN", "UNDER_REVIEW"].includes(status));

  return (
    <main className="support-workspace-shell min-h-screen bg-[#fbfaf7] text-courier-ink">
      <header className="sticky top-0 z-40 border-b border-courier-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-18 max-w-295 items-center justify-between gap-4 px-5 sm:px-8">
          <BrandMark />
          <Link className="inline-flex min-h-10 items-center rounded-full border border-courier-line px-4 text-[11px] font-semibold text-courier-green transition-colors hover:border-courier-green hover:bg-[#f5f8f5]" href="/dashboard">Back to workspace</Link>
        </div>
      </header>
      <div className="mx-auto max-w-330 px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <section className="grid gap-6 border-b border-courier-line pb-8 md:grid-cols-[minmax(0,1fr)_250px] md:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.17em] text-courier-green"><span className="h-px w-6 bg-courier-gold" /> Courier support</p>
            <h1 className="mb-0 font-display text-[clamp(2.3rem,5vw,4rem)] leading-none tracking-[-.06em]">Dispute review</h1>
            <p className="mb-0 mt-3 max-w-135 text-[12px] leading-5 text-courier-muted">Triage handoff issues and keep funds paused while the case is being reviewed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-courier-line bg-white px-4 py-3.5"><span className="block text-[9px] font-bold uppercase tracking-[.12em] text-courier-muted">Needs review</span><strong className="mt-1 block font-display text-[30px] font-semibold tracking-tighter">{disputes.filter(({ status }) => status === "OPEN").length}</strong></div>
            <div className="rounded-[20px] border border-courier-line bg-white px-4 py-3.5"><span className="block text-[9px] font-bold uppercase tracking-[.12em] text-courier-muted">In review</span><strong className="mt-1 block font-display text-[30px] font-semibold tracking-tighter">{disputes.filter(({ status }) => status === "UNDER_REVIEW").length}</strong></div>
          </div>
        </section>

        {notice && <p className="mt-5 border-l-2 border-courier-green bg-[#f4f8f5] px-4 py-3 text-[11px]" role="status">{notice}</p>}
        {error && <p className="mt-5 border-l-2 border-[#a33d31] bg-[#fff8f6] px-4 py-3 text-[11px] text-[#83332a]" role="alert">{error}</p>}

        <section className="mt-8" aria-labelledby="active-cases">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="mb-1 text-[8px] font-bold uppercase tracking-[.16em] text-courier-gold">Release paused</p><h2 id="active-cases" className="mb-0 font-display text-[25px] tracking-[-.04em]">Open cases</h2></div><button className="text-[10px] font-semibold text-courier-green underline decoration-courier-line underline-offset-4 hover:decoration-courier-green" type="button" onClick={() => void load()}>Refresh queue</button></div>
          {loading ? <p className="py-12 text-center text-[11px] text-courier-muted" role="status">Loading cases…</p> : activeCases.length === 0 ? <div className="border border-dashed border-courier-line px-5 py-8"><p className="mb-1 font-display text-[20px]">The queue is clear.</p><p className="mb-0 text-[11px] text-courier-muted">New participant reports will appear here.</p></div> : <div className="grid gap-4 xl:grid-cols-2">{activeCases.map((dispute) => <article className="border border-courier-line p-4 sm:p-5" key={dispute.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="mb-1 text-[8px] font-bold uppercase tracking-[.13em] text-courier-muted">{dispute.status === "OPEN" ? "New report" : "Under review"} · {dateTime(dispute.createdAt)}</p><h3 className="mb-1 font-display text-[22px] tracking-[-.04em]">{dispute.agreement.match.request.title}</h3><p className="mb-0 text-[10px] text-courier-muted">Agreement {dispute.agreement.id.slice(0, 8).toUpperCase()} · {dispute.agreement.status.toLowerCase().replaceAll("_", " ")}</p></div><span className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.08em] ${dispute.status === "OPEN" ? "border-[#ead8b7] bg-[#fbf8f1] text-[#845a24]" : "border-[#d4e4d8] bg-[#f4f8f5] text-courier-green"}`}>{dispute.status === "OPEN" ? "Needs review" : "In review"}</span></div>
            <div className="mt-4 grid grid-cols-[14px_minmax(0,1fr)] items-center gap-x-2.5"><svg className="row-span-2 h-8.5 w-3.5" viewBox="0 0 14 34" fill="none" aria-hidden="true"><circle cx="7" cy="5" r="4" fill="#145b4c"/><path d="M7 11v12" stroke="#bd8845" strokeDasharray="2 3"/><rect x="3.5" y="26" width="7" height="7" fill="#bd8845"/></svg><span className="truncate text-[10px] font-medium">{dispute.agreement.match.request.originName}</span><span className="truncate text-[10px] text-courier-muted">{dispute.agreement.match.request.destinationName} · arrives {dateTime(dispute.agreement.match.itinerary.arrivalBy)}</span></div>
            <div className="mt-4 grid gap-3 border-y border-courier-line py-3 sm:grid-cols-2"><div><p className="mb-1 text-[8px] font-bold uppercase tracking-[.12em] text-courier-muted">Requester</p><p className="mb-0 text-[10px] font-semibold">{dispute.agreement.requester.displayName}</p><a className="text-[9px] text-courier-green underline underline-offset-2" href={`mailto:${dispute.agreement.requester.email}`}>{dispute.agreement.requester.email}</a></div><div><p className="mb-1 text-[8px] font-bold uppercase tracking-[.12em] text-courier-muted">Traveler</p><p className="mb-0 text-[10px] font-semibold">{dispute.agreement.traveler.displayName}</p><a className="text-[9px] text-courier-green underline underline-offset-2" href={`mailto:${dispute.agreement.traveler.email}`}>{dispute.agreement.traveler.email}</a></div></div>
            <div className="mt-4"><p className="mb-1 text-[8px] font-bold uppercase tracking-[.12em] text-courier-muted">Reported issue · {dispute.openedBy.displayName}</p><p className="mb-0 whitespace-pre-wrap text-[11px] leading-5 text-courier-ink">{dispute.reason}</p></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-3"><div className="text-[9px] leading-5 text-courier-muted">{dispute.agreement.payments.map((payment) => <span className="mr-3 inline-block" key={payment.id}>{money(payment.amountMinor, payment.currency)} · {payment.status.toLowerCase().replaceAll("_", " ")}</span>)}{dispute.agreement.deliveryConfirmation && <span>Receipt confirmed {dateTime(dispute.agreement.deliveryConfirmation.confirmedAt)}</span>}</div>{dispute.status === "OPEN" && <button className="min-h-9.5 bg-courier-green px-4 text-[9px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:opacity-60" type="button" disabled={busyId === dispute.id} onClick={() => void beginReview(dispute.id)}>{busyId === dispute.id ? "Updating…" : "Start review"}</button>}</div>
          </article>)}</div>}
        </section>

        {resolvedCases.length > 0 && <section className="mt-10" aria-labelledby="closed-cases"><h2 id="closed-cases" className="mb-4 font-display text-[23px] tracking-[-.04em]">Past cases</h2><div className="divide-y divide-courier-line border-y border-courier-line">{resolvedCases.map((dispute) => <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={dispute.id}><div><p className="mb-1 text-[11px] font-semibold">{dispute.agreement.match.request.title}</p><p className="mb-0 text-[9px] text-courier-muted">{dispute.agreement.requester.displayName} · {dispute.agreement.traveler.displayName} · {dateTime(dispute.createdAt)}</p></div><span className="text-[8px] font-bold uppercase tracking-widest text-courier-muted">{dispute.status.toLowerCase().replaceAll("_", " ")}</span></div>)}</div></section>}
        <p className="mb-0 mt-8 max-w-155 border-l-2 border-courier-gold pl-3 text-[9px] leading-5 text-courier-muted">This workspace starts support review and preserves the release hold. Final outcomes, refunds, and provider payout actions are not enabled until Courier’s dispute policy and payment provider are configured.</p>
      </div>
    </main>
  );
}
