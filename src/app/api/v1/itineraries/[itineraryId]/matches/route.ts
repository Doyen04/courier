import { refreshMatchesForItinerary } from "@/lib/domain/matching";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type RouteContext = { params: Promise<{ itineraryId: string }> };

export function GET(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { itineraryId } = await context.params;
    const parsedId = uuidSchema.safeParse(itineraryId);
    if (!parsedId.success) throw new ApiProblem(404, "NOT_FOUND", "Itinerary not found.");

    const matches = await refreshMatchesForItinerary(parsedId.data, user.id);
    return apiSuccess(
      { matches, matchingStatus: matches.length ? "MATCHES_FOUND" : "NO_MATCHES" },
      requestId,
    );
  });
}
