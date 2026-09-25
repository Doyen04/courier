"use client";

import type { FormEvent } from "react";
import { PrimaryButton } from "../../workspace-ui";
import { JourneyFields } from "./journey-fields";

export function JourneyForm({
    onSubmit,
    submitting,
    errors,
}: {
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    submitting: boolean;
    errors?: Record<string, string>;
}) {
    return (
        <form
            className="mb-6 rounded-2xl border border-courier-line bg-white p-5 sm:p-7"
            onSubmit={onSubmit}
        >
            <div className="mb-5">
                <h2 className="mb-1 font-display text-xl font-semibold">
                    Share your planned route
                </h2>
                <p className="mb-0 text-xs text-courier-muted">
                    We’ll suggest requests that fit the cities and timing you share.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <JourneyFields errors={errors} />
                <PrimaryButton
                    className="sm:col-span-2 sm:w-fit"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? "Sharing…" : "Share journey"}
                </PrimaryButton>
            </div>
        </form>
    );
}
