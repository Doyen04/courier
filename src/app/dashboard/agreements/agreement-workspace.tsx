"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AgreementLifecycle } from "@/components/agreement-lifecycle";
import { apiRequest, dateLabel, formatMoney, moneyToMinor, type Agreement } from "../dashboard-data";
import { EmptyState, fieldClass, InlineMessage, labelClass, LoadingPanel, PrimaryButton, StatusBadge, WorkspaceHeading } from "../workspace-ui";

export function AgreementWorkspace({ userId }: { userId: string }) {
    const [items, setItems] = useState<Agreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setItems(await apiRequest<Agreement[]>("/api/v1/agreements"));
            setError(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your agreements could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => { void refresh(); }, 0);
        return () => window.clearTimeout(timer);
    }, [refresh]);

    async function runAction(action: () => Promise<unknown>, successMessage: string) {
        setSubmitting(true);
        setError(null);
        try {
            await action();
            setNotice(successMessage);
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "That agreement could not be updated.");
        } finally {
            setSubmitting(false);
        }
    }

    async function proposeTerms(event: FormEvent<HTMLFormElement>, agreement: Agreement) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await runAction(() => apiRequest(`/api/v1/agreements/${agreement.id}/terms`, { method: "POST", body: JSON.stringify({
            deliveryFeeMinor: moneyToMinor(String(form.get("deliveryFee") ?? ""), agreement.match.request.currency),
            handoffDetails: { notes: form.get("handoffNotes"), ...(form.get("meetup") ? { suggestedMeetup: form.get("meetup") } : {}) },
        }) }), "Terms sent for review.");
    }

    return <>
        <WorkspaceHeading eyebrow="Delivery workspace" title="Agreements" description="Review delivery terms, track handoffs, and keep each agreement’s next step clear." />
        <InlineMessage error={error} notice={notice} onDismiss={() => { setError(null); setNotice(null); }} />
        {loading ? <LoadingPanel label="Loading agreements…" /> : items.length === 0 ? <EmptyState title="No agreements yet" body="When a traveler responds to your request, start an agreement to settle delivery terms and next steps." href="/dashboard/requests" action="View my requests" /> : <div className="grid gap-5">{items.map((agreement) => <AgreementCard key={agreement.id} agreement={agreement} userId={userId} submitting={submitting} onPropose={proposeTerms} onAction={runAction} />)}</div>}
    </>;
}

function AgreementCard({ agreement, userId, submitting, onPropose, onAction }: {
    agreement: Agreement; userId: string; submitting: boolean;
    onPropose: (event: FormEvent<HTMLFormElement>, agreement: Agreement) => void;
    onAction: (action: () => Promise<unknown>, successMessage: string) => void;
}) {
    const isTraveler = agreement.travelerId === userId;
    const latestTerms = agreement.termsRevisions[0];
    const canEdit = ["DRAFT", "AWAITING_ACCEPTANCE", "ACCEPTED"].includes(agreement.status);

    return <article className="rounded-2xl border border-courier-line bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.13em] text-courier-muted">{isTraveler ? "You’re carrying" : "You’re waiting for"}</p><h2 className="mb-1 font-display text-xl font-semibold tracking-tight">{agreement.match.request.title}</h2><p className="mb-0 text-sm text-courier-muted">{agreement.match.itinerary.originName} → {agreement.match.itinerary.destinationName}</p></div><StatusBadge status={agreement.status} /></div>

        <div className="mt-5 grid gap-3 rounded-xl bg-[#f7f8f5] p-4 sm:grid-cols-3"><Detail label="Item value" value={formatMoney(agreement.match.request.itemCostMinor, agreement.match.request.currency)} /><Detail label="Journey arrival" value={dateLabel(agreement.match.itinerary.arrivalBy)} /><Detail label="Latest terms" value={latestTerms ? formatMoney(latestTerms.totalMinor, latestTerms.currency) : "Not proposed"} /></div>

        {latestTerms && <div className="mt-4 rounded-xl border border-courier-line p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="mb-0 text-sm font-semibold">Delivery terms</h3><StatusBadge status={latestTerms.status} /></div><p className="mb-0 mt-3 text-sm leading-6 text-courier-muted">Delivery fee: {formatMoney(latestTerms.deliveryFeeMinor, latestTerms.currency)}{latestTerms.handoffDetails?.suggestedMeetup ? ` · Meetup: ${latestTerms.handoffDetails.suggestedMeetup}` : ""}</p>{latestTerms.handoffDetails?.notes && <p className="mb-0 mt-2 text-sm leading-6 text-courier-muted">{latestTerms.handoffDetails.notes}</p>}</div>}
        {!latestTerms && <p className="mb-0 mt-4 rounded-xl border border-dashed border-courier-line p-4 text-sm text-courier-muted">{isTraveler ? "Propose a delivery fee and handoff details for the requester to review." : "The traveler is preparing delivery terms."}</p>}

        {isTraveler && canEdit && <form className="mt-4 grid gap-4 rounded-xl border border-courier-line p-4 sm:grid-cols-2" onSubmit={(event) => onPropose(event, agreement)}><h3 className="mb-0 text-sm font-semibold sm:col-span-2">Propose terms</h3><label className={labelClass}>Delivery fee · {agreement.match.request.currency}<input className={fieldClass} name="deliveryFee" type="number" min="0" step="0.01" placeholder="0.00" required /></label><label className={labelClass}>Suggested meetup · optional<input className={fieldClass} name="meetup" maxLength={300} placeholder="A public place near the station" /></label><label className={`${labelClass} sm:col-span-2`}>Handoff note<textarea className={`${fieldClass} min-h-20 py-3`} name="handoffNotes" maxLength={1000} placeholder="Share a practical note for arranging the handoff." required /></label><div className="sm:col-span-2"><PrimaryButton type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send terms for review"}</PrimaryButton></div></form>}

        {!isTraveler && latestTerms?.status === "PROPOSED" && canEdit && <div className="mt-4"><PrimaryButton type="button" disabled={submitting} onClick={() => onAction(() => apiRequest(`/api/v1/agreements/${agreement.id}/terms/${latestTerms.id}/accept`, { method: "POST" }), "You accepted the latest terms.")}>Accept terms</PrimaryButton></div>}
        {canEdit && <div className="mt-3"><button className="min-h-9 rounded-lg px-2 text-xs font-medium text-[#9a4035] hover:bg-[#fff4f1]" type="button" disabled={submitting} onClick={() => { if (window.confirm("Cancel this agreement before funding?")) onAction(() => apiRequest(`/api/v1/agreements/${agreement.id}/cancel`, { method: "POST" }), "Agreement cancelled."); }}>Cancel agreement</button></div>}

        <AgreementLifecycle
            agreement={agreement}
            isTraveler={isTraveler}
            submitting={submitting}
            onBeginHandoff={() => onAction(() => apiRequest(`/api/v1/agreements/${agreement.id}/handoff`, { method: "POST" }), "Handoff started.")}
            onConfirmDelivery={() => onAction(() => apiRequest(`/api/v1/agreements/${agreement.id}/delivery-confirmation`, { method: "POST", body: JSON.stringify({}) }), "Receipt recorded.")}
            onReportIssue={(reason) => onAction(() => apiRequest(`/api/v1/agreements/${agreement.id}/disputes`, { method: "POST", body: JSON.stringify({ reason }) }), "Your issue was sent to Courier support.")}
        />
    </article>;
}

function Detail({ label, value }: { label: string; value: string }) {
    return <div><p className="mb-1 text-[10px] font-medium text-courier-muted">{label}</p><p className="mb-0 text-sm font-semibold">{value}</p></div>;
}
