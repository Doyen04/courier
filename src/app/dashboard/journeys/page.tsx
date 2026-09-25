import { JourneysWorkspace } from "./journeys-workspace";

export default async function JourneysPage({ searchParams }: { searchParams: Promise<{ new?: string | string[] }> }) {
    const params = await searchParams;
    return <JourneysWorkspace initiallyOpen={params.new === "1"} />;
}
