import { sendVerificationForAddress } from "@/lib/domain/account-recovery";
import { emailAddressSchema } from "@/lib/domain/auth-schemas";
import { apiSuccess, getRequestId } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { errorFields, logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await parseJsonBody(request, emailAddressSchema, requestId);
  if (!parsed.success) return parsed.response;

  try {
    await sendVerificationForAddress(parsed.data.email);
  } catch (error) {
    logger.error("auth.verification_resend.failed", {
      requestId,
      ...errorFields(error),
    });
    // A uniform response avoids exposing whether the address has an account.
  }
  return apiSuccess({ accepted: true }, requestId);
}
