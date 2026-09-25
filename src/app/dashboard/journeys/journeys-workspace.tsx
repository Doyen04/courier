"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
    apiRequest,
    ApiRequestError,
    parseRouteStops,
    validationFieldErrors,
    type Itinerary,
    type MatchPanel,
} from "../dashboard-data";
import {
    EmptyState,
    InlineMessage,
    LoadingPanel,
    PrimaryButton,
    WorkspaceHeading,
} from "../workspace-ui";
import { JourneyCard } from "./components/journey-card";
import { JourneyForm } from "./components/journey-form";

function journeyFieldErrors(cause: unknown): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const [key, message] of Object.entries(validationFieldErrors(cause))) {
        fields[key.startsWith("routeStops") ? "routeStopsText" : key] = message;
    }
    return fields;
}

export function JourneysWorkspace({
    initiallyOpen = false,
}: {
    initiallyOpen?: boolean;
}) {
    const [items, setItems] = useState<Itinerary[]>([]);
    const [matches, setMatches] = useState<Record<string, MatchPanel>>({});
    const [matching, setMatching] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formOpen, setFormOpen] = useState(initiallyOpen);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<string | null>(null);

    function reportFailure(cause: unknown, fallback: string) {
        const fields = journeyFieldErrors(cause);
        setFieldErrors(fields);
        if (cause instanceof ApiRequestError && Object.keys(fields).length > 0) {
            setError("Check the highlighted fields below.");
            return;
        }
        setError(cause instanceof Error ? cause.message : fallback);
    }

    const refresh = useCallback(async () => {
        try {
            const result = await apiRequest<{ items: Itinerary[] }>(
                "/api/v1/itineraries?limit=100",
            );
            setItems(result.items);
            setError(null);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Your journeys could not be loaded.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void refresh();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [refresh]);

    async function loadMatches(id: string) {
        setMatching(id);
        setError(null);
        try {
            const result = await apiRequest<MatchPanel>(
                `/api/v1/itineraries/${id}/matches`,
            );
            setMatches((current) => ({ ...current, [id]: result }));
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Matching requests could not be loaded.",
            );
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
        setFieldErrors({});
        try {
            await apiRequest("/api/v1/itineraries", {
                method: "POST",
                body: JSON.stringify({
                    originName: form.get("originName"),
                    originCountryCode: form.get("originCountryCode"),
                    destinationName: form.get("destinationName"),
                    destinationCountryCode: form.get("destinationCountryCode"),
                    routeStops: parseRouteStops(String(form.get("routeStopsText") ?? "")),
                    departureAt: new Date(String(form.get("departureAt"))).toISOString(),
                    arrivalBy: new Date(String(form.get("arrivalBy"))).toISOString(),
                }),
            });
            formElement.reset();
            setFormOpen(false);
            setNotice("Journey shared. We’ll look for requests along your route.");
            await refresh();
        } catch (cause) {
            reportFailure(cause, "Your journey could not be created.");
        } finally {
            setSubmitting(false);
        }
    }

    async function updateJourney(
        event: FormEvent<HTMLFormElement>,
        item: Itinerary,
    ): Promise<boolean> {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSubmitting(true);
        setError(null);
        setFieldErrors({});
        try {
            await apiRequest(`/api/v1/itineraries/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    originName: form.get("originName"),
                    originCountryCode: form.get("originCountryCode"),
                    destinationName: form.get("destinationName"),
                    destinationCountryCode: form.get("destinationCountryCode"),
                    routeStops: parseRouteStops(String(form.get("routeStopsText") ?? "")),
                    departureAt: new Date(String(form.get("departureAt"))).toISOString(),
                    arrivalBy: new Date(String(form.get("arrivalBy"))).toISOString(),
                }),
            });
            setNotice("Journey details updated.");
            await refresh();
            return true;
        } catch (cause) {
            reportFailure(cause, "Your journey could not be updated.");
            return false;
        } finally {
            setSubmitting(false);
        }
    }

    async function cancelJourney(id: string) {
        if (
            !window.confirm(
                "Cancel this journey? Any open match responses will expire.",
            )
        )
            return;
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/itineraries/${id}`, { method: "DELETE" });
            setNotice("Journey cancelled.");
            await refresh();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Your journey could not be cancelled.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function respond(matchId: string, itineraryId: string) {
        setSubmitting(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/matches/${matchId}/interest`, {
                method: "POST",
            });
            setNotice("Your interest was sent to the requester.");
            await loadMatches(itineraryId);
            await refresh();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Your response could not be saved.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <WorkspaceHeading
                eyebrow="Traveler workspace"
                title="My journeys"
                description="Share trips you already have planned and see requests that fit along the way."
                action={
                    <PrimaryButton
                        type="button"
                        onClick={() => setFormOpen((open) => !open)}
                    >
                        {formOpen ? "Close form" : "+ Share a journey"}
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
            {formOpen && (
                <JourneyForm
                    onSubmit={createJourney}
                    submitting={submitting}
                    errors={fieldErrors}
                />
            )}
            {loading ? (
                <LoadingPanel label="Loading your journeys…" />
            ) : items.length === 0 ? (
                <EmptyState
                    title="No journeys yet"
                    body="Share a trip you already have planned. We’ll surface requests that could fit along your route."
                    action="Share a journey"
                    onAction={() => setFormOpen(true)}
                />
            ) : (
                <div className="grid gap-4">
                    {items.map((item) => (
                        <JourneyCard
                            key={item.id}
                            item={item}
                            panel={matches[item.id]}
                            matching={matching === item.id}
                            submitting={submitting}
                            fieldErrors={fieldErrors}
                            onMatches={() => void loadMatches(item.id)}
                            onRespond={respond}
                            onUpdate={updateJourney}
                            onCancel={cancelJourney}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
