import { z } from "zod";

export const createAgreementSchema = z.object({
  matchId: z.uuid(),
}).strict();

export const proposeTermsSchema = z.object({
  deliveryFeeMinor: z.number().int().min(0).max(2_000_000_000),
  handoffDetails: z.object({
    notes: z.string().trim().min(1).max(1000),
    suggestedMeetup: z.string().trim().min(1).max(300).optional(),
  }).strict().optional(),
}).strict();

export const agreementIdSchema = z.uuid();
