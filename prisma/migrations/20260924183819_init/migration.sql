-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'OPEN', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('CANDIDATE', 'INTERESTED', 'AGREEMENT_STARTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'AWAITING_ACCEPTANCE', 'ACCEPTED', 'FUNDED', 'IN_HANDOFF', 'DELIVERED', 'RELEASE_PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TermsRevisionStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'REQUIRES_ACTION', 'AUTHORIZED', 'CAPTURED', 'HELD', 'REFUND_PENDING', 'REFUNDED', 'RELEASE_PENDING', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_REQUESTER', 'RESOLVED_TRAVELER', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "imageUrl" TEXT,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRequest" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(4000) NOT NULL,
    "itemCostMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "originName" VARCHAR(180) NOT NULL,
    "originCountryCode" CHAR(2) NOT NULL,
    "originLatitude" DECIMAL(9,6),
    "originLongitude" DECIMAL(9,6),
    "destinationName" VARCHAR(180) NOT NULL,
    "destinationCountryCode" CHAR(2) NOT NULL,
    "destinationLatitude" DECIMAL(9,6),
    "destinationLongitude" DECIMAL(9,6),
    "neededBy" DATE,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" UUID NOT NULL,
    "travelerId" UUID NOT NULL,
    "originName" VARCHAR(180) NOT NULL,
    "originCountryCode" CHAR(2) NOT NULL,
    "originLatitude" DECIMAL(9,6),
    "originLongitude" DECIMAL(9,6),
    "destinationName" VARCHAR(180) NOT NULL,
    "destinationCountryCode" CHAR(2) NOT NULL,
    "destinationLatitude" DECIMAL(9,6),
    "destinationLongitude" DECIMAL(9,6),
    "routeStops" JSONB,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalBy" TIMESTAMP(3) NOT NULL,
    "status" "ItineraryStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteMatch" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "itineraryId" UUID NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'CANDIDATE',
    "score" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "travelerId" UUID NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "fundedTermsSnapshot" JSONB,
    "termsLockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsRevision" (
    "id" UUID NOT NULL,
    "agreementId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "proposedById" UUID NOT NULL,
    "itemDescription" VARCHAR(4000) NOT NULL,
    "itemCostMinor" INTEGER NOT NULL,
    "deliveryFeeMinor" INTEGER NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "handoffDetails" JSONB,
    "status" "TermsRevisionStatus" NOT NULL DEFAULT 'PROPOSED',
    "requesterAcceptedAt" TIMESTAMP(3),
    "travelerAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "agreementId" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "providerPaymentId" TEXT,
    "idempotencyKey" VARCHAR(180) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderEventReceipt" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "providerEventId" VARCHAR(220) NOT NULL,
    "paymentTransactionId" UUID,
    "eventType" VARCHAR(120) NOT NULL,
    "safeSummary" JSONB,
    "processedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderEventReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryConfirmation" (
    "id" UUID NOT NULL,
    "agreementId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(1000),

    CONSTRAINT "DeliveryConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" UUID NOT NULL,
    "agreementId" UUID NOT NULL,
    "openedById" UUID NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" VARCHAR(4000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "metadata" JSONB,
    "requestId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_subject_key" ON "AuthIdentity"("provider", "subject");

-- CreateIndex
CREATE INDEX "ItemRequest_requesterId_status_createdAt_idx" ON "ItemRequest"("requesterId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ItemRequest_originCountryCode_destinationCountryCode_needed_idx" ON "ItemRequest"("originCountryCode", "destinationCountryCode", "neededBy");

-- CreateIndex
CREATE INDEX "Itinerary_travelerId_status_departureAt_idx" ON "Itinerary"("travelerId", "status", "departureAt");

-- CreateIndex
CREATE INDEX "Itinerary_originCountryCode_destinationCountryCode_departur_idx" ON "Itinerary"("originCountryCode", "destinationCountryCode", "departureAt");

-- CreateIndex
CREATE INDEX "RouteMatch_itineraryId_status_idx" ON "RouteMatch"("itineraryId", "status");

-- CreateIndex
CREATE INDEX "RouteMatch_requestId_status_idx" ON "RouteMatch"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RouteMatch_requestId_itineraryId_key" ON "RouteMatch"("requestId", "itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_matchId_key" ON "Agreement"("matchId");

-- CreateIndex
CREATE INDEX "Agreement_requesterId_status_updatedAt_idx" ON "Agreement"("requesterId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Agreement_travelerId_status_updatedAt_idx" ON "Agreement"("travelerId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "TermsRevision_agreementId_status_idx" ON "TermsRevision"("agreementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TermsRevision_agreementId_revision_key" ON "TermsRevision"("agreementId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_providerPaymentId_key" ON "PaymentTransaction"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentTransaction_agreementId_status_idx" ON "PaymentTransaction"("agreementId", "status");

-- CreateIndex
CREATE INDEX "ProviderEventReceipt_processedAt_receivedAt_idx" ON "ProviderEventReceipt"("processedAt", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEventReceipt_provider_providerEventId_key" ON "ProviderEventReceipt"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryConfirmation_agreementId_key" ON "DeliveryConfirmation"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_agreementId_key" ON "Dispute"("agreementId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRequest" ADD CONSTRAINT "ItemRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteMatch" ADD CONSTRAINT "RouteMatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ItemRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteMatch" ADD CONSTRAINT "RouteMatch_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "RouteMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermsRevision" ADD CONSTRAINT "TermsRevision_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermsRevision" ADD CONSTRAINT "TermsRevision_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderEventReceipt" ADD CONSTRAINT "ProviderEventReceipt_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryConfirmation" ADD CONSTRAINT "DeliveryConfirmation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryConfirmation" ADD CONSTRAINT "DeliveryConfirmation_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
