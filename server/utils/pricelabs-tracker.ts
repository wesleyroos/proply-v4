import { db } from "db";
import { priceLabsUsage } from "@db/schema";

interface PriceLabsApiOptions {
  userId?: number;
  endpoint: string;
  url: string;
  headers?: Record<string, string>;
  method?: string;
}

export async function trackPriceLabsApiCall(options: PriceLabsApiOptions): Promise<any> {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | null = null;

  try {
    console.log(`Making PriceLabs API call to: ${options.endpoint}`);
    
    const response = await fetch(options.url, {
      method: options.method || 'GET',
      headers: {
        'X-API-Key': process.env.PRICELABS_API_KEY || 'sNYmBNptl4gcLSlDl5GXuUtkGVVGIxiMcUjQI1MV',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`PriceLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    success = true;
    
    console.log(`PriceLabs API call successful: ${options.endpoint}`);
    
    return data;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`PriceLabs API call failed: ${options.endpoint}`, error);
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;
    
    // Log the API usage to database
    try {
      await db.insert(priceLabsUsage).values({
        userId: options.userId || null,
        endpoint: options.endpoint,
        timestamp: new Date(),
        responseTime,
        success,
        errorMessage
      });
      
      console.log(`Logged PriceLabs usage: ${options.endpoint} (${responseTime}ms, success: ${success})`);
    } catch (logError) {
      console.error('Failed to log PriceLabs usage:', logError);
    }
  }
}