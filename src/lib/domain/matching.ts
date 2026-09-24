import { routeStopSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";

type Location = {
    name: string;
    countryCode: string;
    latitude: number | null;
    longitude: number | null;
};

function normalizeName(value: string) {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("en")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function distanceKm(first: Location, second: Location) {
    if (
        first.latitude === null ||
        first.longitude === null ||
        second.latitude === null ||
        second.longitude === null
    ) {
        return normalizeName(first.name) === normalizeName(second.name) &&
            first.countryCode.toUpperCase() === second.countryCode.toUpperCase()
            ? 0
            : Number.POSITIVE_INFINITY;
    }

    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(second.latitude - first.latitude);
    const longitudeDelta = radians(second.longitude - first.longitude);
    const a =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(first.latitude)) *
        Math.cos(radians(second.latitude)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cityLocation(value: {
    originName?: string;
    originCountryCode?: string;
    originLatitude?: { toNumber(): number } | number | null;
    originLongitude?: { toNumber(): number } | number | null;
    destinationName?: string;
    destinationCountryCode?: string;
    destinationLatitude?: { toNumber(): number } | number | null;
    destinationLongitude?: { toNumber(): number } | number | null;
}, side: "origin" | "destination"): Location {
    const rawLat = value[`${side}Latitude`];
    const rawLng = value[`${side}Longitude`];
    return {
        name: value[`${side}Name`] ?? "",
        countryCode: value[`${side}CountryCode`] ?? "",
        latitude: rawLat == null ? null : typeof rawLat === "number" ? rawLat : rawLat.toNumber(),
        longitude: rawLng == null ? null : typeof rawLng === "number" ? rawLng : rawLng.toNumber(),
    };
}

function itineraryWaypoints(itinerary: {
    originName: string;
    originCountryCode: string;
    originLatitude: { toNumber(): number } | null;
    originLongitude: { toNumber(): number } | null;
    destinationName: string;
    destinationCountryCode: string;
    destinationLatitude: { toNumber(): number } | null;
    destinationLongitude: { toNumber(): number } | null;
    routeStops: unknown;
}): Location[] {
    const origin = cityLocation(itinerary, "origin");
    const destination = cityLocation(itinerary, "destination");
    const parsedStops = routeStopSchema.array().max(20).safeParse(itinerary.routeStops ?? []);
    const stops: Location[] = parsedStops.success
        ? parsedStops.data.map((stop) => ({
            name: stop.name,
            countryCode: stop.countryCode,
            latitude: stop.latitude ?? null,
            longitude: stop.longitude ?? null,
        }))
        : [];

    return [origin, ...stops, destination];
}

function matchScore(
    request: {
        originName: string;
        originCountryCode: string;
        originLatitude: { toNumber(): number } | null;
        originLongitude: { toNumber(): number } | null;
        destinationName: string;
        destinationCountryCode: string;
        destinationLatitude: { toNumber(): number } | null;
        destinationLongitude: { toNumber(): number } | null;
    },
    itinerary: Parameters<typeof itineraryWaypoints>[0],
) {
    const requestOrigin = cityLocation(request, "origin");
    const requestDestination = cityLocation(request, "destination");
    const route = itineraryWaypoints(itinerary);
    let bestOriginDistance = Number.POSITIVE_INFINITY;
    let bestDestinationDistance = Number.POSITIVE_INFINITY;

    for (let originIndex = 0; originIndex < route.length - 1; originIndex += 1) {
        const originDistance = distanceKm(requestOrigin, route[originIndex]);
        if (originDistance > 30) continue;

        for (let destinationIndex = originIndex + 1; destinationIndex < route.length; destinationIndex += 1) {
            const destinationDistance = distanceKm(requestDestination, route[destinationIndex]);
            if (destinationDistance > 30) continue;
            const routeDeviation = Math.max(originDistance, destinationDistance);
            if (routeDeviation < Math.max(bestOriginDistance, bestDestinationDistance)) {
                bestOriginDistance = originDistance;
                bestDestinationDistance = destinationDistance;
            }
        }
    }

    if (!Number.isFinite(bestOriginDistance)) return null;
    return Number((1 - Math.max(bestOriginDistance, bestDestinationDistance) / 60).toFixed(4));
}

export async function refreshMatchesForRequest(requestId: string) {
    const request = await prisma.itemRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ApiProblem(404, "NOT_FOUND", "Request not found.");

    if (request.status !== "OPEN" && request.status !== "MATCHED") {
        await prisma.routeMatch.updateMany({
            where: { requestId, status: { in: ["CANDIDATE", "INTERESTED"] } },
            data: { status: "EXPIRED" },
        });
        return [];
    }

    const now = new Date();
    const deadline = request.neededBy
        ? new Date(request.neededBy.getTime() + 24 * 60 * 60 * 1000 - 1)
        : undefined;
    const itineraryWhere: Prisma.ItineraryWhereInput = {
        status: { in: ["PLANNED", "ACTIVE"] },
        arrivalBy: { gte: now, ...(deadline ? { lte: deadline } : {}) },
    };

    const matchedItineraries: { id: string; score: number }[] = [];
    let cursor: string | undefined;
    while (true) {
        const batch = await prisma.itinerary.findMany({
            where: itineraryWhere,
            select: {
                id: true,
                travelerId: true,
                originName: true,
                originCountryCode: true,
                originLatitude: true,
                originLongitude: true,
                destinationName: true,
                destinationCountryCode: true,
                destinationLatitude: true,
                destinationLongitude: true,
                routeStops: true,
                arrivalBy: true,
            },
            orderBy: { id: "asc" },
            take: 250,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        if (batch.length === 0) break;

        for (const itinerary of batch) {
            if (itinerary.travelerId === request.requesterId) continue;
            const score = matchScore(request, itinerary);
            if (score !== null) matchedItineraries.push({ id: itinerary.id, score });
        }

        cursor = batch.at(-1)?.id;
        if (batch.length < 250) break;
    }

    const candidateIds = matchedItineraries.map(({ id }) => id);
    await prisma.$transaction(async (tx) => {
        await tx.routeMatch.updateMany({
            where: {
                requestId,
                status: { in: ["CANDIDATE", "INTERESTED"] },
                ...(candidateIds.length ? { itineraryId: { notIn: candidateIds } } : {}),
            },
            data: { status: "EXPIRED" },
        });

        if (matchedItineraries.length) {
            const existing = await tx.routeMatch.findMany({
                where: { requestId, itineraryId: { in: candidateIds } },
                select: { id: true, itineraryId: true, status: true },
            });
            const byItinerary = new Map(existing.map((match) => [match.itineraryId, match]));

            for (const candidate of matchedItineraries) {
                const prior = byItinerary.get(candidate.id);
                if (!prior) {
                    await tx.routeMatch.create({
                        data: {
                            requestId,
                            itineraryId: candidate.id,
                            status: "CANDIDATE",
                            score: candidate.score,
                        },
                    });
                } else if (prior.status === "EXPIRED") {
                    await tx.routeMatch.update({
                        where: { id: prior.id },
                        data: { status: "CANDIDATE", score: candidate.score },
                    });
                } else if (prior.status === "CANDIDATE") {
                    await tx.routeMatch.update({ where: { id: prior.id }, data: { score: candidate.score } });
                }
            }
        }

        const activeMatches = await tx.routeMatch.count({
            where: { requestId, status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] } },
        });
        await tx.itemRequest.updateMany({
            where: { id: requestId, status: { in: ["OPEN", "MATCHED"] } },
            data: { status: activeMatches ? "MATCHED" : "OPEN" },
        });
    });

    return prisma.routeMatch.findMany({
        where: {
            requestId,
            status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] },
        },
        include: {
            itinerary: {
                include: {
                    traveler: { select: { id: true, displayName: true, imageUrl: true } },
                },
            },
        },
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    });
}

export async function refreshMatchesForItinerary(itineraryId: string, travelerId: string) {
    const itinerary = await prisma.itinerary.findFirst({ where: { id: itineraryId, travelerId } });
    if (!itinerary) throw new ApiProblem(404, "NOT_FOUND", "Itinerary not found.");

    if (
        (itinerary.status === "PLANNED" || itinerary.status === "ACTIVE") &&
        itinerary.arrivalBy >= new Date()
    ) {
        const requests = await prisma.itemRequest.findMany({
            where: {
                requesterId: { not: travelerId },
                status: { in: ["OPEN", "MATCHED"] },
                OR: [
                    { neededBy: null },
                    { neededBy: { gte: new Date(Date.UTC(itinerary.arrivalBy.getUTCFullYear(), itinerary.arrivalBy.getUTCMonth(), itinerary.arrivalBy.getUTCDate())) } },
                ],
            },
            select: {
                id: true,
                requesterId: true,
                originName: true,
                originCountryCode: true,
                originLatitude: true,
                originLongitude: true,
                destinationName: true,
                destinationCountryCode: true,
                destinationLatitude: true,
                destinationLongitude: true,
                neededBy: true,
            },
        });

        const candidates = requests.flatMap((request) => {
            const score = matchScore(request, itinerary);
            return score === null ? [] : [{ requestId: request.id, score }];
        });
        const candidateRequestIds = candidates.map(({ requestId }) => requestId);

        await prisma.$transaction(async (tx) => {
            const staleMatches = await tx.routeMatch.findMany({
                where: {
                    itineraryId,
                    status: { in: ["CANDIDATE", "INTERESTED"] },
                    ...(candidateRequestIds.length
                        ? { requestId: { notIn: candidateRequestIds } }
                        : {}),
                },
                select: { requestId: true },
            });
            await tx.routeMatch.updateMany({
                where: {
                    itineraryId,
                    status: { in: ["CANDIDATE", "INTERESTED"] },
                    ...(candidateRequestIds.length
                        ? { requestId: { notIn: candidateRequestIds } }
                        : {}),
                },
                data: { status: "EXPIRED" },
            });

            if (candidates.length) {
                const existing = await tx.routeMatch.findMany({
                    where: { itineraryId, requestId: { in: candidateRequestIds } },
                    select: { id: true, requestId: true, status: true },
                });
                const byRequest = new Map(existing.map((match) => [match.requestId, match]));

                for (const candidate of candidates) {
                    const prior = byRequest.get(candidate.requestId);
                    if (!prior) {
                        await tx.routeMatch.create({
                            data: {
                                requestId: candidate.requestId,
                                itineraryId,
                                status: "CANDIDATE",
                                score: candidate.score,
                            },
                        });
                    } else if (prior.status === "EXPIRED") {
                        await tx.routeMatch.update({
                            where: { id: prior.id },
                            data: { status: "CANDIDATE", score: candidate.score },
                        });
                    } else if (prior.status === "CANDIDATE") {
                        await tx.routeMatch.update({ where: { id: prior.id }, data: { score: candidate.score } });
                    }
                }
            }

            const affectedRequestIds = new Set([
                ...candidateRequestIds,
                ...staleMatches.map(({ requestId }) => requestId),
            ]);
            for (const requestId of affectedRequestIds) {
                const activeMatches = await tx.routeMatch.count({
                    where: { requestId, status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] } },
                });
                await tx.itemRequest.updateMany({
                    where: { id: requestId, status: { in: ["OPEN", "MATCHED"] } },
                    data: { status: activeMatches ? "MATCHED" : "OPEN" },
                });
            }
        });
    } else {
        const affected = await prisma.routeMatch.findMany({
            where: { itineraryId, status: { in: ["CANDIDATE", "INTERESTED"] } },
            select: { requestId: true },
        });
        await prisma.$transaction(async (tx) => {
            await tx.routeMatch.updateMany({
                where: { itineraryId, status: { in: ["CANDIDATE", "INTERESTED"] } },
                data: { status: "EXPIRED" },
            });
            for (const { requestId } of affected) {
                const activeMatches = await tx.routeMatch.count({
                    where: { requestId, status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] } },
                });
                if (!activeMatches) {
                    await tx.itemRequest.updateMany({
                        where: { id: requestId, status: "MATCHED" },
                        data: { status: "OPEN" },
                    });
                }
            }
        });
    }

    return prisma.routeMatch.findMany({
        where: {
            itineraryId,
            status: { in: ["CANDIDATE", "INTERESTED", "AGREEMENT_STARTED"] },
        },
        include: {
            request: {
                include: {
                    requester: { select: { id: true, displayName: true, imageUrl: true } },
                },
            },
        },
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    });
}

export async function expressInterest(matchId: string, travelerId: string) {
    const match = await prisma.routeMatch.findFirst({
        where: { id: matchId, itinerary: { is: { travelerId } } },
    });
    if (!match) throw new ApiProblem(404, "NOT_FOUND", "Match not found.");
    if (match.status === "INTERESTED") return match;
    if (match.status !== "CANDIDATE") {
        throw new ApiProblem(409, "CONFLICT", "This match is no longer available to respond to.");
    }

    const changed = await prisma.routeMatch.updateMany({
        where: { id: matchId, status: "CANDIDATE", itinerary: { is: { travelerId } } },
        data: { status: "INTERESTED" },
    });
    if (changed.count === 0) {
        throw new ApiProblem(409, "CONFLICT", "This match changed before your response was saved.");
    }
    return prisma.routeMatch.findUniqueOrThrow({ where: { id: matchId } });
}
