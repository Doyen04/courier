import { refreshMatchesForRequest } from "@/lib/domain/matching";
import { getItemRequest } from "@/lib/domain/item-requests";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type RouteContext = { params: Promise<{ requestId: string }> };

export function GET(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { requestId: itemRequestId } = await context.params;
    const parsedId = uuidSchema.safeParse(itemRequestId);
    if (!parsedId.success) throw new ApiProblem(404, "NOT_FOUND", "Request not found.");

    await getItemRequest(user.id, parsedId.data);
    const matches = await refreshMatchesForRequest(parsedId.data);
    const itemRequest = await getItemRequest(user.id, parsedId.data);

    return apiSuccess(
      { matches, matchingStatus: matches.length ? "MATCHES_FOUND" : "NO_MATCHES", requestStatus: itemRequest.status },
      requestId,
    );
  });
}
