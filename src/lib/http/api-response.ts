export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export function getRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id");

  if (incoming && /^[A-Za-z0-9._:-]{1,100}$/.test(incoming)) {
    return incoming;
  }

  return crypto.randomUUID();
}

export function apiSuccess<T>(
  data: T,
  requestId: string,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);
  headers.set("cache-control", headers.get("cache-control") ?? "no-store");

  return Response.json(
    { data, meta: { requestId } },
    { ...init, headers },
  );
}

export function apiError(
  error: ApiError,
  requestId: string,
  status: number,
): Response {
  const headers = new Headers({ "x-request-id": requestId, "cache-control": "no-store" });
  return Response.json(
    { error, meta: { requestId } },
    { status, headers },
  );
}
