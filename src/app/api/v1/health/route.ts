import { apiSuccess, getRequestId } from "@/lib/http/api-response";

export function GET(request: Request) {
  const requestId = getRequestId(request);

  return apiSuccess(
    { service: "courier-api", status: "ok", version: "v1" },
    requestId,
  );
}
