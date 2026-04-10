import { db } from "../../db";
import { reportGenerations, propdataListings, agencyBranches } from "../../db/schema";
import { eq } from "drizzle-orm";

interface ReportGenerationOptions {
  propertyId: string;
  reportType: string;
  userId?: number;
}

export async function trackReportGeneration(options: ReportGenerationOptions): Promise<void> {
  try {
    console.log(`Tracking report generation for property: ${options.propertyId}`);

    // Look up the property and join with agency branch to get franchise information
    const property = await db
      .select({
        agentId: propdataListings.agentId,
        agentName: propdataListings.agentName,
        franchiseName: agencyBranches.franchiseName,
        branchName: agencyBranches.branchName,
        slug: agencyBranches.slug,
      })
      .from(propdataListings)
      .leftJoin(agencyBranches, eq(propdataListings.branchId, agencyBranches.id))
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

    const { agentId, agentName, franchiseName, branchName, slug } = property[0];

    // Use slug as agencyId — this must match agencyBranches.slug for billing to work
    const displayName = franchiseName || agentName || "Unknown Agency";
    const agencyIdentifier = slug || (agentId?.toString() || "unknown");

    // Log the report generation using slug as identifier
    await db.insert(reportGenerations).values({
      agencyId: agencyIdentifier,
      agencyName: displayName,
      propertyId: options.propertyId,
      reportType: options.reportType,
      timestamp: new Date(),
      userId: options.userId || null,
    });
    
    console.log(`Tracked report generation: ${options.reportType} for ${displayName} (Property: ${options.propertyId})`);
  } catch (error) {
    console.error('Failed to track report generation:', error);
    // Don't throw error to avoid breaking report generation
  }
}