"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, type Agreement, type ItemRequest, type Itinerary } from "./dashboard-data";
import { EmptyState, InlineMessage, LoadingPanel, WorkspaceHeading } from "./workspace-ui";

export function DashboardOverview({ userName }: { userName: string }) {
    const [requests, setRequests] = useState<ItemRequest[]>([]);
    const [journeys, setJourneys] = useState<Itinerary[]>([]);
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        Promise.all([
            apiRequest<{ items: ItemRequest[] }>("/api/v1/requests?limit=100"),
            apiRequest<{ items: Itinerary[] }>("/api/v1/itineraries?limit=100"),
            apiRequest<Agreement[]>("/api/v1/agreements"),
        ]).then(([requestData, journeyData, agreementData]) => {
            if (!active) return;
            setRequests(requestData.items);
            setJourneys(journeyData.items);
            setAgreements(agreementData);
        }).catch((cause: unknown) => {
            if (active) setError(cause instanceof Error ? cause.message : "Your overview could not be loaded.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const activeRequests = requests.filter(({ status }) => ["OPEN", "MATCHED"].includes(status));
    const activeJourneys = journeys.filter(({ status }) => ["PLANNED", "ACTIVE"].includes(status));
    const activeAgreements = agreements.filter(({ status }) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(status));

    return (
        <>
            <WorkspaceHeading eyebrow="Your Courier desk" title={`Good to see you, ${userName.split(" ")[0]}.`} description="A clear view of your open requests, upcoming journeys, and delivery agreements." />
            <InlineMessage error={error} />
            {loading ? <LoadingPanel label="Gathering your latest activity…" /> : <>
                <section className="grid gap-4 sm:grid-cols-3" aria-label="Workspace summary">
                    <SummaryCard label="Open requests" value={activeRequests.length} href="/dashboard/requests" tint="green" />
                    <SummaryCard label="Upcoming journeys" value={activeJourneys.length} href="/dashboard/journeys" tint="gold" />
                    <SummaryCard label="Active agreements" value={activeAgreements.length} href="/dashboard/agreements" tint="blue" />
                </section>

                <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
                    <div className="rounded-2xl border border-courier-line bg-white p-5 sm:p-7">
                        <div className="mb-5 flex items-center justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-courier-muted">Your activity</p><h2 className="mb-0 font-display text-xl font-semibold tracking-tight">Recent requests</h2></div><Link className="text-xs font-semibold text-courier-green hover:underline" href="/dashboard/requests">View all</Link></div>
                        {requests.length ? <div className="divide-y divide-courier-line">{requests.slice(0, 4).map((item) => <Link key={item.id} href="/dashboard/requests" className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="mb-1 truncate text-sm font-semibold">{item.title}</p><p className="mb-0 truncate text-xs text-courier-muted">{item.originName} → {item.destinationName}</p></div><span className="shrink-0 rounded-full bg-[#f3f5f2] px-2.5 py-1 text-[10px] font-medium capitalize text-courier-muted">{item.status.toLowerCase()}</span></Link>)}</div> : <p className="mb-0 py-6 text-sm text-courier-muted">No requests yet. Create one when you need something carried.</p>}
                    </div>

                    <div className="rounded-2xl bg-courier-green p-6 text-white sm:p-7">
                        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#f1d39a]"><span className="size-2 rounded-full bg-courier-gold ring-4 ring-courier-gold/20" aria-hidden="true" />Get started</p>
                        <h2 className="mb-2 max-w-xs font-display text-2xl font-semibold leading-tight tracking-[-.04em]">Connect a need with a journey.</h2>
                        <p className="mb-5 text-sm leading-6 text-white/70">Post what you need, or share a route you already have planned.</p>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold text-courier-green hover:bg-[#f2f6f2]" href="/dashboard/requests?new=1">Create a request</Link>
                            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d7ad72] px-4 text-xs font-semibold text-white transition hover:bg-courier-gold/20" href="/dashboard/journeys?new=1">Share a journey</Link>
                        </div>
                    </div>
                </section>

                <section className="mt-8 rounded-2xl border border-courier-line bg-white p-5 sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-courier-muted">Needs your attention</p><h2 className="mb-0 font-display text-xl font-semibold tracking-tight">Agreements in progress</h2></div><Link className="text-xs font-semibold text-courier-green hover:underline" href="/dashboard/agreements">View agreements</Link></div>
                    {agreements.length ? <div className="grid gap-3 md:grid-cols-2">{agreements.slice(0, 4).map((agreement) => <Link key={agreement.id} href="/dashboard/agreements" className="flex items-center justify-between gap-4 rounded-xl border border-courier-line p-4 transition hover:border-courier-green"><div className="min-w-0"><p className="mb-1 truncate text-sm font-semibold">{agreement.match.request.title}</p><p className="mb-0 truncate text-xs text-courier-muted">{agreement.match.itinerary.originName} → {agreement.match.itinerary.destinationName}</p></div><span className="shrink-0 rounded-full bg-[#edf4ef] px-2.5 py-1 text-[10px] font-semibold capitalize text-courier-green">{agreement.status.toLowerCase().replaceAll("_", " ")}</span></Link>)}</div> : <EmptyState title="No agreements yet" body="When a request and journey connect, you’ll manage the details and delivery progress here." href="/dashboard/requests" action="Browse your requests" />}
                </section>
            </>}
        </>
    );
}

function SummaryCard({ label, value, href, tint }: { label: string; value: number; href: string; tint: "green" | "gold" | "blue" }) {
    const tone = { green: "bg-[#eaf3ec] text-courier-green", gold: "bg-[#f7efe3] text-courier-gold", blue: "bg-[#edf3f4] text-[#52727a]" }[tint];
    return <Link href={href} className={`group rounded-2xl border border-courier-line border-t-2 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c9d9cc] hover:shadow-[0_10px_30px_rgba(25,61,53,.06)] ${tint === "gold" ? "border-t-courier-gold" : tint === "green" ? "border-t-courier-green" : "border-t-[#52727a]"}`}>
        <div className="flex items-start justify-between"><span className="text-xs font-medium text-courier-muted">{label}</span><span className={`grid size-8 place-items-center rounded-lg text-base ${tone}`} aria-hidden="true">↗</span></div>
        <p className="mb-0 mt-5 font-display text-4xl font-semibold tracking-[-.06em]">{value.toString().padStart(2, "0")}</p>
        <span className="mt-2 block text-[11px] font-medium text-courier-muted group-hover:text-courier-green">View details</span>
    </Link>;
}
