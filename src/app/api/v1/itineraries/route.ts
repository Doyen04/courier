import { createItinerary, listItineraries } from "@/lib/domain/itineraries";
import { createItinerarySchema, itineraryListQuerySchema } from "@/lib/domain/schemas";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { parseQuery } from "@/lib/http/parse-query";

export function GET(request: Request) {
    return authenticatedRoute(request, async (user, requestId) => {
        const query = parseQuery(request.url, itineraryListQuerySchema);
        const result = await listItineraries(user.id, query);
        return apiSuccess(result, requestId);
    });
}

export function POST(request: Request) {
    return authenticatedRoute(request, async (user, requestId) => {
        const parsed = await parseJsonBody(request, createItinerarySchema, requestId);
        if (!parsed.success) return parsed.response;

        const itinerary = await createItinerary(user.id, parsed.data);
        return apiSuccess(itinerary, requestId, { status: 201 });
    });
}
