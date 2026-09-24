import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/auth/adapter";
import { isSupportUser } from "@/lib/auth/support-access";
import { DashboardClient } from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) redirect("/sign-in");

  return (
    <DashboardClient
      userId={user.id}
      userName={user.name ?? "there"}
      supportAccess={isSupportUser(user.id)}
    />
  );
}
