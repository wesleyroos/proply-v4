import type { ProsprProperty } from "./types";

const STATUS_MAP: Record<string, string> = {
  active: "Active",
  under_offer: "Under Offer",
  sold: "Sold",
  withdrawn: "Withdrawn",
};

const PROPERTY_TYPE_MAP: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  townhouse: "Townhouse",
  penthouse: "Penthouse",
  land: "Land",
  commercial: "Commercial",
  office: "Office",
  farm: "Farm",
  industrial: "Industrial",
};

export function mapProsprToListing(property: ProsprProperty, branchId: number) {
  return {
    propdataId: property.id,
    branchId,
    provider: "Prospr" as const,
    status: STATUS_MAP[property.status] ?? property.status,
    listingData: property as unknown as Record<string, unknown>,
    title: property.title,
    address: property.address ?? property.area ?? "Unknown",
    price: (property.price ?? 0).toString(),
    priceText: property.price_text ?? null,
    propertyType: PROPERTY_TYPE_MAP[property.property_type] ?? property.property_type,
    bedrooms: property.bedrooms.toString(),
    bathrooms: property.bathrooms.toString(),
    parkingSpaces: property.parking ?? null,
    floorSize: property.size_sqm ?? null,
    landSize: property.erf_sqm ?? null,
    location: {
      latitude: property.lat ?? null,
      longitude: property.lng ?? null,
      suburb: property.area ?? null,
      city: null,
      province: null,
    },
    features: property.features ?? [],
    images: property.photos ?? [],
    agentId: null,
    agentName: property.agent_name ?? null,
    agentEmail: property.agent_email ?? null,
    agentPhone: property.agent_phone ?? null,
    monthlyLevy: property.levies ? property.levies.toString() : null,
    ratesAndTaxes: property.rates_and_taxes ? property.rates_and_taxes.toString() : null,
    strMonthlyRevenue: property.str_monthly_revenue ? property.str_monthly_revenue.toString() : null,
    strAnnualRevenue: property.str_annual_revenue ? property.str_annual_revenue.toString() : null,
    strOccupancyRate: property.str_occupancy_rate ? property.str_occupancy_rate.toString() : null,
    strAvgDailyRate: property.str_avg_daily_rate ? property.str_avg_daily_rate.toString() : null,
    ltrMonthlyRent: property.ltr_monthly_rent ? property.ltr_monthly_rent.toString() : null,
    ltrAnnualRent: property.ltr_annual_rent ? property.ltr_annual_rent.toString() : null,
    lastModified: new Date(property.updated_at),
    listingDate: new Date(property.created_at),
    updatedAt: new Date(),
  };
}
