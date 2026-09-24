import { z } from "zod";
import { apiError } from "@/lib/http/api-response";

type ParsedBody<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  requestId: string,
): Promise<ParsedBody<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: apiError(
        { code: "BAD_REQUEST", message: "Request body must be valid JSON." },
        requestId,
        400,
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: apiError(
        {
          code: "VALIDATION_ERROR",
          message: "Some fields need attention.",
          details: parsed.error.issues.map(({ path, message, code }) => ({
            path,
            message,
            code,
          })),
        },
        requestId,
        422,
      ),
    };
  }

  return { success: true, data: parsed.data };
}
