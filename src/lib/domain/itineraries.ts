import { prisma } from "@/lib/db/prisma";
import { ApiProblem } from "@/lib/http/api-problem";
import { refreshMatchesForItinerary } from "@/lib/domain/matching";
import { errorFields, logger } from "@/lib/logging/logger";
import type {
  createItinerarySchema,
  itineraryListQuerySchema,
  updateItinerarySchema,
} from "@/lib/domain/schemas";
import type { z } from "zod";

type CreateInput = z.infer<typeof createItinerarySchema>;
type UpdateInput = z.infer<typeof updateItinerarySchema>;
type ListInput = z.infer<typeof itineraryListQuerySchema>;

async function refreshMatchesSafely(itineraryId: string, travelerId: string) {
  try {
    await refreshMatchesForItinerary(itineraryId, travelerId);
  } catch (error) {
    logger.warn("matching.refresh.failed", {
      entityType: "Itinerary",
      entityId: itineraryId,
      ...errorFields(error),
    });
  }
}

function checkCoordinatePairs(value: {
  originLatitude?: unknown;
  originLongitude?: unknown;
  destinationLatitude?: unknown;
  destinationLongitude?: unknown;
}) {
  if ((value.originLatitude == null) !== (value.originLongitude == null)) {
    throw new ApiProblem(422, "VALIDATION_ERROR", "Origin needs both coordinates or neither.");
  }
  if ((value.destinationLatitude == null) !== (value.destinationLongitude == null)) {
    throw new ApiProblem(422, "VALIDATION_ERROR", "Destination needs both coordinates or neither.");
  }
}

export async function listItineraries(travelerId: string, input: ListInput) {
  const cursorRow = input.cursor
    ? await prisma.itinerary.findFirst({
        where: { id: input.cursor, travelerId },
        select: { id: true, createdAt: true },
      })
    : null;
  if (input.cursor && !cursorRow) {
    throw new ApiProblem(400, "BAD_REQUEST", "The pagination cursor is invalid.");
  }

  const rows = await prisma.itinerary.findMany({
    where: {
      travelerId,
      ...(input.status ? { status: input.status } : {}),
      ...(cursorRow
        ? {
            OR: [
              { createdAt: { lt: cursorRow.createdAt } },
              { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;
  return {
    items,
    pageInfo: {
      limit: input.limit,
      hasMore,
      nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    },
  };
}

export async function createItinerary(travelerId: string, input: CreateInput) {
  checkCoordinatePairs(input);
  const itinerary = await prisma.itinerary.create({
    data: {
      ...input,
      travelerId,
      routeStops: input.routeStops ?? undefined,
      status: "PLANNED",
    },
  });
  await refreshMatchesSafely(itinerary.id, travelerId);
  return getItinerary(travelerId, itinerary.id);
}

export async function getItinerary(travelerId: string, id: string) {
  const itinerary = await prisma.itinerary.findFirst({ where: { id, travelerId } });
  if (!itinerary) throw new ApiProblem(404, "NOT_FOUND", "Itinerary not found.");
  return itinerary;
}

export async function updateItinerary(
  travelerId: string,
  id: string,
  input: UpdateInput,
) {
  const existing = await prisma.itinerary.findFirst({ where: { id, travelerId } });
  if (!existing) throw new ApiProblem(404, "NOT_FOUND", "Itinerary not found.");
  if (existing.status !== "PLANNED") {
    throw new ApiProblem(409, "CONFLICT", "This itinerary can no longer be edited.");
  }
  const agreementStarted = await prisma.routeMatch.count({
    where: { itineraryId: id, status: "AGREEMENT_STARTED" },
  });
  if (agreementStarted) {
    throw new ApiProblem(409, "CONFLICT", "This itinerary already has an agreement in progress.");
  }

  const combined = { ...existing, ...input };
  checkCoordinatePairs(combined);
  const departureAt = input.departureAt ?? existing.departureAt;
  const arrivalBy = input.arrivalBy ?? existing.arrivalBy;
  if (departureAt < new Date()) {
    throw new ApiProblem(422, "VALIDATION_ERROR", "Departure must be in the future.");
  }
  if (arrivalBy <= departureAt) {
    throw new ApiProblem(422, "VALIDATION_ERROR", "Arrival must be after departure.");
  }

  const changed = await prisma.itinerary.updateMany({
    where: { id, travelerId, status: "PLANNED" },
    data: { ...input, routeStops: input.routeStops },
  });
  if (changed.count === 0) {
    throw new ApiProblem(409, "CONFLICT", "This itinerary changed and can no longer be edited.");
  }
  await refreshMatchesSafely(id, travelerId);
  return getItinerary(travelerId, id);
}

export async function cancelItinerary(travelerId: string, id: string) {
  const existing = await prisma.itinerary.findFirst({ where: { id, travelerId } });
  if (!existing) throw new ApiProblem(404, "NOT_FOUND", "Itinerary not found.");
  if (existing.status === "CANCELLED") return existing;
  if (existing.status !== "PLANNED") {
    throw new ApiProblem(409, "CONFLICT", "This itinerary can no longer be cancelled directly.");
  }
  const agreementStarted = await prisma.routeMatch.count({
    where: { itineraryId: id, status: "AGREEMENT_STARTED" },
  });
  if (agreementStarted) {
    throw new ApiProblem(409, "CONFLICT", "Cancel the agreement before cancelling this itinerary.");
  }

  const changed = await prisma.itinerary.updateMany({
    where: { id, travelerId, status: "PLANNED" },
    data: { status: "CANCELLED" },
  });
  if (changed.count === 0) {
    throw new ApiProblem(409, "CONFLICT", "This itinerary changed and can no longer be cancelled.");
  }
  await refreshMatchesSafely(id, travelerId);
  return getItinerary(travelerId, id);
}
