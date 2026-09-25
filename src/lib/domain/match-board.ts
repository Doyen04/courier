import { prisma } from "@/lib/db/prisma";
import { refreshMatchesForItinerary, refreshMatchesForRequest } from "@/lib/domain/matching";

const tripCard = {
    id: true,
    originName: true,
    originCountryCode: true,
    destinationName: true,
    destinationCountryCode: true,
    departureAt: true,
    arrivalBy: true,
    status: true,
} as const;

const requestCard = {
    id: true,
    title: true,
    itemCostMinor: true,
    currency: true,
    originName: true,
    originCountryCode: true,
    destinationName: true,
    destinationCountryCode: true,
    neededBy: true,
    status: true,
} as const;

export async function listRequestsMatchingMyJourneys(travelerId: string) {
    const journeys = await prisma.itinerary.findMany({
        where: { travelerId },
        select: {
            ...tripCard,
            matches: {
                where: { status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] } },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    request: {
                        select: {
                            ...requestCard,
                            requester: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: [{ score: "desc" }, { createdAt: "desc" }],
            },
        },
        orderBy: [{ departureAt: "desc" }],
        take: 50,
    });

    return journeys
        .filter((journey) => journey.matches.length > 0)
        .map(({ matches, ...itinerary }) => ({ itinerary, matches }));
}

export async function refreshRequestsMatchingMyJourneys(travelerId: string) {
    const journeys = await prisma.itinerary.findMany({
        where: { travelerId, status: { in: ["PLANNED", "ACTIVE"] } },
        select: { id: true },
        orderBy: [{ departureAt: "desc" }],
        take: 25,
    });

    for (const journey of journeys) {
        await refreshMatchesForItinerary(journey.id, travelerId);
    }

    return listRequestsMatchingMyJourneys(travelerId);
}

export async function listJourneysMatchingMyRequests(requesterId: string) {
    const requests = await prisma.itemRequest.findMany({
        where: { requesterId },
        select: {
            ...requestCard,
            matches: {
                where: { status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] } },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    itinerary: {
                        select: {
                            ...tripCard,
                            traveler: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: [{ score: "desc" }, { createdAt: "desc" }],
            },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
    });

    return requests
        .filter((request) => request.matches.length > 0)
        .map(({ matches, ...request }) => ({ request, matches }));
}

export async function refreshJourneysMatchingMyRequests(requesterId: string) {
    const requests = await prisma.itemRequest.findMany({
        where: { requesterId, status: { in: ["OPEN", "MATCHED"] } },
        select: { id: true },
        orderBy: [{ createdAt: "desc" }],
        take: 25,
    });

    for (const request of requests) {
        await refreshMatchesForRequest(request.id);
    }

    return listJourneysMatchingMyRequests(requesterId);
}
