import { AuthActionForm } from "@/components/auth-action-form";
import { AuthLayout } from "@/components/auth-layout";

export default function ResendVerificationPage() {
    return (
        <AuthLayout mode="account" title="Let’s find that note." description="Enter your account email and we’ll send a fresh verification link if one is needed.">
            <AuthActionForm mode="resend-verification" />
        </AuthLayout>
    );
}
