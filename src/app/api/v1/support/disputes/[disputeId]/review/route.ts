import { isSupportUser } from "@/lib/auth/support-access";
import { markDisputeUnderReview } from "@/lib/domain/delivery";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type RouteContext = { params: Promise<{ disputeId: string }> };

export function POST(request: Request, context: RouteContext) {
  return authenticatedRoute(request, async (user, requestId) => {
    if (!isSupportUser(user.id)) {
      throw new ApiProblem(403, "FORBIDDEN", "Support access is required.");
    }
    const { disputeId } = await context.params;
    const parsedId = uuidSchema.safeParse(disputeId);
    if (!parsedId.success) throw new ApiProblem(404, "NOT_FOUND", "Dispute not found.");

    const dispute = await markDisputeUnderReview(user.id, parsedId.data, requestId);
    return apiSuccess(dispute, requestId);
  });
}
