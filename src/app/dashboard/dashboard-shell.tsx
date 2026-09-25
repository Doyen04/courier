"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandMark } from "@/components/brand-mark";

const navigation = [
    { href: "/dashboard", label: "Overview", icon: "overview" },
    { href: "/dashboard/requests", label: "My requests", icon: "requests" },
    { href: "/dashboard/journeys", label: "My journeys", icon: "journeys" },
    { href: "/dashboard/agreements", label: "Agreements", icon: "agreements" },
    { href: "/dashboard/profile", label: "Profile", icon: "profile" },
];

function NavIcon({ name }: { name: string }) {
    return (
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {name === "overview" && <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />}
            {name === "requests" && <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>}
            {name === "journeys" && <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18h2a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h1" /></>}
            {name === "agreements" && <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13h8m-8 4h6" /></>}
            {name === "profile" && <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>}
            {name === "support" && <><path d="m12 3 8 4v5c0 5-3.4 7.8-8 9-4.6-1.2-8-4-8-9V7l8-4Z" /><path d="m9 12 2 2 4-4" /></>}
            {name === "sign-out" && <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="m16 16 4-4-4-4m4 4H9" /></>}
        </svg>
    );
}

function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
}

export function DashboardShell({
    children,
    userName,
    userEmail,
    supportAccess,
}: {
    children: ReactNode;
    userName: string;
    userEmail: string;
    supportAccess: boolean;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const sidebarWidth = collapsed ? "lg:w-[88px]" : "lg:w-[272px]";
    const contentOffset = collapsed ? "lg:pl-[88px]" : "lg:pl-[272px]";

    function closeMobile() {
        setMobileOpen(false);
    }

    const currentPage = navigation.find(({ href }) => href === "/dashboard" ? pathname === href : pathname.startsWith(href));

    return (
        <div className="min-h-dvh bg-[#f6f7f4] text-courier-ink">
            {mobileOpen && <button className="fixed inset-0 z-40 bg-[#142b25]/45 lg:hidden" aria-label="Close navigation" onClick={closeMobile} />}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-courier-line bg-white transition-[width,transform] duration-200 lg:translate-x-0 ${sidebarWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Main navigation">
                <div className={`flex h-19 items-center ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
                    <BrandMark compact={collapsed} />
                    <button className="grid size-9 place-items-center rounded-lg text-courier-muted hover:bg-[#f3f5f2] lg:hidden" type="button" aria-label="Close navigation" onClick={closeMobile}><CloseIcon /></button>
                </div>

                <div className={`border-t border-courier-line px-3 pt-6 ${collapsed ? "lg:px-2" : ""}`}>
                    {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-courier-muted">Workspace</p>}
                    <nav className="space-y-1" aria-label="Dashboard pages">
                        {navigation.map(({ href, label, icon }) => {
                            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                            return (
                                <Link key={href} href={href} onClick={closeMobile} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined}
                                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${active ? "bg-[#eaf2ec] text-courier-green" : "text-[#66736c] hover:bg-[#f5f6f3] hover:text-courier-ink"} ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-black/[.035] text-courier-green"><NavIcon name={icon} /></span>
                                    <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto px-3 pb-4">
                    {supportAccess && <Link href="/support/disputes" onClick={closeMobile} className={`mb-3 flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium text-courier-green hover:bg-[#f5f6f3] ${collapsed ? "lg:justify-center lg:px-0" : ""}`} title={collapsed ? "Support queue" : undefined}>
                        <span className="grid size-8 shrink-0 place-items-center"><NavIcon name="support" /></span><span className={collapsed ? "lg:hidden" : ""}>Support queue</span>
                    </Link>}
                    <Link href="/dashboard/profile" onClick={closeMobile} className={`mb-2 flex min-h-14.5 items-center gap-3 rounded-xl border border-courier-line bg-[#fafbf9] p-2.5 hover:border-[#c9d9cc] ${collapsed ? "lg:justify-center lg:border-transparent lg:bg-transparent lg:p-0" : ""}`} title={collapsed ? `${userName} profile` : undefined}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-courier-green text-[11px] font-bold text-white">{initials(userName)}</span>
                        <span className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}><span className="block truncate text-xs font-semibold text-courier-ink">{userName}</span><span className="block truncate text-[10px] text-courier-muted">{userEmail}</span></span>
                    </Link>
                    <button className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[12px] font-semibold text-[#8c433a] transition-colors hover:bg-[#fff4f1] ${collapsed ? "lg:justify-center lg:px-0" : ""}`} type="button" onClick={() => signOut({ callbackUrl: "/" })} title={collapsed ? "Sign out" : undefined}>
                        <span className="grid size-9 shrink-0 place-items-center"><NavIcon name="sign-out" /></span><span className={collapsed ? "lg:hidden" : ""}>Sign out</span>
                    </button>
                </div>
            </aside>

            <div className={contentOffset}>
                <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-courier-line bg-white/95 px-4 backdrop-blur sm:px-8 lg:px-10">
                    <div className="flex min-w-0 items-center gap-3">
                        <button className="grid size-10 place-items-center rounded-xl border border-courier-line lg:hidden" type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><MenuIcon /></button>
                        <button className="hidden size-10 place-items-center rounded-xl border border-courier-line text-courier-muted transition hover:border-courier-green hover:text-courier-green lg:grid" type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} onClick={() => setCollapsed((value) => !value)}>
                            <CollapseIcon collapsed={collapsed} />
                        </button>
                        <div className="min-w-0"><p className="mb-0 text-[10px] font-semibold uppercase tracking-[.15em] text-courier-muted">Courier workspace</p><p className="mb-0 truncate text-sm font-semibold">{currentPage?.label ?? "Workspace"}</p></div>
                    </div>
                </header>
                <main className="mx-auto min-h-[calc(100dvh-76px)] w-full max-w-375 px-4 py-7 sm:px-8 sm:py-9 lg:px-10 xl:px-12">{children}</main>
            </div>
        </div>
    );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
    return <svg viewBox="0 0 20 20" className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 4-6 6 6 6" /></svg>;
}

function CloseIcon() {
    return <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>;
}

function MenuIcon() {
    return <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>;
}
