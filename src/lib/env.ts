import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
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
  const { DATABASE_URL } = getEnv();

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required to use the database.");
  }

  return DATABASE_URL;
}
