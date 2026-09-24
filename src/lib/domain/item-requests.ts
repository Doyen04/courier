import { prisma } from "@/lib/db/prisma";
import { ApiProblem } from "@/lib/http/api-problem";
import { refreshMatchesForRequest } from "@/lib/domain/matching";
import { logger } from "@/lib/logging/logger";
import type {
  createItemRequestSchema,
  requestListQuerySchema,
  updateItemRequestSchema,
} from "@/lib/domain/schemas";
import type { z } from "zod";

type CreateInput = z.infer<typeof createItemRequestSchema>;
type UpdateInput = z.infer<typeof updateItemRequestSchema>;
type ListInput = z.infer<typeof requestListQuerySchema>;

async function refreshMatchesSafely(requestId: string) {
  try {
    await refreshMatchesForRequest(requestId);
  } catch (error) {
    logger.warn("matching.refresh.failed", {
      entityType: "ItemRequest",
      entityId: requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }
}

function assertNeededByNotPast(neededBy: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (new Date(`${neededBy}T00:00:00.000Z`) < today) {
    throw new ApiProblem(422, "VALIDATION_ERROR", "The requested delivery date must be today or later.");
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

export async function listItemRequests(requesterId: string, input: ListInput) {
  const cursorRow = input.cursor
    ? await prisma.itemRequest.findFirst({
        where: { id: input.cursor, requesterId },
        select: { id: true, createdAt: true },
      })
    : null;

  if (input.cursor && !cursorRow) {
    throw new ApiProblem(400, "BAD_REQUEST", "The pagination cursor is invalid.");
  }

  const rows = await prisma.itemRequest.findMany({
    where: {
      requesterId,
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

export async function createItemRequest(requesterId: string, input: CreateInput) {
  checkCoordinatePairs(input);
  if (input.neededBy) assertNeededByNotPast(input.neededBy);
  const itemRequest = await prisma.itemRequest.create({
    data: {
      ...input,
      requesterId,
      neededBy: input.neededBy ? new Date(`${input.neededBy}T00:00:00.000Z`) : null,
      status: "OPEN",
    },
  });
  await refreshMatchesSafely(itemRequest.id);
  return getItemRequest(requesterId, itemRequest.id);
}

export async function getItemRequest(requesterId: string, id: string) {
  const itemRequest = await prisma.itemRequest.findFirst({ where: { id, requesterId } });
  if (!itemRequest) throw new ApiProblem(404, "NOT_FOUND", "Request not found.");
  return itemRequest;
}

export async function updateItemRequest(
  requesterId: string,
  id: string,
  input: UpdateInput,
) {
  const existing = await prisma.itemRequest.findFirst({ where: { id, requesterId } });
  if (!existing) throw new ApiProblem(404, "NOT_FOUND", "Request not found.");
  if (!["OPEN", "DRAFT", "MATCHED"].includes(existing.status)) {
    throw new ApiProblem(409, "CONFLICT", "This request can no longer be edited.");
  }
  const agreementStarted = await prisma.routeMatch.count({
    where: { requestId: id, status: "AGREEMENT_STARTED" },
  });
  if (agreementStarted) {
    throw new ApiProblem(409, "CONFLICT", "This request already has an agreement in progress.");
  }
  if (input.neededBy) assertNeededByNotPast(input.neededBy);

  const combined = { ...existing, ...input };
  checkCoordinatePairs(combined);

  const { neededBy, ...fields } = input;
  const changed = await prisma.itemRequest.updateMany({
    where: { id, requesterId, status: { in: ["OPEN", "DRAFT", "MATCHED"] } },
    data: {
      ...fields,
      ...(neededBy !== undefined
        ? { neededBy: neededBy ? new Date(`${neededBy}T00:00:00.000Z`) : null }
        : {}),
    },
  });

  if (changed.count === 0) {
    throw new ApiProblem(409, "CONFLICT", "This request changed and can no longer be edited.");
  }
  await refreshMatchesSafely(id);
  return getItemRequest(requesterId, id);
}

export async function cancelItemRequest(requesterId: string, id: string) {
  const existing = await prisma.itemRequest.findFirst({ where: { id, requesterId } });
  if (!existing) throw new ApiProblem(404, "NOT_FOUND", "Request not found.");
  if (existing.status === "CANCELLED") return existing;
  if (!["OPEN", "DRAFT", "MATCHED"].includes(existing.status)) {
    throw new ApiProblem(409, "CONFLICT", "This request can no longer be cancelled directly.");
  }
  const agreementStarted = await prisma.routeMatch.count({
    where: { requestId: id, status: "AGREEMENT_STARTED" },
  });
  if (agreementStarted) {
    throw new ApiProblem(409, "CONFLICT", "Cancel the agreement before cancelling this request.");
  }

  const changed = await prisma.itemRequest.updateMany({
    where: { id, requesterId, status: { in: ["OPEN", "DRAFT", "MATCHED"] } },
    data: { status: "CANCELLED" },
  });
  if (changed.count === 0) {
    throw new ApiProblem(409, "CONFLICT", "This request changed and can no longer be cancelled.");
  }
  await refreshMatchesSafely(id);
  return getItemRequest(requesterId, id);
}
