import {
  listJourneysMatchingMyRequests,
  refreshJourneysMatchingMyRequests,
} from "@/lib/domain/match-board";
import { authenticatedRoute } from "@/lib/http/authenticated-route";
import { apiSuccess } from "@/lib/http/api-response";

export function GET(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    const groups = await listJourneysMatchingMyRequests(user.id);
    return apiSuccess({ groups }, requestId);
  });
}

export function POST(request: Request) {
  return authenticatedRoute(request, async (user, requestId) => {
    const groups = await refreshJourneysMatchingMyRequests(user.id);
    return apiSuccess({ groups }, requestId);
  });
}
