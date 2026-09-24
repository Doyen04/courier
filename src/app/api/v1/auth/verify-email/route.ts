import { verifyEmailToken } from "@/lib/domain/account-recovery";
import { authTokenSchema } from "@/lib/domain/auth-schemas";
import { apiError, apiSuccess, getRequestId } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await parseJsonBody(request, authTokenSchema, requestId);
  if (!parsed.success) return parsed.response;

  let verified: boolean;
  try {
    verified = await verifyEmailToken(parsed.data.token);
  } catch (error) {
    logger.error("auth.email_verification.failed", {
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return apiError({ code: "INTERNAL_ERROR", message: "We could not verify that link right now." }, requestId, 500);
  }
  if (!verified) {
    return apiError({ code: "BAD_REQUEST", message: "This verification link is invalid or has expired. Request a new one to continue." }, requestId, 400);
  }
  return apiSuccess({ verified: true }, requestId);
}
