import axios, { AxiosInstance } from "axios";
import type {
  ProsprListingsOptions,
  ProsprPaginatedResponse,
  ProsprProperty,
  ProsprEnrichmentPayload,
} from "./types";

const DEFAULT_BASE_URL = "https://prospr.realestate/api/v1";
const RATE_LIMIT_PER_MINUTE = 100;
const MIN_REQUEST_INTERVAL_MS = Math.ceil((60 * 1000) / RATE_LIMIT_PER_MINUTE); // ~600ms

export class ProsprClient {
  private client: AxiosInstance;
  private lastRequestAt = 0;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl || DEFAULT_BASE_URL,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30_000,
    });
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    this.lastRequestAt = Date.now();
  }

  async fetchProperties(
    options: ProsprListingsOptions = {}
  ): Promise<ProsprPaginatedResponse<ProsprProperty>> {
    await this.throttle();
    const params: Record<string, string | number> = {
      page: options.page ?? 1,
      limit: Math.min(options.limit ?? 20, 100),
    };
    if (options.updated_since) {
      params.updated_since = options.updated_since;
    }
    const { data } = await this.client.get<ProsprPaginatedResponse<ProsprProperty>>(
      "/properties",
      { params }
    );
    return data;
  }

  async fetchAllProperties(
    options: ProsprListingsOptions = {},
    maxPages = 10
  ): Promise<ProsprProperty[]> {
    const allProperties: ProsprProperty[] = [];
    let page = 1;

    while (page <= maxPages) {
      const response = await this.fetchProperties({ ...options, page, limit: 100 });
      allProperties.push(...response.data);
      if (!response.pagination.has_more) break;
      page++;
    }

    return allProperties;
  }

  async fetchPropertyById(id: string): Promise<ProsprProperty | null> {
    await this.throttle();
    try {
      const { data } = await this.client.get<{ data: ProsprProperty }>(`/properties/${id}`);
      return data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  }

  async pushEnrichment(payload: ProsprEnrichmentPayload): Promise<void> {
    await this.throttle();
    await this.client.post("/webhooks/property-enrichment", payload);
  }

  /** Validate the API key by fetching 1 property. Throws on auth failure. */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.fetchProperties({ limit: 1 });
      return true;
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) return false;
      throw err;
    }
  }
}
