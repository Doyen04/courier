import { prisma } from "@/lib/db/prisma";

export async function getActiveSessionUser(userId: string, sessionVersion: number) {
    const user = await prisma.user.findFirst({
        where: { id: userId, disabledAt: null, emailVerifiedAt: { not: null } },
        select: { id: true, email: true, displayName: true, sessionVersion: true },
    });

    return user && user.sessionVersion === sessionVersion ? user : null;
}
