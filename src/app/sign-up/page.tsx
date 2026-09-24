import { AuthLayout } from "@/components/auth-layout";
import { SignUpForm } from "@/app/sign-up/sign-up-form";

export default function SignUpPage() {
    return (
        <AuthLayout
            mode="sign-up"
            title="Come a little closer."
            description="Create your account and make room for the right things to find their way."
        >
            <SignUpForm />
        </AuthLayout>
    );
}
