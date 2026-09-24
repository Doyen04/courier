import { cancelAgreement } from "@/lib/domain/agreements";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type Context = { params: Promise<{ agreementId: string }> };

export function POST(request: Request, context: Context) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { agreementId } = await context.params;
    const id = uuidSchema.safeParse(agreementId);
    if (!id.success) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");

    const agreement = await cancelAgreement(user.id, id.data);
    return apiSuccess(agreement, requestId);
  });
}
