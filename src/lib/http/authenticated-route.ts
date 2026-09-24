import { requireUser } from "@/lib/auth/require-user";
import { ApiProblem } from "@/lib/http/api-problem";
import { apiError, getRequestId } from "@/lib/http/api-response";
import { logger } from "@/lib/logging/logger";

export type RouteUser = { id: string };
type AuthenticatedHandler = (user: RouteUser, requestId: string) => Promise<Response>;

export async function authenticatedRoute(
    request: Request,
    handler: AuthenticatedHandler,
) {
    const requestId = getRequestId(request);

    try {
        const auth = await requireUser(request, requestId);
        if (!auth.success) return auth.response;

        return await handler(auth.user, requestId);
    } catch (error) {
        if (error instanceof ApiProblem) {
            return apiError(
                { code: error.code, message: error.message },
                requestId,
                error.status,
            );
        }

        logger.error("api.request.failed", {
            requestId,
            errorName: error instanceof Error ? error.name : "UnknownError",
        });
        return apiError(
            { code: "INTERNAL_ERROR", message: "Something went wrong." },
            requestId,
            500,
        );
    }
}
