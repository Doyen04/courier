import Link from "next/link";
import { getCurrentAuthenticatedUser } from "@/lib/auth/adapter";
import { WorkspaceHeading } from "../workspace-ui";

export default async function DashboardProfilePage() {
    const user = await getCurrentAuthenticatedUser();
    if (!user) return null;

    return <>
        <WorkspaceHeading eyebrow="Account" title="Your profile" description="Your account details and sign-in security." />
        <section className="max-w-3xl rounded-2xl border border-courier-line bg-white p-5 sm:p-8" aria-labelledby="profile-details-heading">
            <div className="flex items-center gap-4 border-b border-courier-line pb-6">
                <span className="grid size-14 place-items-center rounded-2xl bg-courier-green text-lg font-semibold text-white">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                <div>
                    <h2 id="profile-details-heading" className="mb-1 font-display text-xl font-semibold">{user.name}</h2><p className="mb-0 text-sm text-courier-muted">Courier member</p>
                </div>
            </div>
            <dl className="grid gap-5 py-6 sm:grid-cols-2">
                <div><dt className="text-xs font-medium text-courier-muted">Display name</dt>
                    <dd className="mb-0 mt-1 text-sm font-semibold">{user.name}</dd>
                </div>
                <div>
                    <dt className="text-xs font-medium text-courier-muted">Email address</dt>
                    <dd className="mb-0 mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {user.email}
                        <span className="rounded-full bg-[#eaf3ec] px-2 py-1 text-[10px] font-semibold text-courier-green">Verified</span>
                    </dd>
                </div>
            </dl>
            <div className="rounded-xl bg-[#f7f8f5] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div><h3 className="mb-1 text-sm font-semibold">Password and security</h3>
                    <p className="mb-0 text-xs leading-5 text-courier-muted">Reset your password if you need to update your sign-in credentials.</p>
                </div>
                <Link className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-courier-line bg-white px-3.5 text-xs font-semibold text-courier-green hover:border-courier-green sm:mt-0" href="/forgot-password">Reset password</Link>
            </div>
        </section>
    </>;
}
