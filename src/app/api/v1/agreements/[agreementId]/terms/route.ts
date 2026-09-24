import { proposeTerms } from "@/lib/domain/agreements";
import { proposeTermsSchema } from "@/lib/domain/agreement-schemas";
import { uuidSchema } from "@/lib/domain/schemas";
import { ApiProblem } from "@/lib/http/api-problem";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";

type Context = { params: Promise<{ agreementId: string }> };

export function POST(request: Request, context: Context) {
  return authenticatedRoute(request, async (user, requestId) => {
    const { agreementId } = await context.params;
    const id = uuidSchema.safeParse(agreementId);
    if (!id.success) throw new ApiProblem(404, "NOT_FOUND", "Agreement not found.");
    const parsed = await parseJsonBody(request, proposeTermsSchema, requestId);
    if (!parsed.success) return parsed.response;

    const terms = await proposeTerms(user.id, id.data, parsed.data);
    return apiSuccess(terms, requestId, { status: 201 });
  });
}
