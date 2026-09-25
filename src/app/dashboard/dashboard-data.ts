export type ItemRequest = {
    id: string; title: string; description: string; itemCostMinor: number; currency: string;
    originName: string; originCountryCode: string; destinationName: string; destinationCountryCode: string;
    neededBy: string | null; status: string;
};

export type Itinerary = {
    id: string; originName: string; originCountryCode: string; destinationName: string; destinationCountryCode: string;
    departureAt: string; arrivalBy: string; routeStops: Array<{ name: string; countryCode: string }> | null; status: string;
};

export type Match = {
    id: string; status: string; score: number | string | null;
    itinerary?: { originName: string; destinationName: string; arrivalBy: string; traveler: { displayName: string } };
    request?: { title: string; originName: string; destinationName: string; neededBy: string | null; requester: { displayName: string } };
};

export type MatchPanel = { matches: Match[]; matchingStatus: string };

export type MatchSummary = {
    id: string;
    status: string;
    score: number | string | null;
};

export type MatchingRequest = MatchSummary & {
    request: {
        id: string; title: string; itemCostMinor: number; currency: string;
        originName: string; originCountryCode: string;
        destinationName: string; destinationCountryCode: string;
        neededBy: string | null; status: string;
        requester: { displayName: string };
    };
};

export type MatchingJourney = MatchSummary & {
    itinerary: {
        id: string; originName: string; originCountryCode: string;
        destinationName: string; destinationCountryCode: string;
        departureAt: string; arrivalBy: string; status: string;
        traveler: { displayName: string };
    };
};

export type TripMatchGroup = {
    itinerary: {
        id: string; originName: string; originCountryCode: string;
        destinationName: string; destinationCountryCode: string;
        departureAt: string; arrivalBy: string; status: string;
    };
    matches: MatchingRequest[];
};

export type RequestMatchGroup = {
    request: {
        id: string; title: string; itemCostMinor: number; currency: string;
        originName: string; originCountryCode: string;
        destinationName: string; destinationCountryCode: string;
        neededBy: string | null; status: string;
    };
    matches: MatchingJourney[];
};
export type TermsRevision = {
    id: string; revision: number; deliveryFeeMinor: number; totalMinor: number; currency: string; status: string;
    handoffDetails: { notes?: string; suggestedMeetup?: string | null } | null;
};
export type AgreementPayment = {
    id: string; amountMinor: number; currency: string; status: string; authorizedAt: string | null;
    capturedAt: string | null; releasedAt: string | null;
};
export type Agreement = {
    id: string; requesterId: string; travelerId: string; status: string; payments: AgreementPayment[];
    deliveryConfirmation: { id: string; requesterId: string; confirmedAt: string; note: string | null } | null;
    dispute: { id: string; status: string; reason: string; resolutionNote: string | null; createdAt: string; resolvedAt: string | null } | null;
    match: {
        request: { title: string; description: string; itemCostMinor: number; currency: string };
        itinerary: { originName: string; destinationName: string; arrivalBy: string };
    };
    termsRevisions: TermsRevision[];
};

export type ApiErrorDetail = { path: Array<string | number>; message: string; code?: string };

export class ApiRequestError extends Error {
    constructor(message: string, readonly code: string, readonly details: ApiErrorDetail[] = []) {
        super(message);
        this.name = "ApiRequestError";
    }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        cache: "no-store",
        headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
    });
    const payload = (await response.json().catch(() => null)) as {
        data?: T;
        error?: { code?: string; message?: string; details?: ApiErrorDetail[] };
    } | null;

    if (!response.ok) {
        throw new ApiRequestError(
            payload?.error?.message ?? "Courier could not complete that request.",
            payload?.error?.code ?? "INTERNAL_ERROR",
            Array.isArray(payload?.error?.details) ? payload.error.details : [],
        );
    }
    return payload?.data as T;
}

export function validationFieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof ApiRequestError)) return {};
    const fields: Record<string, string> = {};
    for (const detail of error.details) {
        const key = detail.path.map(String).join(".");
        if (key && !(key in fields)) fields[key] = detail.message;
    }
    return fields;
}

export function formatMoney(minor: number, currency: string) {
    try {
        const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
        return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 10 ** digits);
    } catch {
        return `${currency} ${(minor / 100).toFixed(2)}`;
    }
}

export function moneyToMinor(value: string, currency: string) {
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

export function minorToMajorInput(minor: number, currency: string) {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return (minor / 10 ** digits).toFixed(digits);
}

export function dateLabel(value: string | null) {
    if (!value) return "No date set";
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function statusLabel(status: string) {
    return status.toLowerCase().replaceAll("_", " ");
}

export function fitPercent(score: number | string | null) {
    const value = Number(score);
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100);
}

export function toLocalDateTimeInput(value: string) {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function parseRouteStops(value: string) {
    const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length > 20) throw new Error("You can add up to 20 route stops.");
    return lines.map((line) => {
        const separator = line.lastIndexOf(",");
        if (separator < 1) throw new Error("Write each stop as a city followed by a two-letter country code, for example Ibadan, NG.");
        const name = line.slice(0, separator).trim();
        const countryCode = line.slice(separator + 1).trim().toUpperCase();
        if (!name || !/^[A-Z]{2}$/.test(countryCode)) throw new Error("Write each stop as a city followed by a two-letter country code, for example Ibadan, NG.");
        return { name, countryCode };
    });
}
