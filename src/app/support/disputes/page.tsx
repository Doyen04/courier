import { notFound, redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/auth/adapter";
import { isSupportUser } from "@/lib/auth/support-access";
import { SupportDisputesClient } from "@/app/support/disputes/support-disputes-client";

export default async function SupportDisputesPage() {
    const user = await getCurrentAuthenticatedUser();
    if (!user) redirect("/sign-in");
    if (!isSupportUser(user.id)) notFound();
    return <SupportDisputesClient />;
}
