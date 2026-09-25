"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    apiRequest,
    dateLabel,
    fitPercent,
    formatMoney,
    type RequestMatchGroup,
} from "../../dashboard-data";
import {
    EmptyState,
    InlineMessage,
    LoadingPanel,
    PrimaryButton,
    SecondaryButton,
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

export function JourneyMatchesWorkspace() {
    const router = useRouter();
    const [groups, setGroups] = useState<RequestMatchGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [starting, setStarting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const result = await apiRequest<{ groups: RequestMatchGroup[] }>(
                "/api/v1/matches/journeys",
            );
            setGroups(result.groups);
            setError(null);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Matching journeys could not be loaded.",
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
            const result = await apiRequest<{ groups: RequestMatchGroup[] }>(
                "/api/v1/matches/journeys",
                { method: "POST" },
            );
            setGroups(result.groups);
            setNotice(
                "Matches refreshed. We checked every open request on your account.",
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

    async function startAgreement(matchId: string) {
        setStarting(matchId);
        setError(null);
        try {
            await apiRequest("/api/v1/agreements", {
                method: "POST",
                body: JSON.stringify({ matchId }),
            });
            router.push("/dashboard/agreements");
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "The agreement could not be started.",
            );
        } finally {
            setStarting(null);
        }
    }

    return (
        <>
            <WorkspaceHeading
                eyebrow="Requester workspace"
                title="Journeys for my requests"
                description="Travelers whose routes already pass through what you need, grouped by your requests."
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
                <LoadingPanel label="Looking for journeys that fit your requests…" />
            ) : groups.length === 0 ? (
                <EmptyState
                    title="No matching journeys yet"
                    body="Post a request and we’ll surface travelers whose journeys pass through it."
                    action="Create a request"
                    href="/dashboard/requests?new=1"
                />
            ) : (
                <div className="grid gap-4">
                    {groups.map((group) => (
                        <article
                            key={group.request.id}
                            className="rounded-2xl border border-courier-line bg-white p-5 sm:p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-courier-muted">
                                        {group.request.originName},{" "}
                                        {group.request.originCountryCode}{" "}
                                        <span className="text-courier-gold">→</span>{" "}
                                        {group.request.destinationName},{" "}
                                        {group.request.destinationCountryCode}
                                    </p>
                                    <h2 className="mb-0 font-display text-xl font-semibold tracking-tight">
                                        {group.request.title}
                                    </h2>
                                </div>
                                <StatusBadge status={group.request.status} />
                            </div>
                            <p className="mb-4 mt-4 text-sm text-courier-muted">
                                {formatMoney(
                                    group.request.itemCostMinor,
                                    group.request.currency,
                                )}{" "}
                                <span className="font-normal">
                                    · needed by {dateLabel(group.request.neededBy)}
                                </span>{" "}
                                · {group.matches.length} matching journey
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
                                                {match.itinerary.traveler.displayName}
                                                <FitBadge score={match.score} />
                                            </p>
                                            <p className="mb-0 text-xs text-courier-muted">
                                                {match.itinerary.originName} →{" "}
                                                {match.itinerary.destinationName}
                                            </p>
                                            <p className="mb-0 text-xs text-courier-muted">
                                                Departs {dateLabel(match.itinerary.departureAt)} ·
                                                arrives by {dateLabel(match.itinerary.arrivalBy)}
                                            </p>
                                        </div>
                                        {match.status === "INTERESTED" ? (
                                            <PrimaryButton
                                                type="button"
                                                disabled={starting === match.id}
                                                onClick={() => void startAgreement(match.id)}
                                            >
                                                {starting === match.id
                                                    ? "Starting…"
                                                    : "Start agreement"}
                                            </PrimaryButton>
                                        ) : match.status === "CANDIDATE" ? (
                                            <SecondaryButton type="button" disabled>
                                                Waiting for traveler
                                            </SecondaryButton>
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
