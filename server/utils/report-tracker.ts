import { db } from "db";
import { reportGenerations, propdataListings } from "@db/schema";
import { eq } from "drizzle-orm";

interface ReportGenerationOptions {
  propertyId: string;
  reportType: string;
  userId?: number;
}

export async function trackReportGeneration(options: ReportGenerationOptions): Promise<void> {
  try {
    console.log(`Tracking report generation for property: ${options.propertyId}`);
    
    // Look up the property to get agency information
    const property = await db
      .select({
        agentId: propdataListings.agentId,
        agentName: propdataListings.agentName,
      })
      .from(propdataListings)
      .where(eq(propdataListings.propdataId, options.propertyId))
      .limit(1);

    if (property.length === 0) {
      console.warn(`Property ${options.propertyId} not found in propdata listings, using default agency`);
      // Use default values if property not found
      await db.insert(reportGenerations).values({
        agencyId: "unknown",
        agencyName: "Unknown Agency",
        propertyId: options.propertyId,
        reportType: options.reportType,
        timestamp: new Date(),
        userId: options.userId || null,
      });
      return;
    }

    const { agentId, agentName } = property[0];
    
    // Log the report generation using agent data as agency proxy
    await db.insert(reportGenerations).values({
      agencyId: agentId?.toString() || "unknown",
      agencyName: agentName || "Unknown Agency",
      propertyId: options.propertyId,
      reportType: options.reportType,
      timestamp: new Date(),
      userId: options.userId || null,
    });
    
    console.log(`Tracked report generation: ${options.reportType} for ${agentName} (Property: ${options.propertyId})`);
  } catch (error) {
    console.error('Failed to track report generation:', error);
    // Don't throw error to avoid breaking report generation
  }
}