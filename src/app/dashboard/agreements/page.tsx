import { getCurrentAuthenticatedUser } from "@/lib/auth/adapter";
import { AgreementWorkspace } from "./agreement-workspace";

export default async function AgreementsPage() {
    const user = await getCurrentAuthenticatedUser();
    return <AgreementWorkspace userId={user?.id ?? ""} />;
}
