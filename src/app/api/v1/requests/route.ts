import { createItemRequest, listItemRequests } from "@/lib/domain/item-requests";
import { createItemRequestSchema, requestListQuerySchema } from "@/lib/domain/schemas";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { parseQuery } from "@/lib/http/parse-query";

export function GET(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    const query = parseQuery(request.url, requestListQuerySchema);
    const result = await listItemRequests(user.id, query);
    return apiSuccess(result, requestId);
  });
}

export function POST(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    const parsed = await parseJsonBody(request, createItemRequestSchema, requestId);
    if (!parsed.success) return parsed.response;

    const itemRequest = await createItemRequest(user.id, parsed.data);
    return apiSuccess(itemRequest, requestId, { status: 201 });
  });
}
