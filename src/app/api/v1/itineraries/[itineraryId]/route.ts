import {
  cancelItinerary,
  getItinerary,
  updateItinerary,
} from "@/lib/domain/itineraries";
import { updateItinerarySchema, uuidSchema } from "@/lib/domain/schemas";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { ApiProblem } from "@/lib/http/api-problem";

type RouteContext = { params: Promise<{ itineraryId: string }> };

async function getItineraryId(params: RouteContext["params"]) {
  const { itineraryId } = await params;
  const parsed = uuidSchema.safeParse(itineraryId);
  if (!parsed.success) throw new ApiProblem(404, "NOT_FOUND", "Itinerary not found.");
  return parsed.data;
}

export function GET(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const id = await getItineraryId(context.params);
    const itinerary = await getItinerary(user.id, id);
    return apiSuccess(itinerary, requestId);
  });
}

export function PATCH(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const id = await getItineraryId(context.params);
    const parsed = await parseJsonBody(request, updateItinerarySchema, requestId);
    if (!parsed.success) return parsed.response;

    const itinerary = await updateItinerary(user.id, id, parsed.data);
    return apiSuccess(itinerary, requestId);
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const id = await getItineraryId(context.params);
    const itinerary = await cancelItinerary(user.id, id);
    return apiSuccess(itinerary, requestId);
  });
}
