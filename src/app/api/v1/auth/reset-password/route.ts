import { resetPassword } from "@/lib/domain/account-recovery";
import { resetPasswordSchema } from "@/lib/domain/auth-schemas";
import { apiError, apiSuccess, getRequestId } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await parseJsonBody(request, resetPasswordSchema, requestId);
  if (!parsed.success) return parsed.response;

  let reset: boolean;
  try {
    reset = await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    logger.error("auth.password_reset.failed", {
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return apiError({ code: "INTERNAL_ERROR", message: "We could not update the password right now." }, requestId, 500);
  }
  if (!reset) {
    return apiError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired. Request another link to continue." }, requestId, 400);
  }
  return apiSuccess({ passwordReset: true }, requestId);
}
