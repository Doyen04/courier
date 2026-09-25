import { getCurrentAuthenticatedUser } from "@/lib/auth/adapter";
import { DashboardOverview } from "./dashboard-overview";

export default async function DashboardPage() {
    const user = await getCurrentAuthenticatedUser();
    return <DashboardOverview userName={user?.name ?? "there"} />;
}
