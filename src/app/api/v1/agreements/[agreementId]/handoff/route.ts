import { startHandoff } from "@/lib/domain/delivery";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type RouteContext = { params: Promise<{ agreementId: string }> };

export function POST(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { agreementId } = await context.params;
    const parsedId = uuidSchema.safeParse(agreementId);
    if (!parsedId.success) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");

    const agreement = await startHandoff(user.id, parsedId.data, requestId);
    return apiSuccess(agreement, requestId);
  });
}
