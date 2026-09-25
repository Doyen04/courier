"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ArrowIcon() {
    return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 transition-transform group-hover:translate-x-1" fill="none"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function SignInForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
            email: form.get("email"),
            password: form.get("password"),
            redirect: false,
        });

        if (!result || result.error) {
            setError("We couldn't sign you in. Check your email and password, or request a verification link if your email isn't verified yet.");
            setIsLoading(false);
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit} aria-busy={isLoading}>
            <label className="auth-label">
                Email address
                <input className="auth-input" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <div>
                <div className="flex items-center justify-between gap-3">
                    <label className="auth-label" htmlFor="password">Password</label>
                    <Link className="text-[11px] font-semibold text-courier-green underline decoration-courier-gold/60 underline-offset-4 transition hover:decoration-courier-green" href="/forgot-password">Forgot your password?</Link>
                </div>
                <input className="auth-input" id="password" type="password" name="password" autoComplete="current-password" required />
            </div>
            <div className="-mt-2 flex flex-wrap justify-end gap-x-4 gap-y-2 text-[11px]">
                <Link className="text-courier-muted underline decoration-courier-line underline-offset-4 transition hover:text-courier-green" href="/resend-verification">Need a verification link?</Link>
            </div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit group" type="submit" disabled={isLoading}>
                {isLoading ? "Signing you in…" : "Sign in"}
                {!isLoading && <ArrowIcon />}
            </button>
        </form>
    );
}
