"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

function ArrowIcon() {
    return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 transition-transform group-hover:translate-x-1" fill="none"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MailIcon() {
    return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-courier-green text-white"><svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none"><rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="m3.5 5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}

export function SignUpForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");
        const confirmation = String(form.get("confirmPassword") ?? "");
        if (password !== confirmation) {
            setError("Those passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/v1/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    displayName: form.get("displayName"),
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                setError("We could not create your account. Check your details and try again.");
                setIsLoading(false);
                return;
            }

            setSubmitted(true);
        } catch {
            setError("We could not reach Courier. Check your connection and try again.");
            setIsLoading(false);
        }
    }

    if (submitted) {
        return (
            <div className="auth-notice mt-7" role="status" aria-live="polite">
                <MailIcon />
                <div>
                    <p className="mb-1 font-semibold text-courier-ink">Check your inbox.</p>
                    <p className="mb-0 text-courier-muted">If that address can be registered, we sent a verification link. Open it before signing in.</p>
                    <Link className="mt-3 inline-flex items-center gap-2 font-semibold text-courier-green underline decoration-courier-gold/60 underline-offset-4" href="/resend-verification">Send a fresh verification link <ArrowIcon /></Link>
                </div>
            </div>
        );
    }

    return (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} aria-busy={isLoading}>
            <label className="auth-label">
                Your name
                <input className="auth-input" type="text" name="displayName" autoComplete="name" minLength={2} maxLength={80} required />
            </label>
            <label className="auth-label">
                Email address
                <input className="auth-input" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <label className="auth-label">
                Password
                <input className="auth-input" type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required />
                <span className="mt-2 block text-[11px] font-normal normal-case tracking-normal text-courier-muted">Use at least 12 characters.</span>
            </label>
            <label className="auth-label">
                Confirm password
                <input className="auth-input" type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit group" type="submit" disabled={isLoading}>
                {isLoading ? "Creating your account…" : "Create account"}
                {!isLoading && <ArrowIcon />}
            </button>
        </form>
    );
}
