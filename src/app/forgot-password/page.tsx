import { AuthActionForm } from "@/components/auth-action-form";
import { AuthLayout } from "@/components/auth-layout";

export default function ForgotPasswordPage() {
    return (
        <AuthLayout mode="account" title="Find your way back." description="We’ll send a short-lived link to the address on your verified Courier account.">
            <AuthActionForm mode="request-password-reset" />
        </AuthLayout>
    );
}
