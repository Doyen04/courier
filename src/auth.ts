import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";

const credentialsSchema = z.object({
    email: z.email().transform((value) => value.trim().toLowerCase()),
    password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Email and password",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;
                if (await isLoginBlocked(email)) {
                    await verifyPassword(null, password);
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        imageUrl: true,
                        passwordHash: true,
                        disabledAt: true,
                        emailVerifiedAt: true,
                        sessionVersion: true,
                    },
                });
                const passwordMatches = await verifyPassword(user?.passwordHash ?? null, password);

                if (!user || !passwordMatches || user.disabledAt || !user.emailVerifiedAt) {
                    await recordLoginFailure(email);
                    return null;
                }

                await clearLoginFailures(email);
                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                    image: user.imageUrl,
                    sessionVersion: user.sessionVersion,
                };
            },
        }),
    ],
    session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
    pages: { signIn: "/sign-in" },
    callbacks: {
        jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id;
                token.sessionVersion = user.sessionVersion;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.sessionVersion = typeof token.sessionVersion === "number" ? token.sessionVersion : -1;
            }
            return session;
        },
    },
});
