import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export type AuthenticatedUser = {
    id: string;
    name: string;
    email: string;
};

/** Provider boundary: the configured adapter must resolve a provider identity to an active local user. */
export interface AuthAdapter {
    getUser(request: Request): Promise<AuthenticatedUser | null>;
}

const authAdapter: AuthAdapter = {
    async getUser() {
        return getCurrentAuthenticatedUser();
    },
};

export async function getCurrentAuthenticatedUser() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    const activeUser = await prisma.user.findFirst({
        where: { id: userId, disabledAt: null, emailVerifiedAt: { not: null } },
        select: { id: true, email: true, displayName: true, sessionVersion: true },
    });
    return activeUser && activeUser.sessionVersion === session.user.sessionVersion
        ? { id: activeUser.id, name: activeUser.displayName, email: activeUser.email }
        : null;
}

export function getAuthAdapter() {
    if (!process.env.AUTH_SECRET) {
        return undefined;
    }
    return authAdapter;
}
