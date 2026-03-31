export interface ProsprProperty {
  id: string; // UUID
  slug: string;
  title: string;
  property_type: "house" | "apartment" | "townhouse" | "penthouse" | "land" | "commercial" | "office" | "farm" | "industrial";
  status: "active" | "under_offer" | "sold" | "withdrawn";
  area: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  size_sqm: number | null;
  erf_sqm: number | null;
  price: number | null;
  price_text: string | null;
  levies: number | null;
  rates_and_taxes: number | null;
  str_monthly_revenue: number | null;
  str_annual_revenue: number | null;
  str_occupancy_rate: number | null;
  str_avg_daily_rate: number | null;
  ltr_monthly_rent: number | null;
  ltr_annual_rent: number | null;
  description: string | null;
  features: string[];
  photos: string[];
  agent_name: string | null;
  agent_email: string | null;
  agent_phone: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface ProsprPagination {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface ProsprPaginatedResponse<T> {
  data: T[];
  pagination: ProsprPagination;
}

export interface ProsprListingsOptions {
  page?: number;
  limit?: number;
  updated_since?: string; // ISO 8601
}

export interface ProsprEnrichmentPayload {
  property_id: string;
  valuation?: {
    estimated_value: number;
    confidence?: string;
    valuation_date?: string;
    methodology?: string;
    [key: string]: unknown;
  };
  comparable_sales?: Array<{
    address: string;
    price: number;
    sale_date: string;
    size_sqm?: number;
    bedrooms?: number;
    [key: string]: unknown;
  }>;
  market_trends?: {
    area?: string;
    avg_price_sqm?: number;
    median_price?: number;
    yoy_change_pct?: number;
    avg_days_on_market?: number;
    inventory_count?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
