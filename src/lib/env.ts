import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(32).optional(),
    COURIER_SUPPORT_USER_IDS: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().min(3).max(254).refine((value) => {
        const address = value.match(/^.*<([^<>]+)>$/)?.[1] ?? value;
        return z.email().safeParse(address).success;
    }, "EMAIL_FROM must contain a valid email address.").optional(),
}).superRefine((value, context) => {
    if (value.NODE_ENV === "production" && !value.DATABASE_URL) {
        context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "DATABASE_URL is required in production." });
    }
    if (value.NODE_ENV === "production" && !value.AUTH_SECRET) {
        context.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "AUTH_SECRET is required in production." });
    }
    const smtpConfigured = Boolean(value.SMTP_HOST || value.SMTP_PORT || value.SMTP_USER || value.SMTP_PASSWORD || value.EMAIL_FROM);
    if (smtpConfigured || value.NODE_ENV === "production") {
        for (const key of ["SMTP_HOST", "SMTP_PORT", "EMAIL_FROM"] as const) {
            if (!value[key]) {
                context.addIssue({ code: "custom", path: [key], message: `${key} is required when email delivery is enabled.` });
            }
        }
        if (Boolean(value.SMTP_USER) !== Boolean(value.SMTP_PASSWORD)) {
            context.addIssue({ code: "custom", path: ["SMTP_USER"], message: "SMTP_USER and SMTP_PASSWORD must be configured together." });
        }
        const appUrl = z.url().safeParse(value.NEXT_PUBLIC_APP_URL);
        if (value.NODE_ENV === "production" && appUrl.success && new URL(appUrl.data).protocol !== "https:") {
            context.addIssue({ code: "custom", path: ["NEXT_PUBLIC_APP_URL"], message: "Production app URL must use HTTPS." });
        }
    }
    const supportIds = (value.COURIER_SUPPORT_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    for (const id of supportIds) {
        if (!z.uuid().safeParse(id).success) {
            context.addIssue({ code: "custom", path: ["COURIER_SUPPORT_USER_IDS"], message: "Support user IDs must be UUIDs separated by commas." });
            break;
        }
    }
});

export type AppEnv = z.infer<typeof envSchema>;

let parsedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
    if (!parsedEnv) {
        parsedEnv = envSchema.parse(process.env);
    }

    return parsedEnv;
}

export function getDatabaseUrl(): string {
    return z.string().url().parse(process.env.DATABASE_URL);
}
