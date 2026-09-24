import { expressInterest } from "@/lib/domain/matching";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type RouteContext = { params: Promise<{ matchId: string }> };

export function POST(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { matchId } = await context.params;
    const parsedId = uuidSchema.safeParse(matchId);
    if (!parsedId.success) throw new ApiProblem(404, "NOT_FOUND", "Match not found.");

    const match = await expressInterest(parsedId.data, user.id);
    return apiSuccess(match, requestId);
  });
}
