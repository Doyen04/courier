import { apiError } from "@/lib/http/api-response";
import { getAuthAdapter } from "@/lib/auth/adapter";

export async function requireUser(request: Request, requestId: string) {
    const adapter = getAuthAdapter();

    if (!adapter) {
        return {
            success: false as const,
            response: apiError(
                {
                    code: "SERVICE_UNAVAILABLE",
                    message: "Authentication is not configured yet.",
                },
                requestId,
                503,
            ),
        };
    }

    const user = await adapter.getUser(request);
    if (!user) {
        return {
            success: false as const,
            response: apiError(
                { code: "UNAUTHORIZED", message: "Sign in to continue." },
                requestId,
                401,
            ),
        };
    }

    return { success: true as const, user };
}
