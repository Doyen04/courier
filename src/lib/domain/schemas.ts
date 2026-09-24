import { z } from "zod";

const shortText = (max: number) => z.string().trim().min(1).max(max);
const countryCode = z.string().trim().regex(/^[A-Za-z]{2}$/).transform((v) => v.toUpperCase());
const currencyCode = z.string().trim().regex(/^[A-Za-z]{3}$/).transform((v) => v.toUpperCase());
const coordinate = z.number().finite();

const createItemRequestShape = {
  title: shortText(120),
  description: shortText(4000),
  itemCostMinor: z.number().int().min(0).max(2_000_000_000),
  currency: currencyCode,
  originName: shortText(180),
  originCountryCode: countryCode,
  originLatitude: coordinate.min(-90).max(90).optional(),
  originLongitude: coordinate.min(-180).max(180).optional(),
  destinationName: shortText(180),
  destinationCountryCode: countryCode,
  destinationLatitude: coordinate.min(-90).max(90).optional(),
  destinationLongitude: coordinate.min(-180).max(180).optional(),
  neededBy: z.iso.date().optional(),
};

function coordinatesArePaired(
  source: object,
  side: "origin" | "destination",
) {
  const value = source as Record<string, unknown>;
  return (
    (value[`${side}Latitude`] === undefined) ===
    (value[`${side}Longitude`] === undefined)
  );
}

export const createItemRequestSchema = z
  .object(createItemRequestShape)
  .strict()
  .refine(
    (value) => coordinatesArePaired(value, "origin") && coordinatesArePaired(value, "destination"),
    {
      message: "Provide both coordinates for a location, or leave both blank.",
      path: ["originLatitude"],
    },
  );

export const updateItemRequestSchema = z
  .object({
    ...createItemRequestShape,
    neededBy: z.iso.date().nullable().optional(),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const routeStopSchema = z
  .object({
    name: shortText(180),
    countryCode,
    latitude: coordinate.min(-90).max(90).optional(),
    longitude: coordinate.min(-180).max(180).optional(),
  })
  .strict()
  .refine(
    (value) => (value.latitude === undefined) === (value.longitude === undefined),
    { message: "Provide both coordinates for a stop, or leave both blank.", path: ["latitude"] },
  );

const itineraryFields = {
  originName: shortText(180),
  originCountryCode: countryCode,
  originLatitude: coordinate.min(-90).max(90).optional(),
  originLongitude: coordinate.min(-180).max(180).optional(),
  destinationName: shortText(180),
  destinationCountryCode: countryCode,
  destinationLatitude: coordinate.min(-90).max(90).optional(),
  destinationLongitude: coordinate.min(-180).max(180).optional(),
  routeStops: z.array(routeStopSchema).max(20).optional(),
  departureAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  arrivalBy: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
};

export const createItinerarySchema = z
  .object(itineraryFields)
  .strict()
  .refine((value) => value.departureAt >= new Date(), {
    message: "Departure must be in the future.",
    path: ["departureAt"],
  })
  .refine((value) => value.arrivalBy > value.departureAt, {
    message: "Arrival must be after departure.",
    path: ["arrivalBy"],
  })
  .refine(
    (value) => coordinatesArePaired(value, "origin") && coordinatesArePaired(value, "destination"),
    {
      message: "Provide both coordinates for a location, or leave both blank.",
      path: ["originLatitude"],
    },
  );

export const updateItinerarySchema = z
  .object(itineraryFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  })
  .refine(
    (value) =>
      !value.arrivalBy || !value.departureAt || value.arrivalBy > value.departureAt,
    {
      message: "Arrival must be after departure when both dates are updated.",
      path: ["arrivalBy"],
    },
  );

const pagingFields = {
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.uuid().optional(),
};

export const requestListQuerySchema = z.object({
  ...pagingFields,
  status: z.enum(["DRAFT", "OPEN", "MATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED"]).optional(),
});

export const itineraryListQuerySchema = z.object({
  ...pagingFields,
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const uuidSchema = z.uuid();
