import { AuthLayout } from "@/components/auth-layout";
import { SignInForm } from "@/app/sign-in/sign-in-form";

export default function SignInPage() {
    return (
        <AuthLayout
            mode="sign-in"

            title="Welcome back."
            description="Sign in to pick up where your next good connection begins."
        >
            <SignInForm />
        </AuthLayout>
    );
}
