import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/auth/adapter";
import { isSupportUser } from "@/lib/auth/support-access";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const user = await getCurrentAuthenticatedUser();
    if (!user) redirect("/sign-in");

    return (
        <DashboardShell userName={user.name} userEmail={user.email} supportAccess={isSupportUser(user.id)}>
            {children}
        </DashboardShell>
    );
}
