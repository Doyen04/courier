import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function hashEmail(email: string) {
    return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function isLoginBlocked(email: string) {
    const key = hashEmail(email);
    const now = new Date();
    const current = await prisma.authRateLimit.findUnique({ where: { emailHash: key } });

    if (!current) return false;
    if (current.blockedUntil && current.blockedUntil > now) return true;

    const cutoff = new Date(now.getTime() - WINDOW_MS);
    if (current.windowStartedAt <= cutoff) {
        await prisma.authRateLimit.updateMany({
            where: { emailHash: key, windowStartedAt: { lte: cutoff } },
            data: { attempts: 0, windowStartedAt: now, blockedUntil: null },
        });
    }
    return false;
}

export async function recordLoginFailure(email: string) {
    const key = hashEmail(email);
    const now = new Date();
    const cutoff = new Date(now.getTime() - WINDOW_MS);

    await prisma.authRateLimit.updateMany({
        where: { emailHash: key, windowStartedAt: { lte: cutoff } },
        data: { attempts: 0, windowStartedAt: now, blockedUntil: null },
    });

    const attempts = await prisma.authRateLimit.upsert({
        where: { emailHash: key },
        create: { emailHash: key, attempts: 1, windowStartedAt: now },
        update: { attempts: { increment: 1 } },
    });

    if (attempts.attempts >= MAX_FAILURES) {
        await prisma.authRateLimit.update({
            where: { emailHash: key },
            data: { blockedUntil: new Date(now.getTime() + WINDOW_MS) },
        });
    }
}

export async function clearLoginFailures(email: string) {
    await prisma.authRateLimit.updateMany({
        where: { emailHash: hashEmail(email) },
        data: { attempts: 0, blockedUntil: null, windowStartedAt: new Date() },
    });
}
