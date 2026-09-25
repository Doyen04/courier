"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, dateLabel, formatMoney, minorToMajorInput, moneyToMinor, type ItemRequest, type MatchPanel } from "../dashboard-data";
import { EmptyState, fieldClass, InlineMessage, labelClass, LoadingPanel, PrimaryButton, SecondaryButton, StatusBadge, WorkspaceHeading } from "../workspace-ui";

export function RequestsWorkspace() {
    const router = useRouter();
    const [items, setItems] = useState<ItemRequest[]>([]);
    const [matches, setMatches] = useState<Record<string, MatchPanel>>({});
    const [matching, setMatching] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const result = await apiRequest<{ items: ItemRequest[] }>("/api/v1/requests?limit=100");
            setItems(result.items);
            setError(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your requests could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setFormOpen(new URLSearchParams(window.location.search).has("new"));
        void refresh();
    }, [refresh]);

    async function loadMatches(id: string) {
        setMatching(id);
        setError(null);
        try {
            const result = await apiRequest<MatchPanel>(`/api/v1/requests/${id}/matches`);
            setMatches((current) => ({ ...current, [id]: result }));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Matching journeys could not be loaded.");
        } finally {
            setMatching(null);
        }
    }

    async function createRequest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const currency = String(form.get("currency") ?? "NGN").trim().toUpperCase();
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest("/api/v1/requests", { method: "POST", body: JSON.stringify({
                title: form.get("title"), description: form.get("description"),
                itemCostMinor: moneyToMinor(String(form.get("itemCost") ?? ""), currency), currency,
                originName: form.get("originName"), originCountryCode: form.get("originCountryCode"),
                destinationName: form.get("destinationName"), destinationCountryCode: form.get("destinationCountryCode"),
                neededBy: form.get("neededBy") || undefined,
            }) });
            formElement.reset();
            setFormOpen(false);
            setNotice("Request posted. We’ll look for a journey that fits.");
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your request could not be created.");
        } finally {
            setSubmitting(false);
        }
    }

    async function updateRequest(event: FormEvent<HTMLFormElement>, item: ItemRequest) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const currency = String(form.get("currency") ?? item.currency).trim().toUpperCase();
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/requests/${item.id}`, { method: "PATCH", body: JSON.stringify({
                title: form.get("title"), description: form.get("description"),
                itemCostMinor: moneyToMinor(String(form.get("itemCost") ?? ""), currency), currency,
                originName: form.get("originName"), originCountryCode: form.get("originCountryCode"),
                destinationName: form.get("destinationName"), destinationCountryCode: form.get("destinationCountryCode"),
                neededBy: form.get("neededBy") || null,
            }) });
            setNotice("Request details updated.");
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your request could not be updated.");
        } finally {
            setSubmitting(false);
        }
    }

    async function cancelRequest(id: string) {
        if (!window.confirm("Close this request? You can’t reopen it once it’s cancelled.")) return;
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/requests/${id}`, { method: "DELETE" });
            setNotice("Request closed.");
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "This request could not be cancelled.");
        } finally {
            setSubmitting(false);
        }
    }

    async function startAgreement(matchId: string) {
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest("/api/v1/agreements", { method: "POST", body: JSON.stringify({ matchId }) });
            router.push("/dashboard/agreements");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The agreement could not be started.");
        } finally {
            setSubmitting(false);
        }
    }

    return <>
        <WorkspaceHeading eyebrow="Requester workspace" title="My requests" description="Track the items you need and find travelers whose journeys fit." action={<PrimaryButton type="button" onClick={() => setFormOpen((open) => !open)}>{formOpen ? "Close form" : "+ New request"}</PrimaryButton>} />
        <InlineMessage error={error} notice={notice} onDismiss={() => { setError(null); setNotice(null); }} />
        {formOpen && <RequestForm onSubmit={createRequest} submitting={submitting} />}
        {loading ? <LoadingPanel label="Loading your requests…" /> : items.length === 0 ? <EmptyState title="No requests yet" body="Add an item you need and we’ll match it with someone already travelling that way." action="Create a request" href="/dashboard/requests?new=1" /> : <div className="grid gap-4">{items.map((item) => <RequestCard key={item.id} item={item} panel={matches[item.id]} matching={matching === item.id} submitting={submitting} onMatches={() => void loadMatches(item.id)} onStartAgreement={startAgreement} onUpdate={updateRequest} onCancel={cancelRequest} />)}</div>}
    </>;
}

function RequestForm({ onSubmit, submitting }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitting: boolean }) {
    return <form className="mb-6 rounded-2xl border border-courier-line bg-white p-5 sm:p-7" onSubmit={onSubmit}>
        <div className="mb-5"><h2 className="mb-1 font-display text-xl font-semibold">What do you need brought?</h2><p className="mb-0 text-xs text-courier-muted">Share the item and the route so travelers can see if it fits.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>Item name<input className={fieldClass} name="title" maxLength={120} placeholder="A book, a keepsake, a hard-to-find part" required /></label>
            <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={`${fieldClass} min-h-24 py-3`} name="description" maxLength={4000} placeholder="Tell the traveler what it is and anything they should know." required /></label>
            <label className={labelClass}>Estimated item cost<input className={fieldClass} name="itemCost" type="number" min="0" step="0.01" placeholder="0.00" required /></label>
            <label className={labelClass}>Currency code<input className={fieldClass} name="currency" defaultValue="NGN" minLength={3} maxLength={3} pattern="[A-Za-z]{3}" required /></label>
            <label className={labelClass}>From · city<input className={fieldClass} name="originName" maxLength={180} placeholder="Lagos" required /></label>
            <label className={labelClass}>From · country code<input className={fieldClass} name="originCountryCode" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="NG" required /></label>
            <label className={labelClass}>To · city<input className={fieldClass} name="destinationName" maxLength={180} placeholder="London" required /></label>
            <label className={labelClass}>To · country code<input className={fieldClass} name="destinationCountryCode" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="GB" required /></label>
            <label className={labelClass}>Needed by · optional<input className={fieldClass} name="neededBy" type="date" /></label>
            <div className="flex items-end"><PrimaryButton className="w-full" type="submit" disabled={submitting}>{submitting ? "Posting…" : "Post request"}</PrimaryButton></div>
        </div>
    </form>;
}

function RequestCard({ item, panel, matching, submitting, onMatches, onStartAgreement, onUpdate, onCancel }: {
    item: ItemRequest; panel?: MatchPanel; matching: boolean; submitting: boolean; onMatches: () => void;
    onStartAgreement: (matchId: string) => void; onUpdate: (event: FormEvent<HTMLFormElement>, item: ItemRequest) => void; onCancel: (id: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const editable = ["DRAFT", "OPEN", "MATCHED"].includes(item.status);
    return <article className="rounded-2xl border border-courier-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">{item.originName}, {item.originCountryCode} <span className="text-courier-gold">→</span> {item.destinationName}, {item.destinationCountryCode}</p><h2 className="mb-0 font-display text-xl font-semibold tracking-tight">{item.title}</h2></div><StatusBadge status={item.status} /></div>
        {!editing && <><p className="mb-0 mt-4 text-sm leading-6 text-courier-muted">{item.description}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-4"><span className="text-sm font-semibold">{formatMoney(item.itemCostMinor, item.currency)} <span className="font-normal text-courier-muted">· needed by {dateLabel(item.neededBy)}</span></span><div className="flex flex-wrap gap-2"><SecondaryButton type="button" onClick={onMatches}>{matching ? "Finding…" : panel ? "Refresh matches" : "Find a traveler"}</SecondaryButton>{editable && <SecondaryButton type="button" onClick={() => setEditing(true)}>Edit</SecondaryButton>}{editable && <button className="min-h-10 rounded-xl px-3 text-xs font-semibold text-[#9a4035] hover:bg-[#fff4f1]" type="button" disabled={submitting} onClick={() => onCancel(item.id)}>Cancel request</button>}</div></div></>}
        {editing && <form className="mt-5 grid gap-3 border-t border-courier-line pt-5 sm:grid-cols-2" onSubmit={(event) => { onUpdate(event, item); setEditing(false); }}>
            <label className={`${labelClass} sm:col-span-2`}>Item name<input className={fieldClass} name="title" defaultValue={item.title} maxLength={120} required /></label>
            <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={`${fieldClass} min-h-20 py-3`} name="description" defaultValue={item.description} maxLength={4000} required /></label>
            <label className={labelClass}>Value<input className={fieldClass} name="itemCost" type="number" min="0" step="0.01" defaultValue={minorToMajorInput(item.itemCostMinor, item.currency)} required /></label>
            <label className={labelClass}>Currency<input className={fieldClass} name="currency" defaultValue={item.currency} minLength={3} maxLength={3} pattern="[A-Za-z]{3}" required /></label>
            <label className={labelClass}>Origin city<input className={fieldClass} name="originName" defaultValue={item.originName} required /></label><label className={labelClass}>Origin country<input className={fieldClass} name="originCountryCode" defaultValue={item.originCountryCode} minLength={2} maxLength={2} required /></label>
            <label className={labelClass}>Destination city<input className={fieldClass} name="destinationName" defaultValue={item.destinationName} required /></label><label className={labelClass}>Destination country<input className={fieldClass} name="destinationCountryCode" defaultValue={item.destinationCountryCode} minLength={2} maxLength={2} required /></label>
            <label className={labelClass}>Needed by<input className={fieldClass} name="neededBy" type="date" defaultValue={item.neededBy?.slice(0, 10) ?? ""} /></label>
            <div className="flex items-end gap-2"><PrimaryButton type="submit" disabled={submitting}>Save changes</PrimaryButton><SecondaryButton type="button" onClick={() => setEditing(false)}>Cancel</SecondaryButton></div>
        </form>}
        {panel && <div className="mt-5 border-t border-courier-line pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">Matching journeys</p>{panel.matches.length === 0 ? <p className="mb-0 text-sm text-courier-muted">No suitable journeys yet. Your request will stay open.</p> : <div className="grid gap-2">{panel.matches.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8f5] px-4 py-3"><div><p className="mb-1 text-sm font-semibold">{match.itinerary?.traveler.displayName ?? "Courier traveler"}</p><p className="mb-0 text-xs text-courier-muted">{match.itinerary?.originName} → {match.itinerary?.destinationName}</p></div>{match.status === "INTERESTED" ? <PrimaryButton type="button" disabled={submitting} onClick={() => onStartAgreement(match.id)}>Start agreement</PrimaryButton> : <StatusBadge status={match.status} />}</div>)}</div>}</div>}
    </article>;
}
