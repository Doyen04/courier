"use client";

import { useState, type FormEvent } from "react";

type ActionMode = "verify" | "resend-verification" | "request-password-reset" | "reset-password";

const messages: Record<ActionMode, { success: string; error: string }> = {
    verify: {
        success: "Your email is verified. You can now sign in to Courier.",
        error: "This verification link is invalid or has expired. Request a fresh link to continue.",
    },
    "resend-verification": {
        success: "If the address belongs to an account that needs verification, we sent a link.",
        error: "We could not process that request right now. Please try again shortly.",
    },
    "request-password-reset": {
        success: "If a verified Courier account uses that address, we sent a password reset link.",
        error: "We could not process that request right now. Please try again shortly.",
    },
    "reset-password": {
        success: "Your password has been changed. Sign in with your new password.",
        error: "This reset link is invalid or has expired. Request a new one to continue.",
    },
};

function StatusIcon() {
    return (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-courier-green text-white">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
    );
}

function ArrowIcon() {
    return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 transition-transform group-hover:translate-x-1" fill="none"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function AuthActionForm({ mode, token = "" }: { mode: ActionMode; token?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [complete, setComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        let endpoint = "";
        let payload: Record<string, string>;

        if (mode === "verify") {
            endpoint = "/api/v1/auth/verify-email";
            payload = { token };
        } else if (mode === "resend-verification") {
            endpoint = "/api/v1/auth/resend-verification";
            payload = { email: String(form.get("email") ?? "") };
        } else if (mode === "request-password-reset") {
            endpoint = "/api/v1/auth/request-password-reset";
            payload = { email: String(form.get("email") ?? "") };
        } else {
            const password = String(form.get("password") ?? "");
            const confirmation = String(form.get("confirmPassword") ?? "");
            if (password !== confirmation) {
                setError("Those passwords do not match.");
                setIsLoading(false);
                return;
            }
            endpoint = "/api/v1/auth/reset-password";
            payload = { token, password };
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                setError(messages[mode].error);
                setIsLoading(false);
                return;
            }
            setComplete(true);
        } catch {
            setError("We could not reach Courier. Check your connection and try again.");
            setIsLoading(false);
        }
    }

    if (complete) {
        return <div className="auth-notice mt-7" role="status" aria-live="polite"><StatusIcon /><p className="mb-0">{messages[mode].success}</p></div>;
    }

    if ((mode === "verify" || mode === "reset-password") && !token) {
        return <p className="auth-error mt-7" role="alert">This link is missing its security token. Open the latest link in your email or request another one.</p>;
    }

    return (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit} aria-busy={isLoading}>
            {(mode === "resend-verification" || mode === "request-password-reset") && (
                <label className="auth-label">
                    Email address
                    <input className="auth-input" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
                </label>
            )}
            {mode === "reset-password" && <>
                <label className="auth-label">
                    New password
                    <input className="auth-input" type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required />
                    <span className="mt-2 block text-[11px] font-normal normal-case tracking-normal text-courier-muted">Use at least 12 characters.</span>
                </label>
                <label className="auth-label">
                    Confirm new password
                    <input className="auth-input" type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required />
                </label>
            </>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit group" type="submit" disabled={isLoading}>
                {isLoading ? "One moment…" : mode === "verify" ? "Verify email address" : mode === "resend-verification" ? "Send verification link" : mode === "request-password-reset" ? "Send reset link" : "Save new password"}
                {!isLoading && <ArrowIcon />}
            </button>
        </form>
    );
}
