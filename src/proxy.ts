import { auth } from "@/auth";
import { getActiveSessionUser } from "@/lib/auth/active-session";
import { isSupportUser } from "@/lib/auth/support-access";
import { NextResponse } from "next/server";

export default auth(async (request) => {
    const session = request.auth;
    const userId = session?.user?.id;
    const sessionVersion = session?.user?.sessionVersion;

    if (userId && typeof sessionVersion === "number") {
        const activeUser = await getActiveSessionUser(userId, sessionVersion);
        if (activeUser) {
            if (request.nextUrl.pathname.startsWith("/support/disputes") && !isSupportUser(userId)) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
            return NextResponse.next();
        }
    }

    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
});

export const config = {
    matcher: ["/dashboard", "/dashboard/:path*", "/support/disputes", "/support/disputes/:path*"],
};
