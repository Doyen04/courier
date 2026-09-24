import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess, getRequestId } from "@/lib/http/api-response";
import { logger } from "@/lib/logging/logger";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({ service: "courier-api", status: "ready", database: "connected" }, requestId);
  } catch (error) {
    logger.error("readiness.database.failed", {
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return apiError(
      { code: "SERVICE_UNAVAILABLE", message: "The service is not ready." },
      requestId,
      503,
    );
  }
}
