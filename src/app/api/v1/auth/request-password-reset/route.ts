import { requestPasswordReset } from "@/lib/domain/account-recovery";
import { emailAddressSchema } from "@/lib/domain/auth-schemas";
import { apiSuccess, getRequestId } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { errorFields, logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
    const requestId = getRequestId(request);
    const parsed = await parseJsonBody(request, emailAddressSchema, requestId);
    if (!parsed.success) return parsed.response;

    try {
        await requestPasswordReset(parsed.data.email);
    } catch (error) {
        logger.error("auth.password_reset_request.failed", {
            requestId,
            ...errorFields(error),
        });
        // Keep account existence private when mail delivery is temporarily unavailable.
    }
    return apiSuccess({ accepted: true }, requestId);
}
