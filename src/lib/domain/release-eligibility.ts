import { prisma } from "@/lib/db/prisma";
import { ApiProblem } from "@/lib/http/api-problem";

export type ReleaseEligibility = {
  eligible: boolean;
  reason: "READY" | "AGREEMENT_NOT_PENDING" | "DELIVERY_NOT_CONFIRMED" | "DISPUTE_OPEN" | "FUNDED_TERMS_MISSING" | "PAYMENT_NOT_PENDING" | "PAYMENT_AMOUNT_MISMATCH";
};

/** Read-only gate for a future provider adapter. It never moves money. */
export async function checkReleaseEligibility(agreementId: string): Promise<ReleaseEligibility> {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: {
      status: true,
      termsLockedAt: true,
      fundedTermsSnapshot: true,
      deliveryConfirmation: { select: { id: true } },
      dispute: { select: { id: true } },
      payments: { select: { status: true, amountMinor: true, currency: true } },
    },
  });
  if (!agreement) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
  if (agreement.dispute) return { eligible: false, reason: "DISPUTE_OPEN" };
  if (!agreement.deliveryConfirmation) return { eligible: false, reason: "DELIVERY_NOT_CONFIRMED" };
  if (agreement.status !== "RELEASE_PENDING") return { eligible: false, reason: "AGREEMENT_NOT_PENDING" };
  if (agreement.termsLockedAt === null || !agreement.fundedTermsSnapshot || typeof agreement.fundedTermsSnapshot !== "object" || Array.isArray(agreement.fundedTermsSnapshot)) {
    return { eligible: false, reason: "FUNDED_TERMS_MISSING" };
  }
  const snapshot = agreement.fundedTermsSnapshot as { totalMinor?: unknown; currency?: unknown };
  if (typeof snapshot.totalMinor !== "number" || typeof snapshot.currency !== "string") {
    return { eligible: false, reason: "FUNDED_TERMS_MISSING" };
  }
  const pendingPayments = agreement.payments.filter(({ status }) => status === "RELEASE_PENDING");
  if (pendingPayments.length !== 1) {
    return { eligible: false, reason: "PAYMENT_NOT_PENDING" };
  }
  if (pendingPayments[0].amountMinor !== snapshot.totalMinor || pendingPayments[0].currency !== snapshot.currency) {
    return { eligible: false, reason: "PAYMENT_AMOUNT_MISMATCH" };
  }
  return { eligible: true, reason: "READY" };
}
