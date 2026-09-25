"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { BrandMark } from "@/components/brand-mark";
import { AgreementLifecycle } from "@/components/agreement-lifecycle";

type DashboardTab = "overview" | "requests" | "journeys" | "agreements";
type ItemRequest = {
  id: string;
  title: string;
  description: string;
  itemCostMinor: number;
  currency: string;
  originName: string;
  originCountryCode: string;
  destinationName: string;
  destinationCountryCode: string;
  neededBy: string | null;
  status: string;
};
type Itinerary = {
  id: string;
  originName: string;
  originCountryCode: string;
  destinationName: string;
  destinationCountryCode: string;
  departureAt: string;
  arrivalBy: string;
  routeStops: Array<{ name: string; countryCode: string }> | null;
  status: string;
};
type Match = {
  id: string;
  status: string;
  score: number | string | null;
  itinerary?: {
    originName: string;
    destinationName: string;
    arrivalBy: string;
    traveler: { displayName: string };
  };
  request?: {
    title: string;
    originName: string;
    destinationName: string;
    neededBy: string | null;
    requester: { displayName: string };
  };
};
type TermsRevision = {
  id: string;
  revision: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
  status: string;
  handoffDetails: { notes?: string; suggestedMeetup?: string | null } | null;
};
type AgreementPayment = {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  authorizedAt: string | null;
  capturedAt: string | null;
  releasedAt: string | null;
};
type DeliveryReceipt = { id: string; requesterId: string; confirmedAt: string; note: string | null };
type AgreementDispute = { id: string; status: string; reason: string; resolutionNote: string | null; createdAt: string; resolvedAt: string | null };
type Agreement = {
  id: string;
  requesterId: string;
  travelerId: string;
  status: string;
  payments: AgreementPayment[];
  deliveryConfirmation: DeliveryReceipt | null;
  dispute: AgreementDispute | null;
  match: {
    request: { title: string; description: string; itemCostMinor: number; currency: string };
    itinerary: { originName: string; destinationName: string; arrivalBy: string };
  };
  termsRevisions: TermsRevision[];
};
type MatchPanel = { matches: Match[]; matchingStatus: string };

const fieldClass = "auth-input";
const labelClass = "auth-label";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Courier could not complete that request.");
  }
  return payload.data as T;
}

function formatMoney(minor: number, currency: string) {
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 10 ** digits);
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}

function moneyToMinor(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid amount.");
  let digits = 2;
  try {
    digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    throw new Error("Enter a valid three-letter currency code.");
  }
  const minor = Math.round(amount * 10 ** digits);
  if (!Number.isSafeInteger(minor)) throw new Error("That amount is too large.");
  return minor;
}

function parseRouteStops(value: string) {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length > 20) throw new Error("You can add up to 20 route stops.");
  return lines.map((line) => {
    const separator = line.lastIndexOf(",");
    if (separator < 1) throw new Error("Write each stop as a city followed by a two-letter country code, for example Ibadan, NG.");
    const name = line.slice(0, separator).trim();
    const countryCode = line.slice(separator + 1).trim().toUpperCase();
    if (!name || !/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error("Write each stop as a city followed by a two-letter country code, for example Ibadan, NG.");
    }
    return { name, countryCode };
  });
}

function minorToMajorInput(minor: number, currency: string) {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return (minor / 10 ** digits).toFixed(digits);
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function dateLabel(value: string | null) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

function StatusTag({ status }: { status: string }) {
  const positive = ["COMPLETED", "FUNDED", "IN_HANDOFF", "DELIVERED", "RELEASE_PENDING", "RELEASED"].includes(status);
  const attention = ["DISPUTED", "CANCELLED", "REFUNDED", "FAILED", "EXPIRED"].includes(status);
  const color = attention ? "border-[#e8d4cf] bg-[#fff8f6] text-[#9a4035]" : positive ? "border-[#d4e4d8] bg-[#f4f8f5] text-courier-green" : "border-courier-line bg-white text-courier-muted";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.08em] ${color}`}><span className={`h-1.5 w-1.5 rounded-full ${attention ? "bg-[#a33d31]" : positive ? "bg-courier-green" : "bg-courier-gold"}`} aria-hidden="true" />{statusLabel(status)}</span>;
}

function WorkspaceIcon({ item, className = "size-4.5" }: { item: DashboardTab; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {item === "overview" && <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" /><path d="M2 10 12 2l10 8" /></>}
      {item === "requests" && <><path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>}
      {item === "journeys" && <><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="6" r="2.5" /><path d="M7.5 18H10a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h.5" /></>}
      {item === "agreements" && <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13h8m-8 4h6" /></>}
    </svg>
  );
}

export function DashboardClient({ userId, userName, supportAccess }: { userId: string; userName: string; supportAccess: boolean }) {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [matchPanels, setMatchPanels] = useState<Record<string, MatchPanel>>({});
  const [matchLoading, setMatchLoading] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<"request" | "journey" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [requestData, itineraryData, agreementData] = await Promise.all([
        apiRequest<{ items: ItemRequest[] }>("/api/v1/requests?limit=100"),
        apiRequest<{ items: Itinerary[] }>("/api/v1/itineraries?limit=100"),
        apiRequest<Agreement[]>("/api/v1/agreements"),
      ]);
      setRequests(requestData.items);
      setItineraries(itineraryData.items);
      setAgreements(agreementData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  async function loadMatches(kind: "request" | "journey", id: string) {
    const key = `${kind}:${id}`;
    setMatchLoading(key);
    setError(null);
    try {
      const path = kind === "request"
        ? `/api/v1/requests/${id}/matches`
        : `/api/v1/itineraries/${id}/matches`;
      const result = await apiRequest<MatchPanel>(path);
      setMatchPanels((previous) => ({ ...previous, [key]: result }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Matches could not be loaded.");
    } finally {
      setMatchLoading(null);
    }
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currency = String(form.get("currency") ?? "NGN").trim().toUpperCase();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<ItemRequest>("/api/v1/requests", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          itemCostMinor: moneyToMinor(String(form.get("itemCost") ?? ""), currency),
          currency,
          originName: form.get("originName"),
          originCountryCode: form.get("originCountryCode"),
          destinationName: form.get("destinationName"),
          destinationCountryCode: form.get("destinationCountryCode"),
          neededBy: form.get("neededBy") || undefined,
        }),
      });
      setFormOpen(null);
      setNotice("Your request is on its way. We’ll look for a traveler headed there.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your request could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitItinerary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<Itinerary>("/api/v1/itineraries", {
        method: "POST",
        body: JSON.stringify({
          originName: form.get("originName"),
          originCountryCode: form.get("originCountryCode"),
          destinationName: form.get("destinationName"),
          destinationCountryCode: form.get("destinationCountryCode"),
          routeStops: parseRouteStops(String(form.get("routeStopsText") ?? "")),
          departureAt: new Date(String(form.get("departureAt"))).toISOString(),
          arrivalBy: new Date(String(form.get("arrivalBy"))).toISOString(),
        }),
      });
      setFormOpen(null);
      setNotice("Your route is saved. We’ll show requests that fit your journey.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your journey could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRequest(event: FormEvent<HTMLFormElement>, item: ItemRequest) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currency = String(form.get("currency") ?? item.currency).trim().toUpperCase();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/requests/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          itemCostMinor: moneyToMinor(String(form.get("itemCost") ?? ""), currency),
          currency,
          originName: form.get("originName"),
          originCountryCode: form.get("originCountryCode"),
          destinationName: form.get("destinationName"),
          destinationCountryCode: form.get("destinationCountryCode"),
          neededBy: form.get("neededBy") || null,
        }),
      });
      setNotice("Your request details have been updated.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your request could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateItinerary(event: FormEvent<HTMLFormElement>, item: Itinerary) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/itineraries/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          originName: form.get("originName"),
          originCountryCode: form.get("originCountryCode"),
          destinationName: form.get("destinationName"),
          destinationCountryCode: form.get("destinationCountryCode"),
          routeStops: parseRouteStops(String(form.get("routeStopsText") ?? "")),
          departureAt: new Date(String(form.get("departureAt"))).toISOString(),
          arrivalBy: new Date(String(form.get("arrivalBy"))).toISOString(),
        }),
      });
      setNotice("Your route details have been updated.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your route could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRequest(id: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/requests/${id}`, { method: "DELETE" });
      setNotice("The request was closed.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This request could not be cancelled.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelItinerary(id: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/itineraries/${id}`, { method: "DELETE" });
      setNotice("The route was cancelled.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This route could not be cancelled.");
    } finally {
      setSubmitting(false);
    }
  }

  async function respondToMatch(matchId: string, itineraryId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/matches/${matchId}/interest`, { method: "POST" });
      setNotice("Your interest was sent to the requester.");
      await loadMatches("journey", itineraryId);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your response could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startAgreement(matchId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/api/v1/agreements", { method: "POST", body: JSON.stringify({ matchId }) });
      setNotice("The agreement is open. The traveler can now propose the delivery terms.");
      setTab("agreements");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The agreement could not be started.");
    } finally {
      setSubmitting(false);
    }
  }

  async function proposeTerms(event: FormEvent<HTMLFormElement>, agreement: Agreement) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/agreements/${agreement.id}/terms`, {
        method: "POST",
        body: JSON.stringify({
          deliveryFeeMinor: moneyToMinor(String(form.get("deliveryFee") ?? ""), agreement.match.request.currency),
          handoffDetails: {
            notes: form.get("handoffNotes"),
            ...(form.get("meetup") ? { suggestedMeetup: form.get("meetup") } : {}),
          },
        }),
      });
      setNotice("Terms sent. The requester can review the full amount and handoff details.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Those terms could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptTerms(agreementId: string, revisionId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/agreements/${agreementId}/terms/${revisionId}/accept`, { method: "POST" });
      setNotice("You accepted the latest terms. Payment setup will appear here when it’s available.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The terms could not be accepted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelAgreement(agreementId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/agreements/${agreementId}/cancel`, { method: "POST" });
      setNotice("The agreement was cancelled before funding.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The agreement could not be cancelled.");
    } finally {
      setSubmitting(false);
    }
  }

  async function beginHandoff(agreementId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/agreements/${agreementId}/handoff`, { method: "POST" });
      setNotice("Handoff started. The requester can confirm once the item has been received.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Handoff could not be started.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelivery(agreementId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/agreements/${agreementId}/delivery-confirmation`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setNotice("Receipt recorded. The agreement is now waiting for payment release processing.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Receipt could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  }

  async function reportAgreementIssue(agreementId: string, reason: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/agreements/${agreementId}/disputes`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setNotice("Your issue has been sent to Courier support. Release is paused while it is reviewed.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your issue could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleRequests = tab === "overview" || tab === "requests";
  const visibleJourneys = tab === "overview" || tab === "journeys";
  const visibleAgreements = tab === "overview" || tab === "agreements";

  return (
    <main className="dashboard-shell min-h-screen bg-[#fbfaf7] text-courier-ink">
      <header className="sticky top-0 z-40 border-b border-courier-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-19 max-w-345 items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <BrandMark />
          <div className="flex items-center gap-4 sm:gap-7">
            <span className="hidden text-[11px] text-courier-muted sm:inline">A good day to bring things closer.</span>
            <button className="min-h-10 rounded-full border border-courier-line px-4 text-[11px] font-semibold text-courier-green transition-colors hover:border-courier-green hover:bg-[#f5f8f5]" type="button" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="dashboard-sidebar sticky top-19 hidden h-[calc(100dvh-76px)] flex-col bg-white px-5 py-7 lg:flex" aria-label="Main navigation">
          <p className="mb-4 px-2 text-[10px] font-bold uppercase tracking-[.15em] text-courier-muted">Your workspace</p>
          <nav className="space-y-1.5" aria-label="Workspace views">
            {(["overview", "requests", "journeys", "agreements"] as const).map((item) => (
              <button key={item} className={`flex min-h-12.5 w-full items-center gap-3 rounded-2xl px-3 text-left text-[12px] font-semibold capitalize transition-colors ${tab === item ? "bg-[#edf4ef] text-courier-green" : "text-courier-muted hover:bg-[#f7f8f6] hover:text-courier-ink"}`} type="button" aria-current={tab === item ? "page" : undefined} onClick={() => { setTab(item); setFormOpen(null); }}>
                <span className={`grid size-8 place-items-center rounded-full ${tab === item ? "bg-white text-courier-green" : "bg-[#f5f3ed] text-courier-gold"}`}><WorkspaceIcon item={item} /></span>
                {item === "journeys" ? "My journeys" : item === "overview" ? "Overview" : item === "requests" ? "My requests" : "Agreements"}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-[22px] bg-[#f7f5ef] p-4">
            <div className="mb-3 grid size-9 place-items-center rounded-full bg-courier-green text-[12px] font-bold uppercase text-white">{userName.trim().slice(0, 1)}</div>
            <p className="mb-1 text-[12px] font-semibold text-courier-ink">{userName}</p>
            <p className="mb-0 text-[9px] leading-4 text-courier-muted">Requester · Traveler</p>
            {supportAccess && <Link className="mt-3 inline-flex text-[10px] font-semibold text-courier-green underline decoration-courier-gold/60 underline-offset-4" href="/support/disputes">Support review queue</Link>}
          </div>
        </aside>

        <div className="mx-auto w-full min-w-0 px-5 pb-28 sm:px-8 lg:px-10 lg:pb-12 xl:px-12">
        <section className="dashboard-welcome grid gap-6 py-7 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(290px,.62fr)] lg:items-center">
          <div>
            <p className="mb-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.15em] text-courier-green"><span className="h-px w-7 bg-courier-gold" /> Your Courier desk</p>
            <h1 className="mb-0 max-w-200 font-display text-[clamp(2.4rem,4.5vw,4rem)] font-semibold leading-none tracking-[-.06em]">Good to see you, <em className="font-normal text-courier-green">{userName.split(" ")[0]}.</em></h1>
            <p className="mb-0 mt-4 max-w-130 text-[14px] leading-6 text-courier-muted">Requests, routes and handoffs, all moving from one place.</p>
          </div>
          <div className="relative overflow-hidden rounded-[26px] border border-[#d9e5dc] bg-[#edf4ef] px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-4">
              <div><p className="mb-1 text-[9px] font-bold uppercase tracking-[.14em] text-courier-muted">Already going somewhere?</p><p className="mb-0 font-display text-[20px] font-medium tracking-[-.035em]">Carry good things along.</p></div>
              <svg className="h-10.5 w-23 shrink-0" viewBox="0 0 92 42" fill="none" aria-hidden="true"><path d="M5 31C22 31 17 9 39 9s17 24 37 24 11-17 12-17" stroke="#bd8845" strokeWidth="1.5" strokeDasharray="3 4"/><circle cx="5" cy="31" r="4" fill="#145b4c"/><rect x="84" y="12" width="7" height="7" fill="#bd8845"/></svg>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="min-h-10.5 rounded-full bg-courier-green px-3 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep" type="button" onClick={() => { setFormOpen(formOpen === "request" ? null : "request"); setTab("requests"); }}>Create a request</button>
              <button className="min-h-10.5 rounded-full border border-courier-green px-3 text-[10px] font-semibold text-courier-green transition-colors hover:bg-white" type="button" onClick={() => { setFormOpen(formOpen === "journey" ? null : "journey"); setTab("journeys"); }}>Share a route</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 py-3 sm:gap-4 sm:py-4" aria-label="Workspace summary">
          <div className="rounded-[20px] border border-courier-line bg-white px-3 py-3.5 sm:px-5 sm:py-4"><span className="block text-[8px] font-bold uppercase tracking-widest text-courier-muted sm:text-[10px]">Open requests</span><strong className="mt-1 block font-display text-[27px] font-semibold tracking-tighter sm:text-[32px]">{requests.filter(({ status }) => ["OPEN", "MATCHED"].includes(status)).length.toString().padStart(2, "0")}</strong></div>
          <div className="rounded-[20px] border border-courier-line bg-white px-3 py-3.5 sm:px-5 sm:py-4"><span className="block text-[8px] font-bold uppercase tracking-widest text-courier-muted sm:text-[10px]">Upcoming routes</span><strong className="mt-1 block font-display text-[27px] font-semibold tracking-tighter sm:text-[32px]">{itineraries.filter(({ status }) => status === "PLANNED" || status === "ACTIVE").length.toString().padStart(2, "0")}</strong></div>
          <div className="rounded-[20px] border border-courier-line bg-white px-3 py-3.5 sm:px-5 sm:py-4"><span className="block text-[8px] font-bold uppercase tracking-widest text-courier-muted sm:text-[10px]">Active agreements</span><strong className="mt-1 block font-display text-[27px] font-semibold tracking-tighter sm:text-[32px]">{agreements.filter(({ status }) => !["COMPLETED", "CANCELLED"].includes(status)).length.toString().padStart(2, "0")}</strong></div>
        </section>

        <nav className="dashboard-mobile-nav fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-3xl border border-courier-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Workspace views">
          {(["overview", "requests", "journeys", "agreements"] as const).map((item) => (
            <button key={item} className={`relative flex min-h-15.5 flex-col items-center justify-center gap-1 text-[9px] font-semibold capitalize transition-colors ${tab === item ? "text-courier-green" : "text-courier-muted hover:text-courier-ink"}`} type="button" aria-current={tab === item ? "page" : undefined} onClick={() => { setTab(item); setFormOpen(null); }}>
              <WorkspaceIcon item={item} className="size-4.5" />
              {item === "journeys" ? "Routes" : item === "overview" ? "Home" : item === "requests" ? "Requests" : "Agreements"}
              {tab === item && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-courier-green" />}
            </button>
          ))}
        </nav>

        {notice && <div className="mt-5 flex items-start justify-between gap-4 border-l-2 border-courier-green bg-[#f5f8f5] px-4 py-3 text-[11px] leading-5 text-courier-ink" role="status"><span>{notice}</span><button className="text-courier-green" type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button></div>}
        {error && <div className="mt-5 flex items-start justify-between gap-4 border-l-2 border-[#a33d31] bg-[#fff8f6] px-4 py-3 text-[11px] leading-5 text-[#83332a]" role="alert"><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={() => setError(null)}>×</button></div>}

        {loading ? <div className="py-20 text-center text-[12px] text-courier-muted" role="status">Gathering the details…</div> : (
          <div className="grid gap-x-12 gap-y-14 pt-9 lg:grid-cols-2">
            {visibleRequests && <section className={tab === "requests" ? "lg:col-span-2" : ""} aria-labelledby="requests-heading">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[.18em] text-courier-gold">From your side</p><h2 id="requests-heading" className="mb-0 font-display text-[30px] leading-none tracking-[-.045em]">Things you’re looking for</h2></div>
                <button className="text-[10px] font-semibold text-courier-green underline decoration-courier-line underline-offset-4 hover:decoration-courier-green" type="button" onClick={() => setFormOpen(formOpen === "request" ? null : "request")}>{formOpen === "request" ? "Close form" : "Add a request"}</button>
              </div>
              {formOpen === "request" && <form className="mb-5 grid gap-4 border border-courier-line p-4 sm:grid-cols-2 sm:p-6" onSubmit={submitRequest}>
                <label className={`${labelClass} sm:col-span-2`}>What would you like brought?<input className={fieldClass} name="title" maxLength={120} placeholder="A book, a keepsake, a hard-to-find part" required /></label>
                <label className={`${labelClass} sm:col-span-2`}>A little more detail<textarea className={`${fieldClass} min-h-21.5 py-3`} name="description" maxLength={4000} placeholder="Tell the traveler what it is and anything they should know." required /></label>
                <label className={labelClass}>Estimated item cost<input className={fieldClass} name="itemCost" type="number" min="0" step="0.01" placeholder="0.00" required /></label>
                <label className={labelClass}>Currency code<input className={fieldClass} name="currency" defaultValue="NGN" minLength={3} maxLength={3} pattern="[A-Za-z]{3}" required /></label>
                <label className={labelClass}>From · city<input className={fieldClass} name="originName" maxLength={180} placeholder="Lagos" required /></label>
                <label className={labelClass}>From · country code<input className={fieldClass} name="originCountryCode" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="NG" required /></label>
                <label className={labelClass}>To · city<input className={fieldClass} name="destinationName" maxLength={180} placeholder="London" required /></label>
                <label className={labelClass}>To · country code<input className={fieldClass} name="destinationCountryCode" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="GB" required /></label>
                <label className={labelClass}>Needed by · optional<input className={fieldClass} name="neededBy" type="date" /></label>
                <div className="flex items-end"><button className="min-h-11.5 w-full bg-courier-green px-4 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Post this request"}</button></div>
              </form>}
              {requests.length === 0 ? <EmptyState title="Nothing on the list yet." body="Write down what you need and we’ll look for someone already making the trip." action="Create your first request" onAction={() => setFormOpen("request")} /> : <div className="space-y-3">{requests.map((item) => <RequestCard key={item.id} item={item} panel={matchPanels[`request:${item.id}`]} loading={matchLoading === `request:${item.id}`} onMatches={() => void loadMatches("request", item.id)} onStartAgreement={startAgreement} onUpdate={updateRequest} onCancel={cancelRequest} submitting={submitting} />)}</div>}
            </section>}

            {visibleJourneys && <section className={tab === "journeys" ? "lg:col-span-2" : ""} aria-labelledby="journeys-heading">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[.18em] text-courier-gold">Already going somewhere?</p><h2 id="journeys-heading" className="mb-0 font-display text-[30px] leading-none tracking-[-.045em]">Routes you’re taking</h2></div>
                <button className="text-[10px] font-semibold text-courier-green underline decoration-courier-line underline-offset-4 hover:decoration-courier-green" type="button" onClick={() => setFormOpen(formOpen === "journey" ? null : "journey")}>{formOpen === "journey" ? "Close form" : "Add a route"}</button>
              </div>
              {formOpen === "journey" && <form className="mb-5 grid gap-4 border border-courier-line p-4 sm:grid-cols-2 sm:p-6" onSubmit={submitItinerary}>
                <label className={labelClass}>Leaving from · city<input className={fieldClass} name="originName" maxLength={180} placeholder="Lagos" required /></label>
                <label className={labelClass}>Leaving from · country code<input className={fieldClass} name="originCountryCode" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="NG" required /></label>
                <label className={labelClass}>Going to · city<input className={fieldClass} name="destinationName" maxLength={180} placeholder="London" required /></label>
                <label className={labelClass}>Going to · country code<input className={fieldClass} name="destinationCountryCode" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="GB" required /></label>
                <label className={labelClass}>Departure date and time<input className={fieldClass} name="departureAt" type="datetime-local" required /></label>
                <label className={labelClass}>Arrival date and time<input className={fieldClass} name="arrivalBy" type="datetime-local" required /></label>
                <label className={`${labelClass} sm:col-span-2`}>Stops along your route · optional<textarea className={`${fieldClass} min-h-19 py-3`} name="routeStopsText" maxLength={4000} placeholder={"Ibadan, NG\nAccra, GH"} /><span className="mt-1.5 block text-[9px] font-normal normal-case tracking-normal text-courier-muted">One city per line, followed by its country code. We can use these to find requests along your journey.</span></label>
                <p className="mb-0 text-[10px] leading-5 text-courier-muted sm:col-span-2">Add your main route points. We’ll only suggest requests that match the cities and timing you share.</p>
                <div className="sm:col-span-2"><button className="min-h-11.5 bg-courier-green px-5 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Share this route"}</button></div>
              </form>}
              {itineraries.length === 0 ? <EmptyState title="Your next route starts here." body="Share a trip you already have planned. We’ll surface requests that could fit along the way." action="Share a journey" onAction={() => setFormOpen("journey")} /> : <div className="space-y-3">{itineraries.map((item) => <ItineraryCard key={item.id} item={item} panel={matchPanels[`journey:${item.id}`]} loading={matchLoading === `journey:${item.id}`} onMatches={() => void loadMatches("journey", item.id)} onRespond={respondToMatch} onUpdate={updateItinerary} onCancel={cancelItinerary} submitting={submitting} />)}</div>}
            </section>}

            {visibleAgreements && <section className={tab === "agreements" ? "lg:col-span-2" : "lg:col-span-2"} aria-labelledby="agreements-heading">
              <div className="mb-5"><p className="mb-2 text-[9px] font-bold uppercase tracking-[.18em] text-courier-gold">A good connection, made clear</p><h2 id="agreements-heading" className="mb-0 font-display text-[30px] leading-none tracking-[-.045em]">Agreements in progress</h2></div>
              {agreements.length === 0 ? <EmptyState title="No agreements yet." body="When a traveler responds to one of your requests, you can open an agreement and settle the details here." /> : <div className="grid gap-4 xl:grid-cols-2">{agreements.map((agreement) => <AgreementCard key={agreement.id} agreement={agreement} userId={userId} onPropose={proposeTerms} onAccept={acceptTerms} onCancel={cancelAgreement} onBeginHandoff={beginHandoff} onConfirmDelivery={confirmDelivery} onReportIssue={reportAgreementIssue} submitting={submitting} />)}</div>}
            </section>}
          </div>
        )}
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-5 text-[9px] font-medium uppercase tracking-[.13em] text-courier-muted">
          <span>Courier · Good things, carried together</span><Link className="transition-colors hover:text-courier-green" href="/">Back to the beginning ↑</Link>
        </footer>
      </div>
      </div>
    </main>
  );
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="border border-dashed border-courier-line px-5 py-8 sm:px-7"><span className="font-display text-[13px] italic text-courier-gold">A fresh page</span><h3 className="mb-2 mt-3 font-display text-[23px] tracking-[-.04em]">{title}</h3><p className="mb-0 max-w-107.5 text-[11px] leading-5 text-courier-muted">{body}</p>{action && onAction && <button className="mt-5 text-[10px] font-semibold text-courier-green underline decoration-courier-line underline-offset-4 hover:decoration-courier-green" type="button" onClick={onAction}>{action} →</button>}</div>;
}

function RequestCard({ item, panel, loading, onMatches, onStartAgreement, onUpdate, onCancel, submitting }: { item: ItemRequest; panel?: MatchPanel; loading: boolean; onMatches: () => void; onStartAgreement: (matchId: string) => void; onUpdate: (event: FormEvent<HTMLFormElement>, item: ItemRequest) => void; onCancel: (id: string) => void; submitting: boolean }) {
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const editable = ["DRAFT", "OPEN", "MATCHED"].includes(item.status);
  return <article className="group border border-courier-line bg-white px-4 py-4 transition-colors hover:border-[#c6d4ca] sm:px-5 motion-safe:animate-enter">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="mb-1 font-display text-[22px] leading-tight tracking-[-.035em]">{item.title}</h3><p className="mb-0 text-[10px] text-courier-muted">{item.originName}, {item.originCountryCode} <span className="px-1.5 text-courier-gold">→</span> {item.destinationName}, {item.destinationCountryCode}</p></div><StatusTag status={item.status} /></div>
    {editing && <form className="mt-4 grid gap-3 border-y border-courier-line py-4 sm:grid-cols-2" onSubmit={(event) => { onUpdate(event, item); setEditing(false); }}>
      <label className={`${labelClass} sm:col-span-2`}>Item name<input className={fieldClass} name="title" maxLength={120} defaultValue={item.title} required /></label>
      <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={`${fieldClass} min-h-18 py-3`} name="description" maxLength={4000} defaultValue={item.description} required /></label>
      <label className={labelClass}>Item value<input className={fieldClass} name="itemCost" type="number" min="0" step="0.01" defaultValue={minorToMajorInput(item.itemCostMinor, item.currency)} required /></label>
      <label className={labelClass}>Currency<input className={fieldClass} name="currency" defaultValue={item.currency} minLength={3} maxLength={3} pattern="[A-Za-z]{3}" required /></label>
      <label className={labelClass}>Origin city<input className={fieldClass} name="originName" defaultValue={item.originName} required /></label>
      <label className={labelClass}>Origin country<input className={fieldClass} name="originCountryCode" defaultValue={item.originCountryCode} minLength={2} maxLength={2} pattern="[A-Za-z]{2}" required /></label>
      <label className={labelClass}>Destination city<input className={fieldClass} name="destinationName" defaultValue={item.destinationName} required /></label>
      <label className={labelClass}>Destination country<input className={fieldClass} name="destinationCountryCode" defaultValue={item.destinationCountryCode} minLength={2} maxLength={2} pattern="[A-Za-z]{2}" required /></label>
      <label className={labelClass}>Needed by<input className={fieldClass} name="neededBy" type="date" defaultValue={item.neededBy?.slice(0, 10) ?? ""} /></label>
      <div className="flex items-end gap-3"><button className="min-h-10.5 bg-courier-green px-4 text-[10px] font-semibold text-white disabled:opacity-60" type="submit" disabled={submitting}>Save changes</button><button className="min-h-10.5 border border-courier-line px-4 text-[10px] font-semibold text-courier-muted" type="button" onClick={() => setEditing(false)}>Keep as is</button></div>
    </form>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-3"><span className="text-[11px] font-semibold">{formatMoney(item.itemCostMinor, item.currency)} <span className="font-normal text-courier-muted">item value</span></span><div className="flex flex-wrap items-center gap-3"><span className="text-[10px] text-courier-muted">By {dateLabel(item.neededBy)}</span><button className="text-[10px] font-semibold text-courier-green underline decoration-courier-line underline-offset-4 hover:decoration-courier-green" type="button" onClick={onMatches}>{loading ? "Finding…" : panel ? "Refresh matches" : "Find a traveler"}</button>{editable && <button className="text-[10px] font-semibold text-courier-muted underline decoration-courier-line underline-offset-4 hover:text-courier-green" type="button" onClick={() => setEditing(!editing)}>{editing ? "Close edit" : "Edit"}</button>}{editable && <button className="text-[10px] font-semibold text-[#a33d31] underline decoration-[#ead4d0] underline-offset-4" type="button" onClick={() => setConfirmCancel(!confirmCancel)}>Cancel</button>}</div></div>
    {confirmCancel && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-courier-gold bg-[#fbfaf6] px-3 py-3 text-[10px]"><span>Close this request? You can’t reopen it once it’s cancelled.</span><span className="flex gap-3"><button className="text-courier-muted underline underline-offset-4" type="button" onClick={() => setConfirmCancel(false)}>Keep request</button><button className="font-semibold text-[#a33d31] underline underline-offset-4 disabled:opacity-60" type="button" disabled={submitting} onClick={() => onCancel(item.id)}>Confirm cancellation</button></span></div>}
    {panel && <div className="mt-4 space-y-2 border-t border-courier-line pt-4">{panel.matches.length === 0 ? <p className="mb-0 py-2 text-[11px] text-courier-muted">No route fits just yet. We’ll keep this request open while plans change.</p> : panel.matches.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 bg-[#f8faf8] px-3 py-3"><div><p className="mb-1 text-[11px] font-semibold">{match.itinerary?.traveler.displayName ?? "A Courier traveler"}</p><p className="mb-0 text-[10px] text-courier-muted">{match.itinerary?.originName} → {match.itinerary?.destinationName} · arrives {dateLabel(match.itinerary?.arrivalBy ?? null)}</p></div>{match.status === "INTERESTED" ? <button className="border border-courier-green px-3 py-2 text-[9px] font-semibold text-courier-green transition-colors hover:bg-white disabled:opacity-60" type="button" disabled={submitting} onClick={() => onStartAgreement(match.id)}>Start agreement</button> : <StatusTag status={match.status} />}</div>)}</div>}
  </article>;
}

function ItineraryCard({ item, panel, loading, onMatches, onRespond, onUpdate, onCancel, submitting }: { item: Itinerary; panel?: MatchPanel; loading: boolean; onMatches: () => void; onRespond: (matchId: string, itineraryId: string) => void; onUpdate: (event: FormEvent<HTMLFormElement>, item: Itinerary) => void; onCancel: (id: string) => void; submitting: boolean }) {
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const editable = item.status === "PLANNED";
  return <article className="group border border-courier-line bg-white px-4 py-4 transition-colors hover:border-[#c6d4ca] sm:px-5 motion-safe:animate-enter">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="mb-1 font-display text-[22px] leading-tight tracking-[-.035em]">{item.originName} <span className="text-courier-gold">→</span> {item.destinationName}</h3><p className="mb-0 text-[10px] text-courier-muted">{item.originCountryCode} · departs {dateLabel(item.departureAt)}</p></div><StatusTag status={item.status} /></div>
    {editing && <form className="mt-4 grid gap-3 border-y border-courier-line py-4 sm:grid-cols-2" onSubmit={(event) => { onUpdate(event, item); setEditing(false); }}>
      <label className={labelClass}>Origin city<input className={fieldClass} name="originName" defaultValue={item.originName} required /></label>
      <label className={labelClass}>Origin country<input className={fieldClass} name="originCountryCode" defaultValue={item.originCountryCode} minLength={2} maxLength={2} pattern="[A-Za-z]{2}" required /></label>
      <label className={labelClass}>Destination city<input className={fieldClass} name="destinationName" defaultValue={item.destinationName} required /></label>
      <label className={labelClass}>Destination country<input className={fieldClass} name="destinationCountryCode" defaultValue={item.destinationCountryCode} minLength={2} maxLength={2} pattern="[A-Za-z]{2}" required /></label>
      <label className={labelClass}>Departure<input className={fieldClass} name="departureAt" type="datetime-local" defaultValue={toLocalDateTimeInput(item.departureAt)} required /></label>
      <label className={labelClass}>Arrival<input className={fieldClass} name="arrivalBy" type="datetime-local" defaultValue={toLocalDateTimeInput(item.arrivalBy)} required /></label>
      <label className={`${labelClass} sm:col-span-2`}>Stops along your route · optional<textarea className={`${fieldClass} min-h-19 py-3`} name="routeStopsText" maxLength={4000} defaultValue={(item.routeStops ?? []).map(({ name, countryCode }) => `${name}, ${countryCode}`).join("\n")} placeholder={"Ibadan, NG\nAccra, GH"} /><span className="mt-1.5 block text-[9px] font-normal normal-case tracking-normal text-courier-muted">One city per line, followed by its country code.</span></label>
      <div className="flex items-end gap-3 sm:col-span-2"><button className="min-h-10.5 bg-courier-green px-4 text-[10px] font-semibold text-white disabled:opacity-60" type="submit" disabled={submitting}>Save route</button><button className="min-h-10.5 border border-courier-line px-4 text-[10px] font-semibold text-courier-muted" type="button" onClick={() => setEditing(false)}>Keep as is</button></div>
    </form>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-courier-line pt-3"><span className="text-[10px] text-courier-muted">Arriving by {dateLabel(item.arrivalBy)}</span><div className="flex flex-wrap items-center gap-3"><button className="text-[10px] font-semibold text-courier-green underline decoration-courier-line underline-offset-4 hover:decoration-courier-green" type="button" onClick={onMatches}>{loading ? "Finding…" : panel ? "Refresh requests" : "See requests along the way"}</button>{editable && <button className="text-[10px] font-semibold text-courier-muted underline decoration-courier-line underline-offset-4 hover:text-courier-green" type="button" onClick={() => setEditing(!editing)}>{editing ? "Close edit" : "Edit"}</button>}{editable && <button className="text-[10px] font-semibold text-[#a33d31] underline decoration-[#ead4d0] underline-offset-4" type="button" onClick={() => setConfirmCancel(!confirmCancel)}>Cancel</button>}</div></div>
    {confirmCancel && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-courier-gold bg-[#fbfaf6] px-3 py-3 text-[10px]"><span>Cancel this route? Any open match responses will expire.</span><span className="flex gap-3"><button className="text-courier-muted underline underline-offset-4" type="button" onClick={() => setConfirmCancel(false)}>Keep route</button><button className="font-semibold text-[#a33d31] underline underline-offset-4 disabled:opacity-60" type="button" disabled={submitting} onClick={() => onCancel(item.id)}>Confirm cancellation</button></span></div>}
    {panel && <div className="mt-4 space-y-2 border-t border-courier-line pt-4">{panel.matches.length === 0 ? <p className="mb-0 py-2 text-[11px] text-courier-muted">No requests line up with this route yet. Check back as new journeys are shared.</p> : panel.matches.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 bg-[#f8faf8] px-3 py-3"><div><p className="mb-1 text-[11px] font-semibold">{match.request?.title ?? "A request along your route"}</p><p className="mb-0 text-[10px] text-courier-muted">{match.request?.requester.displayName ?? "Courier requester"} · {match.request?.originName} → {match.request?.destinationName}</p></div>{match.status === "CANDIDATE" ? <button className="border border-courier-green px-3 py-2 text-[9px] font-semibold text-courier-green transition-colors hover:bg-white disabled:opacity-60" type="button" disabled={submitting} onClick={() => onRespond(match.id, item.id)}>I can carry this</button> : <StatusTag status={match.status} />}</div>)}</div>}
  </article>;
}

function AgreementCard({ agreement, userId, onPropose, onAccept, onCancel, onBeginHandoff, onConfirmDelivery, onReportIssue, submitting }: { agreement: Agreement; userId: string; onPropose: (event: FormEvent<HTMLFormElement>, agreement: Agreement) => void; onAccept: (agreementId: string, revisionId: string) => void; onCancel: (agreementId: string) => void; onBeginHandoff: (agreementId: string) => void; onConfirmDelivery: (agreementId: string) => void; onReportIssue: (agreementId: string, reason: string) => void; submitting: boolean }) {
  const isTraveler = agreement.travelerId === userId;
  const latestTerms = agreement.termsRevisions[0];
  const canEdit = ["DRAFT", "AWAITING_ACCEPTANCE", "ACCEPTED"].includes(agreement.status);
  return <article className="group border border-courier-line bg-white p-4 transition-colors hover:border-[#c6d4ca] sm:p-5 motion-safe:animate-enter">
    <div className="flex items-start justify-between gap-3"><div><p className="mb-2 text-[9px] font-bold uppercase tracking-[.14em] text-courier-gold">{isTraveler ? "You’re carrying" : "You’re waiting for"}</p><h3 className="mb-1 font-display text-[23px] leading-tight tracking-[-.04em]">{agreement.match.request.title}</h3><p className="mb-0 text-[10px] text-courier-muted">{agreement.match.itinerary.originName} → {agreement.match.itinerary.destinationName}</p></div><StatusTag status={agreement.status} /></div>
    {latestTerms ? <div className="mt-5 border-y border-courier-line py-4"><div className="flex items-center justify-between text-[10px] text-courier-muted"><span>Item value</span><strong className="font-medium text-courier-ink">{formatMoney(agreement.match.request.itemCostMinor, agreement.match.request.currency)}</strong></div><div className="mt-2 flex items-center justify-between text-[10px] text-courier-muted"><span>Delivery fee</span><strong className="font-medium text-courier-ink">{formatMoney(latestTerms.deliveryFeeMinor, latestTerms.currency)}</strong></div><div className="mt-3 flex items-center justify-between border-t border-dashed border-courier-line pt-3 text-[10px] font-bold uppercase tracking-widest"><span>Total agreed</span><strong className="font-semibold">{formatMoney(latestTerms.totalMinor, latestTerms.currency)}</strong></div><p className="mb-0 mt-3 text-[10px] leading-5 text-courier-muted">{latestTerms.handoffDetails?.suggestedMeetup ? `Meetup suggestion: ${latestTerms.handoffDetails.suggestedMeetup}. ` : ""}{latestTerms.handoffDetails?.notes ?? "No handoff note yet."}</p></div> : <div className="mt-5 border-y border-courier-line py-4"><p className="mb-0 text-[11px] leading-5 text-courier-muted">{isTraveler ? "Propose a delivery fee and practical handoff details for the requester to review." : "The traveler is preparing a delivery fee and handoff proposal."}</p></div>}
    {isTraveler && canEdit && <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => onPropose(event, agreement)}><label className={labelClass}>Delivery fee · {agreement.match.request.currency}<input className={fieldClass} name="deliveryFee" type="number" min="0" step="0.01" placeholder="0.00" required /></label><label className={labelClass}>Suggested meetup · optional<input className={fieldClass} name="meetup" maxLength={300} placeholder="A public place near the station" /></label><label className={`${labelClass} sm:col-span-2`}>Handoff note<textarea className={`${fieldClass} min-h-17.5 py-3`} name="handoffNotes" maxLength={1000} placeholder="Share a practical note for arranging the handoff." required /></label><div className="sm:col-span-2"><button className="min-h-10.5 bg-courier-green px-4 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:opacity-60" type="submit" disabled={submitting}>Send terms for review</button></div></form>}
    {!isTraveler && latestTerms?.status === "PROPOSED" && canEdit && <button className="mt-4 min-h-10.5 bg-courier-green px-4 text-[10px] font-semibold text-white transition-colors hover:bg-courier-green-deep disabled:opacity-60" type="button" disabled={submitting} onClick={() => onAccept(agreement.id, latestTerms.id)}>Accept these terms</button>}
    {agreement.status === "ACCEPTED" && <p className="mb-0 mt-4 border-l-2 border-courier-gold pl-3 text-[10px] leading-5 text-courier-muted">Terms are agreed. Payment setup will appear here after Courier connects a payment provider.</p>}
    {canEdit && <button className="ml-4 mt-4 text-[9px] font-semibold uppercase tracking-widest text-courier-muted underline decoration-courier-line underline-offset-4 hover:text-[#a33d31] hover:decoration-[#a33d31] disabled:opacity-60" type="button" disabled={submitting} onClick={() => onCancel(agreement.id)}>Cancel agreement</button>}
    <AgreementLifecycle
      agreement={agreement}
      isTraveler={isTraveler}
      submitting={submitting}
      onBeginHandoff={() => onBeginHandoff(agreement.id)}
      onConfirmDelivery={() => onConfirmDelivery(agreement.id)}
      onReportIssue={(reason) => onReportIssue(agreement.id, reason)}
    />
  </article>;
}
