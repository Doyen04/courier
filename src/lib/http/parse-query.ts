import { z } from "zod";
import { ApiProblem } from "@/lib/http/api-problem";

export function parseQuery<T>(url: string, schema: z.ZodType<T>): T {
    const searchParams = new URL(url).searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const parsed = schema.safeParse(query);

    if (!parsed.success) {
        throw new ApiProblem(422, "VALIDATION_ERROR", "The query parameters are invalid.");
    }

    return parsed.data;
}
