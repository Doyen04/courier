"use client";

import { useCallback, useEffect, useState } from "react";
import {
    apiRequest,
    dateLabel,
    fitPercent,
    formatMoney,
    type TripMatchGroup,
} from "../../dashboard-data";
import {
    EmptyState,
    InlineMessage,
    LoadingPanel,
    PrimaryButton,
    StatusBadge,
    WorkspaceHeading,
} from "../../workspace-ui";

function FitBadge({ score }: { score: number | string | null }) {
    const percent = fitPercent(score);
    if (percent === null) return null;
    return (
        <span className="rounded-full bg-[#f7efe3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#805720]">
            {percent}% fit
        </span>
    );
}

export function TripMatchesWorkspace() {
    const [groups, setGroups] = useState<TripMatchGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [responding, setResponding] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const result = await apiRequest<{ groups: TripMatchGroup[] }>(
                "/api/v1/matches/requests",
            );
            setGroups(result.groups);
            setError(null);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Matching requests could not be loaded.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [load]);

    async function refreshMatches() {
        setRefreshing(true);
        setError(null);
        setNotice(null);
        try {
            const result = await apiRequest<{ groups: TripMatchGroup[] }>(
                "/api/v1/matches/requests",
                { method: "POST" },
            );
            setGroups(result.groups);
            setNotice(
                "Matches refreshed. We checked every planned journey on your account.",
            );
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Matches could not be refreshed right now.",
            );
        } finally {
            setRefreshing(false);
        }
    }

    async function expressInterest(matchId: string) {
        setResponding(matchId);
        setError(null);
        try {
            await apiRequest(`/api/v1/matches/${matchId}/interest`, {
                method: "POST",
            });
            setNotice("Your interest was sent to the requester.");
            await load();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Your response could not be saved.",
            );
        } finally {
            setResponding(null);
        }
    }

    return (
        <>
            <WorkspaceHeading
                eyebrow="Traveler workspace"
                title="Requests for my trips"
                description="Everything people need along the routes you are already travelling, grouped by your journeys."
                action={
                    <PrimaryButton
                        type="button"
                        onClick={() => void refreshMatches()}
                        disabled={refreshing}
                    >
                        {refreshing ? "Refreshing…" : "Refresh matches"}
                    </PrimaryButton>
                }
            />
            <InlineMessage
                error={error}
                notice={notice}
                onDismiss={() => {
                    setError(null);
                    setNotice(null);
                }}
            />
            {loading ? (
                <LoadingPanel label="Looking for requests that fit your trips…" />
            ) : groups.length === 0 ? (
                <EmptyState
                    title="No matching requests yet"
                    body="Share a journey and we’ll surface the requests that fit along your route."
                    action="Share a journey"
                    href="/dashboard/journeys"
                />
            ) : (
                <div className="grid gap-4">
                    {groups.map((group) => (
                        <article
                            key={group.itinerary.id}
                            className="rounded-2xl border border-courier-line bg-white p-5 sm:p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">
                                        {group.itinerary.originCountryCode} · Departs{" "}
                                        {dateLabel(group.itinerary.departureAt)}
                                    </p>
                                    <h2 className="mb-0 font-display text-xl font-semibold tracking-tight">
                                        {group.itinerary.originName}{" "}
                                        <span className="text-courier-gold">→</span>{" "}
                                        {group.itinerary.destinationName}
                                    </h2>
                                </div>
                                <StatusBadge status={group.itinerary.status} />
                            </div>
                            <p className="mb-4 mt-4 text-sm text-courier-muted">
                                Arrives by {dateLabel(group.itinerary.arrivalBy)} ·{" "}
                                {group.matches.length} matching request
                                {group.matches.length === 1 ? "" : "s"}
                            </p>
                            <div className="grid gap-2">
                                {group.matches.map((match) => (
                                    <div
                                        key={match.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8f5] px-4 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-courier-ink">
                                                {match.request.title}
                                                <FitBadge score={match.score} />
                                            </p>
                                            <p className="mb-0 text-xs text-courier-muted">
                                                {match.request.requester.displayName} ·{" "}
                                                {match.request.originName} →{" "}
                                                {match.request.destinationName}
                                            </p>
                                            <p className="mb-0 text-xs text-courier-muted">
                                                {formatMoney(
                                                    match.request.itemCostMinor,
                                                    match.request.currency,
                                                )}{" "}
                                                · needed by {dateLabel(match.request.neededBy)}
                                            </p>
                                        </div>
                                        {match.status === "CANDIDATE" ? (
                                            <PrimaryButton
                                                type="button"
                                                disabled={responding === match.id}
                                                onClick={() => void expressInterest(match.id)}
                                            >
                                                {responding === match.id
                                                    ? "Sending…"
                                                    : "I can carry this"}
                                            </PrimaryButton>
                                        ) : (
                                            <StatusBadge status={match.status} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
