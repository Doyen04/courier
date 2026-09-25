"use client";

import { useState, type FormEvent } from "react";
import { dateLabel, type Itinerary, type MatchPanel } from "../../dashboard-data";
import {
    PrimaryButton,
    SecondaryButton,
    StatusBadge,
} from "../../workspace-ui";
import { JourneyFields } from "./journey-fields";

export function JourneyCard({
    item,
    panel,
    matching,
    submitting,
    fieldErrors,
    onMatches,
    onRespond,
    onUpdate,
    onCancel,
}: {
    item: Itinerary;
    panel?: MatchPanel;
    matching: boolean;
    submitting: boolean;
    fieldErrors?: Record<string, string>;
    onMatches: () => void;
    onRespond: (matchId: string, itineraryId: string) => void;
    onUpdate: (
        event: FormEvent<HTMLFormElement>,
        item: Itinerary,
    ) => Promise<boolean>;
    onCancel: (id: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const editable = item.status === "PLANNED";
    return (
        <article className="rounded-2xl border border-courier-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">
                        {item.originCountryCode} · Departs {dateLabel(item.departureAt)}
                    </p>
                    <h2 className="mb-0 font-display text-xl font-semibold tracking-tight">
                        {item.originName} <span className="text-courier-gold">→</span>{" "}
                        {item.destinationName}
                    </h2>
                </div>
                <StatusBadge status={item.status} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-4">
                <span className="text-sm text-courier-muted">
                    Arrives by {dateLabel(item.arrivalBy)}
                    {item.routeStops?.length
                        ? ` · ${item.routeStops.length} stop${item.routeStops.length === 1 ? "" : "s"}`
                        : ""}
                </span>
                <div className="flex flex-wrap gap-2">
                    <SecondaryButton type="button" onClick={onMatches}>
                        {matching
                            ? "Finding…"
                            : panel
                                ? "Refresh requests"
                                : "Find requests"}
                    </SecondaryButton>
                    {editable && (
                        <SecondaryButton
                            type="button"
                            onClick={() => setEditing((open) => !open)}
                        >
                            {editing ? "Close edit" : "Edit journey"}
                        </SecondaryButton>
                    )}
                    {editable && (
                        <button
                            className="min-h-10 rounded-xl px-3 text-xs font-semibold text-[#9a4035] hover:bg-[#fff4f1]"
                            type="button"
                            disabled={submitting}
                            onClick={() => onCancel(item.id)}
                        >
                            Cancel journey
                        </button>
                    )}
                </div>
            </div>
            {editing && (
                <form
                    className="mt-5 grid gap-3 border-t border-courier-line pt-5 sm:grid-cols-2"
                    onSubmit={async (event) => {
                        if (await onUpdate(event, item)) setEditing(false);
                    }}
                >
                    <JourneyFields item={item} errors={fieldErrors} />
                    <div className="sm:col-span-2">
                        <PrimaryButton type="submit" disabled={submitting}>
                            Save journey
                        </PrimaryButton>
                    </div>
                </form>
            )}
            {panel && (
                <div className="mt-5 border-t border-courier-line pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">
                        Requests along the way
                    </p>
                    {panel.matches.length === 0 ? (
                        <p className="mb-0 text-sm text-courier-muted">
                            No suitable requests yet. Check again later.
                        </p>
                    ) : (
                        <div className="grid gap-2">
                            {panel.matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8f5] px-4 py-3"
                                >
                                    <div>
                                        <p className="mb-1 text-sm font-semibold">
                                            {match.request?.title ?? "Courier request"}
                                        </p>
                                        <p className="mb-0 text-xs text-courier-muted">
                                            {match.request?.requester.displayName} ·{" "}
                                            {match.request?.originName} →{" "}
                                            {match.request?.destinationName}
                                        </p>
                                    </div>
                                    {match.status === "CANDIDATE" ? (
                                        <PrimaryButton
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => onRespond(match.id, item.id)}
                                        >
                                            I can carry this
                                        </PrimaryButton>
                                    ) : (
                                        <StatusBadge status={match.status} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
