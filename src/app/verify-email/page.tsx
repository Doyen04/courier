import type { Metadata } from "next";
import { AuthActionForm } from "@/components/auth-action-form";
import { AuthLayout } from "@/components/auth-layout";

export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <AuthLayout mode="account" title="Confirm your address." description="A verified address keeps your Courier account and important trip updates connected to you.">
      <AuthActionForm mode="verify" token={token} />
    </AuthLayout>
  );
}
