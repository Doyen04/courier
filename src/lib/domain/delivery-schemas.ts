import { z } from "zod";

export const deliveryConfirmationSchema = z.object({
  note: z.string().trim().max(1000).optional(),
}).strict();

export const openDisputeSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
}).strict();
