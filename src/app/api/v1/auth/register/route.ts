import { registerAccountSchema } from "@/lib/domain/auth-schemas";
import { registerWithVerification } from "@/lib/domain/account-recovery";
import { apiError, apiSuccess, getRequestId } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { errorFields, logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await parseJsonBody(request, registerAccountSchema, requestId);
  if (!parsed.success) return parsed.response;

  try {
    await registerWithVerification(parsed.data);
    return apiSuccess({ registered: true }, requestId, { status: 201 });
  } catch (error) {
    logger.error("auth.registration.failed", {
      requestId,
      ...errorFields(error),
    });
    return apiError(
      { code: "INTERNAL_ERROR", message: "The account could not be created right now." },
      requestId,
      500,
    );
  }
}
