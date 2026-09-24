import {
  cancelItemRequest,
  getItemRequest,
  updateItemRequest,
} from "@/lib/domain/item-requests";
import { updateItemRequestSchema, uuidSchema } from "@/lib/domain/schemas";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";
import { ApiProblem } from "@/lib/http/api-problem";

type RouteContext = { params: Promise<{ requestId: string }> };

async function getRequestId(params: RouteContext["params"]) {
  const { requestId } = await params;
  const parsed = uuidSchema.safeParse(requestId);
  if (!parsed.success) throw new ApiProblem(404, "NOT_FOUND", "Request not found.");
  return parsed.data;
}

export function GET(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const id = await getRequestId(context.params);
    const itemRequest = await getItemRequest(user.id, id);
    return apiSuccess(itemRequest, requestId);
  });
}

export function PATCH(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const id = await getRequestId(context.params);
    const parsed = await parseJsonBody(request, updateItemRequestSchema, requestId);
    if (!parsed.success) return parsed.response;

    const itemRequest = await updateItemRequest(user.id, id, parsed.data);
    return apiSuccess(itemRequest, requestId);
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const id = await getRequestId(context.params);
    const itemRequest = await cancelItemRequest(user.id, id);
    return apiSuccess(itemRequest, requestId);
  });
}
