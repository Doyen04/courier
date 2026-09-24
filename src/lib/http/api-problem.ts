import type { ApiErrorCode } from "@/lib/http/api-response";

export class ApiProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiProblem";
  }
}
