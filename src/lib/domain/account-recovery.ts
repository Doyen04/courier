import { createHash, randomBytes } from "node:crypto";
import { AuthTokenPurpose, Prisma } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { clearLoginFailures } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logging/logger";
import {
    assertEmailDeliveryConfigured,
    sendPasswordChangedEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
} from "@/lib/email/mailer";

const TOKEN_COOLDOWN_MS = 60_000;
const VERIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const RESET_LIFETIME_MS = 30 * 60 * 1000;

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

async function issueToken(userId: string, purpose: AuthTokenPurpose) {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const lifetime = purpose === AuthTokenPurpose.EMAIL_VERIFICATION
        ? VERIFICATION_LIFETIME_MS
        : RESET_LIFETIME_MS;

    const issued = await prisma.$transaction(async (tx) => {
        const current = await tx.authToken.findUnique({
            where: { userId_purpose: { userId, purpose } },
            select: { createdAt: true },
        });
        if (current && now.getTime() - current.createdAt.getTime() < TOKEN_COOLDOWN_MS) {
            return false;
        }

        await tx.authToken.upsert({
            where: { userId_purpose: { userId, purpose } },
            create: { userId, purpose, tokenHash, expiresAt: new Date(now.getTime() + lifetime) },
            update: { tokenHash, expiresAt: new Date(now.getTime() + lifetime), consumedAt: null, createdAt: now },
        });
        return true;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return issued ? rawToken : null;
}

export async function registerWithVerification(input: {
    email: string;
    displayName: string;
    password: string;
}) {
    assertEmailDeliveryConfigured();
    const passwordHash = await hashPassword(input.password);
    let user: { id: string };
    try {
        user = await prisma.user.create({
            data: { email: input.email, displayName: input.displayName, passwordHash },
            select: { id: true },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return false;
        }
        throw error;
    }

    try {
        const token = await issueToken(user.id, AuthTokenPurpose.EMAIL_VERIFICATION);
        if (token) await sendVerificationEmail(input.email, token);
    } catch (error) {
        logger.error("auth.verification_email.failed", {
            errorName: error instanceof Error ? error.name : "UnknownError",
        });
    }
    return true;
}

export async function sendVerificationForAddress(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, emailVerifiedAt: true, disabledAt: true },
    });
    if (!user || user.emailVerifiedAt || user.disabledAt) return;
    const token = await issueToken(user.id, AuthTokenPurpose.EMAIL_VERIFICATION);
    if (token) await sendVerificationEmail(user.email, token);
}

export async function verifyEmailToken(token: string) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
        const record = await tx.authToken.findUnique({
            where: { tokenHash: hashToken(token) },
            include: { user: { select: { id: true, emailVerifiedAt: true, disabledAt: true } } },
        });
        if (
            !record || record.purpose !== AuthTokenPurpose.EMAIL_VERIFICATION ||
            record.consumedAt || record.expiresAt <= now || record.user.disabledAt
        ) return false;

        const consumed = await tx.authToken.updateMany({
            where: { id: record.id, consumedAt: null, expiresAt: { gt: now } },
            data: { consumedAt: now },
        });
        if (consumed.count !== 1) return false;
        await tx.user.update({
            where: { id: record.user.id },
            data: { emailVerifiedAt: record.user.emailVerifiedAt ?? now },
        });
        return true;
    });
}

export async function requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, emailVerifiedAt: true, disabledAt: true },
    });
    if (!user || !user.emailVerifiedAt || user.disabledAt) return;
    const token = await issueToken(user.id, AuthTokenPurpose.PASSWORD_RESET);
    if (token) await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(token: string, password: string) {
    const now = new Date();
    const passwordHash = await hashPassword(password);
    const email = await prisma.$transaction(async (tx) => {
        const record = await tx.authToken.findUnique({
            where: { tokenHash: hashToken(token) },
            include: { user: { select: { id: true, email: true, emailVerifiedAt: true, disabledAt: true } } },
        });
        if (
            !record || record.purpose !== AuthTokenPurpose.PASSWORD_RESET ||
            record.consumedAt || record.expiresAt <= now ||
            !record.user.emailVerifiedAt || record.user.disabledAt
        ) return null;

        const consumed = await tx.authToken.updateMany({
            where: { id: record.id, consumedAt: null, expiresAt: { gt: now } },
            data: { consumedAt: now },
        });
        if (consumed.count !== 1) return null;
        await tx.user.update({
            where: { id: record.user.id },
            data: { passwordHash, sessionVersion: { increment: 1 } },
        });
        return record.user.email;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (!email) return false;
    await clearLoginFailures(email);
    try {
        await sendPasswordChangedEmail(email);
    } catch {
        // Password changes remain successful even if the security notice is delayed.
    }
    return true;
}
