import { auth } from "@/auth";
import { isSupportUser } from "@/lib/auth/support-access";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth();
    const user = session?.user;

    return (
        <DashboardShell
            userName={user?.name ?? "Courier member"}
            userEmail={user?.email ?? ""}
            supportAccess={Boolean(user?.id && isSupportUser(user.id))}
        >
            {children}
        </DashboardShell>
    );
}
