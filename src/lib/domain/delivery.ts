import { prisma } from "@/lib/db/prisma";
import { ApiProblem } from "@/lib/http/api-problem";
import type { deliveryConfirmationSchema, openDisputeSchema } from "@/lib/domain/delivery-schemas";
import type { z } from "zod";

type DeliveryInput = z.infer<typeof deliveryConfirmationSchema>;
type DisputeInput = z.infer<typeof openDisputeSchema>;

const participantWhere = (userId: string) => ({
  OR: [{ requesterId: userId }, { travelerId: userId }],
});

const payableStatuses = ["CAPTURED", "HELD"] as const;

export async function startHandoff(travelerId: string, agreementId: string, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const agreement = await tx.agreement.findFirst({
      where: { id: agreementId, travelerId },
      include: { payments: true, dispute: true, match: { select: { itineraryId: true, requestId: true } } },
    });
    if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
    if (agreement.status === "IN_HANDOFF") {
      return tx.agreement.findUniqueOrThrow({ where: { id: agreementId } });
    }
    if (agreement.status !== "FUNDED") {
      throw new ApiProblem(409, "CONFLICT", "Handoff can begin only after payment funding succeeds.");
    }
    if (agreement.dispute) {
      throw new ApiProblem(409, "CONFLICT", "This agreement is blocked by a dispute.");
    }
    if (agreement.termsLockedAt === null || agreement.fundedTermsSnapshot === null) {
      throw new ApiProblem(409, "CONFLICT", "The funded terms snapshot is missing.");
    }
    const fundedPayments = agreement.payments.filter((payment) => payableStatuses.includes(payment.status as typeof payableStatuses[number]));
    if (fundedPayments.length !== 1) {
      throw new ApiProblem(409, "CONFLICT", "A single confirmed funded payment is required before handoff.");
    }

    const changed = await tx.agreement.updateMany({
      where: { id: agreementId, travelerId, status: "FUNDED", dispute: null },
      data: { status: "IN_HANDOFF" },
    });
    if (changed.count !== 1) throw new ApiProblem(409, "CONFLICT", "This agreement changed before handoff began.");

    await tx.itinerary.updateMany({
      where: { id: agreement.match.itineraryId, status: "PLANNED" },
      data: { status: "ACTIVE" },
    });
    await tx.itemRequest.updateMany({
      where: { id: agreement.match.requestId, status: { in: ["OPEN", "MATCHED"] } },
      data: { status: "IN_PROGRESS" },
    });
    await tx.auditEvent.create({
      data: {
        actorId: travelerId,
        entityType: "Agreement",
        entityId: agreementId,
        action: "handoff.started",
        requestId,
      },
    });
    return tx.agreement.findUniqueOrThrow({ where: { id: agreementId } });
  });
}

export async function confirmDelivery(requesterId: string, agreementId: string, input: DeliveryInput, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const agreement = await tx.agreement.findFirst({
      where: { id: agreementId, requesterId },
      include: { payments: true, dispute: true, deliveryConfirmation: true },
    });
    if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
    if (agreement.deliveryConfirmation) {
      const safeAgreement = await tx.agreement.findUniqueOrThrow({ where: { id: agreementId } });
      return { agreement: safeAgreement, confirmation: agreement.deliveryConfirmation, releaseRequested: agreement.status === "RELEASE_PENDING" };
    }
    if (agreement.dispute || agreement.status === "DISPUTED") {
      throw new ApiProblem(409, "CONFLICT", "Delivery confirmation is paused while this dispute is reviewed.");
    }
    if (agreement.status !== "IN_HANDOFF") {
      throw new ApiProblem(409, "CONFLICT", "Confirm delivery after the traveler has started the handoff.");
    }

    const eligiblePayments = agreement.payments.filter((payment) => payableStatuses.includes(payment.status as typeof payableStatuses[number]));
    if (eligiblePayments.length !== 1) {
      throw new ApiProblem(409, "CONFLICT", "A single captured or held payment is required before delivery can be confirmed.");
    }
    const payment = eligiblePayments[0];
    const paymentChanged = await tx.paymentTransaction.updateMany({
      where: { id: payment.id, status: { in: [...payableStatuses] } },
      data: { status: "RELEASE_PENDING" },
    });
    if (paymentChanged.count !== 1) throw new ApiProblem(409, "CONFLICT", "Payment state changed before release could be requested.");

    const confirmation = await tx.deliveryConfirmation.create({
      data: {
        agreementId,
        requesterId,
        ...(input.note ? { note: input.note } : {}),
      },
    });
    const changed = await tx.agreement.updateMany({
      where: { id: agreementId, requesterId, status: "IN_HANDOFF", dispute: null },
      data: { status: "RELEASE_PENDING" },
    });
    if (changed.count !== 1) throw new ApiProblem(409, "CONFLICT", "This agreement changed before delivery was recorded.");

    await tx.auditEvent.create({
      data: {
        actorId: requesterId,
        entityType: "Agreement",
        entityId: agreementId,
        action: "delivery.confirmed_release_requested",
        metadata: { paymentTransactionId: payment.id },
        requestId,
      },
    });
    const updatedAgreement = await tx.agreement.findUniqueOrThrow({ where: { id: agreementId } });
    return { agreement: updatedAgreement, confirmation, releaseRequested: true };
  });
}

export async function openDispute(userId: string, agreementId: string, input: DisputeInput, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const agreement = await tx.agreement.findFirst({
      where: { id: agreementId, ...participantWhere(userId) },
      include: { dispute: true, payments: true },
    });
    if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
    if (agreement.dispute) {
      if (["OPEN", "UNDER_REVIEW"].includes(agreement.dispute.status)) return agreement.dispute;
      throw new ApiProblem(409, "CONFLICT", "This agreement already has a resolved dispute.");
    }
    if (!["FUNDED", "IN_HANDOFF", "DELIVERED", "RELEASE_PENDING"].includes(agreement.status)) {
      throw new ApiProblem(409, "CONFLICT", "A dispute can be opened only after funding and before completion.");
    }
    if (agreement.payments.some((payment) => payment.status === "RELEASED")) {
      throw new ApiProblem(409, "CONFLICT", "Funds have already been released; contact support for post-release help.");
    }
    const pendingPayments = agreement.payments.filter((payment) => ["CAPTURED", "HELD", "RELEASE_PENDING"].includes(payment.status));
    if (!pendingPayments.length) {
      throw new ApiProblem(409, "CONFLICT", "There is no active payment to protect with a dispute.");
    }

    const dispute = await tx.dispute.create({
      data: { agreementId, openedById: userId, reason: input.reason },
    });
    const changed = await tx.agreement.updateMany({
      where: { id: agreementId, ...participantWhere(userId), dispute: null, status: agreement.status },
      data: { status: "DISPUTED" },
    });
    if (changed.count !== 1) throw new ApiProblem(409, "CONFLICT", "This agreement changed before the dispute was saved.");

    await tx.auditEvent.create({
      data: {
        actorId: userId,
        entityType: "Agreement",
        entityId: agreementId,
        action: "dispute.opened",
        metadata: { disputeId: dispute.id },
        requestId,
      },
    });
    return dispute;
  });
}

export async function listSupportDisputes() {
  return prisma.dispute.findMany({
    include: {
      openedBy: { select: { id: true, displayName: true, email: true } },
      agreement: {
        select: {
          id: true,
          status: true,
          match: {
            select: {
              request: { select: { title: true, originName: true, destinationName: true, currency: true, itemCostMinor: true } },
              itinerary: { select: { departureAt: true, arrivalBy: true } },
            },
          },
          requester: { select: { id: true, displayName: true, email: true } },
          traveler: { select: { id: true, displayName: true, email: true } },
          payments: { select: { id: true, amountMinor: true, currency: true, status: true, createdAt: true } },
          deliveryConfirmation: { select: { confirmedAt: true, note: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 200,
  });
}

export async function markDisputeUnderReview(supportUserId: string, disputeId: string, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new ApiProblem(404, "NOT_FOUND", "Dispute not found.");
    if (dispute.status === "UNDER_REVIEW") return dispute;
    if (dispute.status !== "OPEN") throw new ApiProblem(409, "CONFLICT", "This dispute is no longer open for review.");

    const updated = await tx.dispute.updateMany({
      where: { id: disputeId, status: "OPEN" },
      data: { status: "UNDER_REVIEW" },
    });
    if (updated.count !== 1) throw new ApiProblem(409, "CONFLICT", "This dispute changed before it could be assigned for review.");
    await tx.auditEvent.create({
      data: {
        actorId: supportUserId,
        entityType: "Dispute",
        entityId: disputeId,
        action: "dispute.under_review",
        requestId,
      },
    });
    return tx.dispute.findUniqueOrThrow({ where: { id: disputeId } });
  });
}
