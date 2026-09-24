import { acceptTerms } from "@/lib/domain/agreements";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

type Context = { params: Promise<{ agreementId: string; revisionId: string }> };

export function POST(request: Request, context: Context) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { agreementId, revisionId } = await context.params;
    const agreement = uuidSchema.safeParse(agreementId);
    const revision = uuidSchema.safeParse(revisionId);
    if (!agreement.success || !revision.success) {
      throw new ApiProblem(404, "NOT_FOUND", "Agreement terms not found.");
    }

    const terms = await acceptTerms(user.id, agreement.data, revision.data);
    return apiSuccess(terms, requestId);
  });
}
