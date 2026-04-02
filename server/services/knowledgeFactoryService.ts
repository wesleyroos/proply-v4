/**
 * Knowledge Factory API Service
 * Fetches title deed / comparable sales data via the kf-proxy.fly.dev proxy,
 * which routes requests through a whitelisted South African IP address.
 */

import fetch from 'node-fetch';
import { db } from '../../db';
import { systemSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';

const PROXY_BASE_URL = 'https://kf-proxy.fly.dev';
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Cache the KF mode setting for 60s to avoid a DB hit on every request
let modeCacheValue: 'dev' | 'prod' = 'dev';
let modeCacheExpiry = 0;

async function getMode(): Promise<'dev' | 'prod'> {
  if (Date.now() < modeCacheExpiry) return modeCacheValue;
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'knowledge_factory_mode'),
    });
    modeCacheValue = setting?.value === 'prod' ? 'prod' : 'dev';
  } catch {
    modeCacheValue = 'dev'; // Safe default on DB error
  }
  modeCacheExpiry = Date.now() + 60_000;
  return modeCacheValue;
}

export interface KnowledgeFactoryAVM {
  PropertyId: number;
  PredictionLow: number;
  Prediction: number;
  PredictionHigh: number;
  Safety: number;
  Confidence: number;
}

export interface KnowledgeFactoryProperty {
  propertyId: number;
  address: string;
  suburb: string;
  salePrice: number;
  size: number;
  pricePerSqM: number;
  saleDate: string;
  distanceKM: number;
  titleDeedNo: string;
  propertyType?: string;
  buyerName?: string;
  sellerName?: string;
  latitude?: number;
  longitude?: number;
}

// Token cache — Knowledge Factory tokens expire after 2 hours.
// When the mode is toggled, clear this so the next call re-authenticates.
let tokenCache: { token: string; expiresAt: Date; mode: string } | null = null;

async function getAuthToken(): Promise<string> {
  const mode = await getMode();

  // Invalidate token if mode has changed
  if (tokenCache && tokenCache.mode !== mode) {
    tokenCache = null;
  }

  if (tokenCache && tokenCache.expiresAt > new Date()) {
    return tokenCache.token;
  }

  // The proxy reads credentials from its own Fly.io secrets based on ?mode=
  // We only need to tell it which mode to use — no credentials required here.
  const response = await fetch(`${PROXY_BASE_URL}/login?mode=${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Knowledge Factory auth failed: ${response.status} ${text.substring(0, 200)}`);
  }

  const data = await response.json() as any;
  if (!data.token) {
    throw new Error('Knowledge Factory auth response missing token');
  }

  // Cache for slightly less than the 2-hour expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 115);
  tokenCache = { token: data.token, expiresAt, mode };

  return data.token;
}

/**
 * Fetch the 15 closest recent title deed sales for a given coordinate pair.
 * Pass propertyType as a KF code: S (sectional title), F (freehold), A (agricultural),
 * C (gated community), H (agricultural holding), or omit for all types.
 */
export async function getComparableSalesByCoordinates(
  coordinates: { latitude: number; longitude: number },
  propertyType?: string
): Promise<KnowledgeFactoryProperty[]> {
  try {
    const token = await getAuthToken();
    const mode = await getMode();

    const response = await fetch(
      `${PROXY_BASE_URL}/closest-sales-coordinates?token=${encodeURIComponent(token)}&mode=${mode}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: coordinates.longitude, // KF uses x = longitude
          y: coordinates.latitude,  // KF uses y = latitude
          propertyType: propertyType || 'All',
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 403) {
        console.warn('Knowledge Factory: 403 Forbidden — proxy IP may not be whitelisted');
        return [];
      }
      throw new Error(`Knowledge Factory request failed: ${response.status} ${text.substring(0, 200)}`);
    }

    const data = await response.json() as any[];

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const properties: KnowledgeFactoryProperty[] = data.map((prop: any) => ({
      propertyId: prop.propertyId,
      address: prop.streetAddress,
      suburb: prop.suburb,
      salePrice: prop.purchaseAmount,
      size: prop.sqm,
      pricePerSqM: prop.sqm > 0 ? Math.round(prop.purchaseAmount / prop.sqm) : 0,
      saleDate: prop.dateRegister,
      distanceKM: prop.distanceKm,
      titleDeedNo: prop.titleDeedNoNEW,
      propertyType: prop.propertyType,
      buyerName: prop.buyerName,
      sellerName: prop.sellerName,
      latitude: prop.y,
      longitude: prop.x,
    }));

    // Sort most recent first
    return properties.sort((a, b) => {
      return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('403') || message.toLowerCase().includes('forbidden')) {
      console.warn('Knowledge Factory: access restricted — returning empty result');
      return [];
    }
    console.error('Knowledge Factory error:', message);
    throw error;
  }
}

// Map common property type labels to Knowledge Factory single-letter codes
const PROPERTY_TYPE_CODES: Record<string, string> = {
  sectional_title: 'S', apartment: 'S', flat: 'S',
  house: 'F', freehold: 'F', townhouse: 'F',
  farm: 'A', agricultural: 'A',
  agricultural_holding: 'H',
  gated_community: 'C',
};

/**
 * Get an Automated Valuation Model (AVM) estimate from Knowledge Factory.
 * - propertyType: any common label (e.g. "sectional_title", "house") or KF code (S/F/A/C/H)
 * - erfSize: floor area in m² for sectional title, erf size for freehold
 * Returns null if the property has no AVM data or on any error (safe to ignore).
 */
export async function getPropertyAVM(
  coordinates: { latitude: number; longitude: number },
  propertyType: string,
  erfSize: number
): Promise<KnowledgeFactoryAVM | null> {
  if (!erfSize || erfSize <= 0) return null;

  try {
    const token = await getAuthToken();
    const mode = await getMode();

    const kfType = PROPERTY_TYPE_CODES[propertyType?.toLowerCase()] ?? propertyType ?? 'F';

    const response = await fetch(
      `${PROXY_BASE_URL}/GetPropertyAVMByCoordinates?token=${encodeURIComponent(token)}&mode=${mode}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          X: coordinates.longitude,
          Y: coordinates.latitude,
          PropertyType: kfType,
          ErfSize: erfSize,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Knowledge Factory AVM endpoint not available on proxy');
      }
      return null;
    }

    const data = await response.json() as any;
    const raw = data.getPropertyAVMByCoordinatesDetails?.[0] ?? data;

    if (!raw || typeof raw.prediction !== 'number' || raw.prediction === 0) {
      return null;
    }

    return {
      PropertyId: raw.propertyId,
      Prediction: raw.prediction,
      PredictionLow: raw.predictionLow,
      PredictionHigh: raw.predictionHigh,
      Safety: raw.safety,
      Confidence: raw.confidence,
    };
  } catch (error) {
    console.error('Knowledge Factory AVM error:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Ping the proxy every 5 minutes to prevent Fly.io from sleeping
async function startKeepAlive() {
  const ping = async () => {
    try {
      await fetch(`${PROXY_BASE_URL}/`, { method: 'GET' });
    } catch {
      // Silently ignore — keep-alive failures shouldn't surface to users
    }
  };
  setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
  await ping();
}

startKeepAlive().catch(() => {});
