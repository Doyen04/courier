import { RequestsWorkspace } from "./requests-workspace";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ new?: string | string[] }> }) {
    const params = await searchParams;
    return <RequestsWorkspace initiallyOpen={params.new === "1"} />;
}
