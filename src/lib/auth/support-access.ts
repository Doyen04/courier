import { getEnv } from "@/lib/env";

const supportIds = () => new Set(
    (getEnv().COURIER_SUPPORT_USER_IDS ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
);

export function isSupportUser(userId: string) {
    return supportIds().has(userId.toLowerCase());
}
