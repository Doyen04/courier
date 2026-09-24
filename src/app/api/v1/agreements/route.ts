import { createAgreementSchema } from "@/lib/domain/agreement-schemas";
import { listAgreements, startAgreement } from "@/lib/domain/agreements";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";
import { parseJsonBody } from "@/lib/http/parse-json";

export function GET(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    const agreements = await listAgreements(user.id);
    return apiSuccess(agreements, requestId);
  });
}

export function POST(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    const parsed = await parseJsonBody(request, createAgreementSchema, requestId);
    if (!parsed.success) return parsed.response;

    const agreement = await startAgreement(user.id, parsed.data.matchId);
    return apiSuccess(agreement, requestId, { status: 201 });
  });
}
