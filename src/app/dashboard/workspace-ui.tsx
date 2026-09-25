import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { statusLabel } from "./dashboard-data";

export const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-courier-line bg-white px-3.5 text-sm text-courier-ink outline-none transition placeholder:text-[#a5aea7] focus:border-courier-green focus:ring-4 focus:ring-courier-green/10";
export const labelClass = "block text-[11px] font-semibold text-courier-muted";

export function WorkspaceHeading({ eyebrow, title, description, action }: {
    eyebrow: string; title: string; description: string; action?: ReactNode;
}) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-courier-green">{eyebrow}</p>
                <h1 className="mb-2 font-display text-3xl font-semibold tracking-tighter sm:text-[40px]">{title}</h1>
                <p className="mb-0 max-w-2xl text-sm leading-6 text-courier-muted">{description}</p>
            </div>
            {action}
        </div>
    );
}

export function PrimaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-courier-green px-4 text-sm font-semibold text-white transition hover:bg-courier-green-deep disabled:cursor-wait disabled:opacity-60 ${props.className ?? ""}`}>{children}</button>;
}

export function SecondaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-courier-line bg-white px-3.5 text-xs font-semibold text-courier-ink transition hover:border-courier-green hover:bg-[#f8faf8] disabled:opacity-60 ${props.className ?? ""}`}>{children}</button>;
}

export function StatusBadge({ status }: { status: string }) {
    const attention = ["DISPUTED", "CANCELLED", "REFUNDED", "FAILED", "EXPIRED"].includes(status);
    const positive = ["COMPLETED", "FUNDED", "IN_HANDOFF", "DELIVERED", "RELEASE_PENDING", "RELEASED"].includes(status);
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${attention ? "bg-[#fff1ee] text-[#9a4035]" : positive ? "bg-[#eaf3ec] text-courier-green" : "bg-[#f2f3ef] text-courier-muted"}`}>{statusLabel(status)}</span>;
}

export function EmptyState({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#d7dfd8] bg-white px-6 py-10 text-center sm:px-10">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf4ef] text-xl text-courier-green" aria-hidden="true">＋</span>
            <h2 className="mb-2 mt-4 font-display text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mx-auto mb-0 max-w-md text-sm leading-6 text-courier-muted">{body}</p>
            {href && action && <Link href={href} className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-courier-green px-4 text-xs font-semibold text-white hover:bg-courier-green-deep">{action}</Link>}
        </div>
    );
}

export function InlineMessage({ error, notice, onDismiss }: { error?: string | null; notice?: string | null; onDismiss?: () => void }) {
    const message = error ?? notice;
    if (!message) return null;
    return <div className={`mb-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm leading-5 ${error ? "border-[#f0d3ce] bg-[#fff7f5] text-[#963b32]" : "border-[#d6e5d9] bg-[#f2f7f3] text-courier-green"}`} role={error ? "alert" : "status"}><span>{message}</span>{onDismiss && <button type="button" aria-label="Dismiss message" className="font-semibold" onClick={onDismiss}>×</button>}</div>;
}

export function LoadingPanel({ label = "Loading your workspace…" }: { label?: string }) {
    return <div className="rounded-2xl border border-courier-line bg-white p-10 text-center text-sm text-courier-muted" role="status">{label}</div>;
}
