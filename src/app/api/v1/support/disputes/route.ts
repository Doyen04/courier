import { isSupportUser } from "@/lib/auth/support-access";
import { listSupportDisputes } from "@/lib/domain/delivery";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

export function GET(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    if (!isSupportUser(user.id)) {
      throw new ApiProblem(403, "FORBIDDEN", "Support access is required.");
    }
    const disputes = await listSupportDisputes();
    return apiSuccess(disputes, requestId);
  });
}
