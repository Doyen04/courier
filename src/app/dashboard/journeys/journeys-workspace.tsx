"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest, dateLabel, parseRouteStops, type Itinerary, type MatchPanel, toLocalDateTimeInput } from "../dashboard-data";
import { EmptyState, fieldClass, InlineMessage, labelClass, LoadingPanel, PrimaryButton, SecondaryButton, StatusBadge, WorkspaceHeading } from "../workspace-ui";

export function JourneysWorkspace({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
    const [items, setItems] = useState<Itinerary[]>([]);
    const [matches, setMatches] = useState<Record<string, MatchPanel>>({});
    const [matching, setMatching] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formOpen, setFormOpen] = useState(initiallyOpen);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const result = await apiRequest<{ items: Itinerary[] }>("/api/v1/itineraries?limit=100");
            setItems(result.items);
            setError(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your journeys could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => { void refresh(); }, 0);
        return () => window.clearTimeout(timer);
    }, [refresh]);

    async function loadMatches(id: string) {
        setMatching(id);
        setError(null);
        try {
            const result = await apiRequest<MatchPanel>(`/api/v1/itineraries/${id}/matches`);
            setMatches((current) => ({ ...current, [id]: result }));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Matching requests could not be loaded.");
        } finally {
            setMatching(null);
        }
    }

    async function createJourney(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest("/api/v1/itineraries", { method: "POST", body: JSON.stringify({
                originName: form.get("originName"), originCountryCode: form.get("originCountryCode"),
                destinationName: form.get("destinationName"), destinationCountryCode: form.get("destinationCountryCode"),
                routeStops: parseRouteStops(String(form.get("routeStopsText") ?? "")),
                departureAt: new Date(String(form.get("departureAt"))).toISOString(),
                arrivalBy: new Date(String(form.get("arrivalBy"))).toISOString(),
            }) });
            formElement.reset();
            setFormOpen(false);
            setNotice("Journey shared. We’ll look for requests along your route.");
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your journey could not be created.");
        } finally {
            setSubmitting(false);
        }
    }

    async function updateJourney(event: FormEvent<HTMLFormElement>, item: Itinerary) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/itineraries/${item.id}`, { method: "PATCH", body: JSON.stringify({
                originName: form.get("originName"), originCountryCode: form.get("originCountryCode"),
                destinationName: form.get("destinationName"), destinationCountryCode: form.get("destinationCountryCode"),
                routeStops: parseRouteStops(String(form.get("routeStopsText") ?? "")),
                departureAt: new Date(String(form.get("departureAt"))).toISOString(),
                arrivalBy: new Date(String(form.get("arrivalBy"))).toISOString(),
            }) });
            setNotice("Journey details updated.");
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your journey could not be updated.");
        } finally {
            setSubmitting(false);
        }
    }

    async function cancelJourney(id: string) {
        if (!window.confirm("Cancel this journey? Any open match responses will expire.")) return;
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/itineraries/${id}`, { method: "DELETE" });
            setNotice("Journey cancelled.");
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your journey could not be cancelled.");
        } finally {
            setSubmitting(false);
        }
    }

    async function respond(matchId: string, itineraryId: string) {
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/matches/${matchId}/interest`, { method: "POST" });
            setNotice("Your interest was sent to the requester.");
            await loadMatches(itineraryId);
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Your response could not be saved.");
        } finally {
            setSubmitting(false);
        }
    }

    return <>
        <WorkspaceHeading eyebrow="Traveler workspace" title="My journeys" description="Share trips you already have planned and see requests that fit along the way." action={<PrimaryButton type="button" onClick={() => setFormOpen((open) => !open)}>{formOpen ? "Close form" : "+ Share a journey"}</PrimaryButton>} />
        <InlineMessage error={error} notice={notice} onDismiss={() => { setError(null); setNotice(null); }} />
        {formOpen && <JourneyForm onSubmit={createJourney} submitting={submitting} />}
        {loading ? <LoadingPanel label="Loading your journeys…" /> : items.length === 0 ? <EmptyState title="No journeys yet" body="Share a trip you already have planned. We’ll surface requests that could fit along your route." action="Share a journey" onAction={() => setFormOpen(true)} /> : <div className="grid gap-4">{items.map((item) => <JourneyCard key={item.id} item={item} panel={matches[item.id]} matching={matching === item.id} submitting={submitting} onMatches={() => void loadMatches(item.id)} onRespond={respond} onUpdate={updateJourney} onCancel={cancelJourney} />)}</div>}
    </>;
}

function JourneyFields({ item }: { item?: Itinerary }) {
    return <>
        <label className={labelClass}>Origin city<input className={fieldClass} name="originName" defaultValue={item?.originName} placeholder="Lagos" required /></label>
        <label className={labelClass}>Origin country<input className={fieldClass} name="originCountryCode" defaultValue={item?.originCountryCode} minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="NG" required /></label>
        <label className={labelClass}>Destination city<input className={fieldClass} name="destinationName" defaultValue={item?.destinationName} placeholder="London" required /></label>
        <label className={labelClass}>Destination country<input className={fieldClass} name="destinationCountryCode" defaultValue={item?.destinationCountryCode} minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="GB" required /></label>
        <label className={labelClass}>Departure date and time<input className={fieldClass} name="departureAt" type="datetime-local" defaultValue={item ? toLocalDateTimeInput(item.departureAt) : undefined} required /></label>
        <label className={labelClass}>Arrival date and time<input className={fieldClass} name="arrivalBy" type="datetime-local" defaultValue={item ? toLocalDateTimeInput(item.arrivalBy) : undefined} required /></label>
        <label className={`${labelClass} sm:col-span-2`}>Stops along the route · optional<textarea className={`${fieldClass} min-h-20 py-3`} name="routeStopsText" defaultValue={item?.routeStops?.map(({ name, countryCode }) => `${name}, ${countryCode}`).join("\n")} placeholder={"Ibadan, NG\nAccra, GH"} /><span className="mt-1 block font-normal text-courier-muted">One city per line, followed by its two-letter country code.</span></label>
    </>;
}

function JourneyForm({ onSubmit, submitting }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitting: boolean }) {
    return <form className="mb-6 rounded-2xl border border-courier-line bg-white p-5 sm:p-7" onSubmit={onSubmit}><div className="mb-5"><h2 className="mb-1 font-display text-xl font-semibold">Share your planned route</h2><p className="mb-0 text-xs text-courier-muted">We’ll suggest requests that fit the cities and timing you share.</p></div><div className="grid gap-4 sm:grid-cols-2"><JourneyFields /><PrimaryButton className="sm:col-span-2 sm:w-fit" type="submit" disabled={submitting}>{submitting ? "Sharing…" : "Share journey"}</PrimaryButton></div></form>;
}

function JourneyCard({ item, panel, matching, submitting, onMatches, onRespond, onUpdate, onCancel }: {
    item: Itinerary; panel?: MatchPanel; matching: boolean; submitting: boolean; onMatches: () => void;
    onRespond: (matchId: string, itineraryId: string) => void; onUpdate: (event: FormEvent<HTMLFormElement>, item: Itinerary) => void; onCancel: (id: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const editable = item.status === "PLANNED";
    return <article className="rounded-2xl border border-courier-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">{item.originCountryCode} · Departs {dateLabel(item.departureAt)}</p><h2 className="mb-0 font-display text-xl font-semibold tracking-tight">{item.originName} <span className="text-courier-gold">→</span> {item.destinationName}</h2></div><StatusBadge status={item.status} /></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-4"><span className="text-sm text-courier-muted">Arrives by {dateLabel(item.arrivalBy)}{item.routeStops?.length ? ` · ${item.routeStops.length} stop${item.routeStops.length === 1 ? "" : "s"}` : ""}</span><div className="flex flex-wrap gap-2"><SecondaryButton type="button" onClick={onMatches}>{matching ? "Finding…" : panel ? "Refresh requests" : "Find requests"}</SecondaryButton>{editable && <SecondaryButton type="button" onClick={() => setEditing((open) => !open)}>{editing ? "Close edit" : "Edit journey"}</SecondaryButton>}{editable && <button className="min-h-10 rounded-xl px-3 text-xs font-semibold text-[#9a4035] hover:bg-[#fff4f1]" type="button" disabled={submitting} onClick={() => onCancel(item.id)}>Cancel journey</button>}</div></div>
        {editing && <form className="mt-5 grid gap-3 border-t border-courier-line pt-5 sm:grid-cols-2" onSubmit={(event) => { onUpdate(event, item); setEditing(false); }}><JourneyFields item={item} /><div className="sm:col-span-2"><PrimaryButton type="submit" disabled={submitting}>Save journey</PrimaryButton></div></form>}
        {panel && <div className="mt-5 border-t border-courier-line pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">Requests along the way</p>{panel.matches.length === 0 ? <p className="mb-0 text-sm text-courier-muted">No suitable requests yet. Check again later.</p> : <div className="grid gap-2">{panel.matches.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8f5] px-4 py-3"><div><p className="mb-1 text-sm font-semibold">{match.request?.title ?? "Courier request"}</p><p className="mb-0 text-xs text-courier-muted">{match.request?.requester.displayName} · {match.request?.originName} → {match.request?.destinationName}</p></div>{match.status === "CANDIDATE" ? <PrimaryButton type="button" disabled={submitting} onClick={() => onRespond(match.id, item.id)}>I can carry this</PrimaryButton> : <StatusBadge status={match.status} />}</div>)}</div>}</div>}
    </article>;
}
