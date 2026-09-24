import { deliveryConfirmationSchema } from "@/lib/domain/delivery-schemas";
import { confirmDelivery } from "@/lib/domain/delivery";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";

type RouteContext = { params: Promise<{ agreementId: string }> };

export function POST(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { agreementId } = await context.params;
    const parsedId = uuidSchema.safeParse(agreementId);
    if (!parsedId.success) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
    const parsed = await parseJsonBody(request, deliveryConfirmationSchema, requestId);
    if (!parsed.success) return parsed.response;

    const result = await confirmDelivery(user.id, parsedId.data, parsed.data, requestId);
    return apiSuccess(result, requestId);
  });
}
