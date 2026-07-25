export interface PricingModel {
  value: string;
  label: string;
  unit: string;
  description: string;
}

export const PRICING_MODELS: PricingModel[] = [
  { value: "fixed_price", label: "Fixed Price", unit: "", description: "One total price for the entire job" },
  { value: "per_minute", label: "Per Minute", unit: "min", description: "Charged per minute" },
  { value: "per_hour", label: "Per Hour", unit: "hr", description: "Charged per hour" },
  { value: "per_half_day", label: "Per Half Day", unit: "½ day", description: "Charged per half day (4 hrs)" },
  { value: "per_day", label: "Per Day", unit: "day", description: "Charged per day" },
  { value: "per_week", label: "Per Week", unit: "week", description: "Charged per week" },
  { value: "per_month", label: "Per Month", unit: "month", description: "Charged per month" },
  { value: "per_year", label: "Per Year", unit: "year", description: "Charged per year" },
  { value: "per_visit", label: "Per Visit", unit: "visit", description: "Charged per site/client visit" },
  { value: "per_session", label: "Per Session", unit: "session", description: "Charged per session" },
  { value: "per_consultation", label: "Per Consultation", unit: "consult", description: "Charged per consultation" },
  { value: "per_km", label: "Per Kilometer", unit: "km", description: "Charged per kilometre travelled" },
  { value: "per_meter", label: "Per Meter", unit: "m", description: "Charged per linear metre" },
  { value: "per_sqm", label: "Per Square Meter", unit: "m²", description: "Charged per square metre" },
  { value: "per_cbm", label: "Per Cubic Meter", unit: "m³", description: "Charged per cubic metre" },
  { value: "per_kg", label: "Per Kilogram", unit: "kg", description: "Charged per kilogram" },
  { value: "per_tonne", label: "Per Tonne", unit: "t", description: "Charged per tonne" },
  { value: "per_litre", label: "Per Litre", unit: "L", description: "Charged per litre" },
  { value: "per_item", label: "Per Item", unit: "item", description: "Charged per individual item" },
  { value: "per_room", label: "Per Room", unit: "room", description: "Charged per room" },
  { value: "per_person", label: "Per Person", unit: "person", description: "Charged per person" },
  { value: "per_bed", label: "Per Bed", unit: "bed", description: "Charged per bed" },
  { value: "per_tree", label: "Per Tree", unit: "tree", description: "Charged per tree" },
  { value: "per_animal", label: "Per Animal", unit: "animal", description: "Charged per animal" },
  { value: "per_load", label: "Per Load", unit: "load", description: "Charged per load" },
  { value: "per_trip", label: "Per Trip", unit: "trip", description: "Charged per trip" },
  { value: "per_page", label: "Per Page", unit: "page", description: "Charged per page" },
  { value: "per_document", label: "Per Document", unit: "doc", description: "Charged per document" },
  { value: "per_project", label: "Per Project", unit: "project", description: "Charged per project" },
  { value: "custom", label: "Custom", unit: "unit", description: "Custom pricing unit" },
];

export function getPricingModel(value: string): PricingModel {
  return PRICING_MODELS.find((m) => m.value === value) ?? PRICING_MODELS[0];
}

export const REQUEST_TYPES = [
  {
    value: "professional_service",
    label: "Professional Service",
    description: "Get quotes from qualified providers",
    examples: "Construction, Plumbing, Legal, Tutoring, Consulting",
    workflow: "Post Request → Receive Quotes → Accept → Work Begins → Pay → Review",
    icon: "Briefcase",
  },
  {
    value: "listing_rental",
    label: "Listing & Rental",
    description: "Browse and book available properties or equipment",
    examples: "House Rentals, Car Hire, Equipment, Office Space, Warehouses",
    workflow: "Owner Lists → Client Browses → Books → Pays → Reviews",
    icon: "Building2",
  },
  {
    value: "bookable_service",
    label: "Bookable Service",
    description: "Book a published service package directly",
    examples: "Airport Transfers, Cleaning, Photography, Tours, Salon",
    workflow: "Provider Publishes → Client Books → Pays → Done → Reviews",
    icon: "CalendarCheck",
  },
] as const;

export type RequestTypeValue = (typeof REQUEST_TYPES)[number]["value"];

export function formatRole(role: string): string {
  switch (role) {
    case "customer": return "Client";
    case "professional": return "Provider";
    case "admin": return "Admin";
    default: return role;
  }
}

export function formatRequestType(type: string): string {
  const found = REQUEST_TYPES.find((t) => t.value === type);
  return found?.label ?? "Professional Service";
}
