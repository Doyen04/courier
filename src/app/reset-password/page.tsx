import type { Metadata } from "next";
import { AuthActionForm } from "@/components/auth-action-form";
import { AuthLayout } from "@/components/auth-layout";

export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
    const params = await searchParams;
    const token = typeof params.token === "string" ? params.token : "";
    return (
        <AuthLayout mode="account" title="Choose a new password." description="Set a new password for your Courier account. This will sign out any other active sessions.">
            <AuthActionForm mode="reset-password" token={token} />
        </AuthLayout>
    );
}
