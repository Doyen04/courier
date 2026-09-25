import { JourneysWorkspace } from "./journeys-workspace";

export default async function JourneysPage({ searchParams }: { searchParams: Promise<{ new?: string | string[] }> }) {
    const params = await searchParams;
    return <JourneysWorkspace key={params.new === "1" ? "new-journey" : "journeys"} initiallyOpen={params.new === "1"} />;
}
