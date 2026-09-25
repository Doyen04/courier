"use client";

import { toLocalDateTimeInput, type Itinerary } from "../../dashboard-data";
import { fieldClass, FieldError, labelClass } from "../../workspace-ui";

export function JourneyFields({
    item,
    errors = {},
}: {
    item?: Itinerary;
    errors?: Record<string, string>;
}) {
    const inputClass = (name: string) =>
        errors[name] ? `${fieldClass} border-[#e0b4ae]` : fieldClass;
    return (
        <>
            <label className={labelClass}>
                Origin city
                <input
                    className={inputClass("originName")}
                    name="originName"
                    defaultValue={item?.originName}
                    placeholder="Lagos"
                    aria-invalid={Boolean(errors.originName)}
                    required
                />
                <FieldError message={errors.originName} />
            </label>
            <label className={labelClass}>
                Origin country
                <input
                    className={inputClass("originCountryCode")}
                    name="originCountryCode"
                    defaultValue={item?.originCountryCode}
                    minLength={2}
                    maxLength={2}
                    pattern="[A-Za-z]{2}"
                    placeholder="NG"
                    aria-invalid={Boolean(errors.originCountryCode)}
                    required
                />
                <FieldError message={errors.originCountryCode} />
            </label>
            <label className={labelClass}>
                Destination city
                <input
                    className={inputClass("destinationName")}
                    name="destinationName"
                    defaultValue={item?.destinationName}
                    placeholder="London"
                    aria-invalid={Boolean(errors.destinationName)}
                    required
                />
                <FieldError message={errors.destinationName} />
            </label>
            <label className={labelClass}>
                Destination country
                <input
                    className={inputClass("destinationCountryCode")}
                    name="destinationCountryCode"
                    defaultValue={item?.destinationCountryCode}
                    minLength={2}
                    maxLength={2}
                    pattern="[A-Za-z]{2}"
                    placeholder="GB"
                    aria-invalid={Boolean(errors.destinationCountryCode)}
                    required
                />
                <FieldError message={errors.destinationCountryCode} />
            </label>
            <label className={labelClass}>
                Departure date and time
                <input
                    className={inputClass("departureAt")}
                    name="departureAt"
                    type="datetime-local"
                    defaultValue={
                        item ? toLocalDateTimeInput(item.departureAt) : undefined
                    }
                    aria-invalid={Boolean(errors.departureAt)}
                    required
                />
                <FieldError message={errors.departureAt} />
            </label>
            <label className={labelClass}>
                Arrival date and time
                <input
                    className={inputClass("arrivalBy")}
                    name="arrivalBy"
                    type="datetime-local"
                    defaultValue={item ? toLocalDateTimeInput(item.arrivalBy) : undefined}
                    aria-invalid={Boolean(errors.arrivalBy)}
                    required
                />
                <FieldError message={errors.arrivalBy} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
                Stops along the route · optional
                <textarea
                    className={`${inputClass("routeStopsText")} min-h-20 py-3`}
                    name="routeStopsText"
                    defaultValue={item?.routeStops
                        ?.map(({ name, countryCode }) => `${name}, ${countryCode}`)
                        .join("\n")}
                    placeholder={"Ibadan, NG\nAccra, GH"}
                    aria-invalid={Boolean(errors.routeStopsText)}
                />
                <span className="mt-1 block font-normal text-courier-muted">
                    One city per line, followed by its two-letter country code.
                </span>
                <FieldError message={errors.routeStopsText} />
            </label>
        </>
    );
}
