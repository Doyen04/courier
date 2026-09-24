import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ApiProblem } from "@/lib/http/api-problem";
import type { proposeTermsSchema } from "@/lib/domain/agreement-schemas";
import type { z } from "zod";

type ProposedTerms = z.infer<typeof proposeTermsSchema>;

const participantWhere = (userId: string) => ({
  OR: [{ requesterId: userId }, { travelerId: userId }],
});

export async function startAgreement(requesterId: string, matchId: string) {
  const match = await prisma.routeMatch.findUnique({
    where: { id: matchId },
    include: { request: true, itinerary: true, agreement: true },
  });
  if (!match || match.request.requesterId !== requesterId) {
    throw new ApiProblem(404, "NOT_FOUND", "Match not found.");
  }
  if (match.agreement) {
    if (match.agreement.status === "CANCELLED") {
      throw new ApiProblem(409, "CONFLICT", "This agreement has already been cancelled.");
    }
    return match.agreement;
  }
  if (match.status !== "INTERESTED") {
    throw new ApiProblem(409, "CONFLICT", "The traveler must express interest before an agreement can start.");
  }
  if (match.request.status !== "OPEN" && match.request.status !== "MATCHED") {
    throw new ApiProblem(409, "CONFLICT", "This item request is no longer available.");
  }
  if (match.itinerary.status !== "PLANNED" && match.itinerary.status !== "ACTIVE") {
    throw new ApiProblem(409, "CONFLICT", "This itinerary is no longer available.");
  }

  return prisma.$transaction(async (tx) => {
    const transitioned = await tx.routeMatch.updateMany({
      where: { id: matchId, status: "INTERESTED" },
      data: { status: "AGREEMENT_STARTED" },
    });
    if (transitioned.count !== 1) {
      throw new ApiProblem(409, "CONFLICT", "This match changed before the agreement could start.");
    }

    const agreement = await tx.agreement.create({
      data: {
        matchId,
        requesterId,
        travelerId: match.itinerary.travelerId,
        status: "DRAFT",
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: requesterId,
        entityType: "Agreement",
        entityId: agreement.id,
        action: "agreement.started",
        metadata: { matchId },
      },
    });
    return agreement;
  });
}

export async function listAgreements(userId: string) {
  return prisma.agreement.findMany({
    where: participantWhere(userId),
    include: {
      match: {
        include: {
          request: { select: { id: true, title: true, description: true, itemCostMinor: true, currency: true } },
          itinerary: { select: { id: true, originName: true, destinationName: true, arrivalBy: true } },
        },
      },
      termsRevisions: { orderBy: { revision: "desc" }, take: 1 },
      payments: {
        select: { id: true, amountMinor: true, currency: true, status: true, authorizedAt: true, capturedAt: true, releasedAt: true },
        orderBy: { createdAt: "desc" },
      },
      deliveryConfirmation: { select: { id: true, requesterId: true, confirmedAt: true, note: true } },
      dispute: { select: { id: true, status: true, reason: true, resolutionNote: true, createdAt: true, resolvedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getAgreement(userId: string, agreementId: string) {
  const agreement = await prisma.agreement.findFirst({
    where: { id: agreementId, ...participantWhere(userId) },
    include: {
      requester: { select: { id: true, displayName: true, imageUrl: true } },
      traveler: { select: { id: true, displayName: true, imageUrl: true } },
      match: {
        include: {
          request: { select: { id: true, title: true, description: true, itemCostMinor: true, currency: true } },
          itinerary: { select: { id: true, originName: true, destinationName: true, arrivalBy: true } },
        },
      },
      termsRevisions: { orderBy: { revision: "desc" } },
      dispute: {
        select: {
          id: true,
          status: true,
          reason: true,
          resolutionNote: true,
          createdAt: true,
          resolvedAt: true,
          openedBy: { select: { id: true, displayName: true } },
        },
      },
    },
  });
  if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
  return agreement;
}

export async function proposeTerms(
  travelerId: string,
  agreementId: string,
  input: ProposedTerms,
) {
  const agreement = await prisma.agreement.findFirst({
    where: { id: agreementId, travelerId },
    include: { match: { include: { request: true } }, termsRevisions: { select: { revision: true } } },
  });
  if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
  if (!["DRAFT", "AWAITING_ACCEPTANCE", "ACCEPTED"].includes(agreement.status)) {
    throw new ApiProblem(409, "CONFLICT", "Terms can no longer be changed in this agreement state.");
  }

  const request = agreement.match.request;
  const totalMinor = request.itemCostMinor + input.deliveryFeeMinor;
  if (!Number.isSafeInteger(totalMinor) || totalMinor > 2_147_483_647) {
    throw new ApiProblem(422, "VALIDATION_ERROR", "The item cost and delivery fee exceed the supported total.");
  }

  const revision = Math.max(0, ...agreement.termsRevisions.map(({ revision: value }) => value)) + 1;
  const handoffDetails = input.handoffDetails
    ? ({
      notes: input.handoffDetails.notes,
      suggestedMeetup: input.handoffDetails.suggestedMeetup ?? null,
    } satisfies Prisma.InputJsonObject)
    : undefined;

  return prisma.$transaction(async (tx) => {
    await tx.termsRevision.updateMany({
      where: { agreementId, status: { in: ["PROPOSED", "ACCEPTED"] } },
      data: { status: "SUPERSEDED" },
    });
    const terms = await tx.termsRevision.create({
      data: {
        agreementId,
        revision,
        proposedById: travelerId,
        itemDescription: request.description,
        itemCostMinor: request.itemCostMinor,
        deliveryFeeMinor: input.deliveryFeeMinor,
        totalMinor,
        currency: request.currency,
        ...(handoffDetails ? { handoffDetails } : {}),
        travelerAcceptedAt: new Date(),
      },
    });
    await tx.agreement.update({
      where: { id: agreementId },
      data: { status: "AWAITING_ACCEPTANCE" },
    });
    await tx.auditEvent.create({
      data: {
        actorId: travelerId,
        entityType: "Agreement",
        entityId: agreementId,
        action: "agreement.terms_proposed",
        metadata: { revision, deliveryFeeMinor: input.deliveryFeeMinor, totalMinor },
      },
    });
    return terms;
  });
}

export async function acceptTerms(requesterId: string, agreementId: string, revisionId: string) {
  return prisma.$transaction(async (tx) => {
    const terms = await tx.termsRevision.findFirst({
      where: { id: revisionId, agreementId },
      include: { agreement: true },
    });
    if (!terms || terms.agreement.requesterId !== requesterId) {
      throw new ApiProblem(404, "NOT_FOUND", "Agreement terms not found.");
    }
    if (terms.status === "ACCEPTED" && terms.requesterAcceptedAt) return terms;
    if (terms.status !== "PROPOSED" || !terms.travelerAcceptedAt) {
      throw new ApiProblem(409, "CONFLICT", "These terms are no longer available to accept.");
    }
    if (!["AWAITING_ACCEPTANCE", "ACCEPTED"].includes(terms.agreement.status)) {
      throw new ApiProblem(409, "CONFLICT", "This agreement cannot accept terms in its current state.");
    }

    const acceptedAt = new Date();
    const update = await tx.termsRevision.updateMany({
      where: { id: revisionId, status: "PROPOSED", requesterAcceptedAt: null },
      data: { status: "ACCEPTED", requesterAcceptedAt: acceptedAt },
    });
    if (update.count !== 1) {
      throw new ApiProblem(409, "CONFLICT", "These terms changed before your acceptance was saved.");
    }
    await tx.agreement.update({ where: { id: agreementId }, data: { status: "ACCEPTED" } });
    await tx.auditEvent.create({
      data: {
        actorId: requesterId,
        entityType: "Agreement",
        entityId: agreementId,
        action: "agreement.terms_accepted",
        metadata: { revision: terms.revision, termsRevisionId: revisionId },
      },
    });
    return tx.termsRevision.findUniqueOrThrow({ where: { id: revisionId } });
  });
}

export async function cancelAgreement(userId: string, agreementId: string) {
  return prisma.$transaction(async (tx) => {
    const agreement = await tx.agreement.findFirst({
      where: { id: agreementId, ...participantWhere(userId) },
    });
    if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
    if (!["DRAFT", "AWAITING_ACCEPTANCE", "ACCEPTED"].includes(agreement.status)) {
      throw new ApiProblem(409, "CONFLICT", "This agreement cannot be cancelled in its current state.");
    }

    await tx.termsRevision.updateMany({
      where: { agreementId, status: { in: ["PROPOSED", "ACCEPTED"] } },
      data: { status: "SUPERSEDED" },
    });
    const cancelled = await tx.agreement.update({
      where: { id: agreementId },
      data: { status: "CANCELLED" },
    });
    await tx.auditEvent.create({
      data: {
        actorId: userId,
        entityType: "Agreement",
        entityId: agreementId,
        action: "agreement.cancelled",
      },
    });
    return cancelled;
  });
}
