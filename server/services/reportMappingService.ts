import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { reportActivity } from '../../db/schema';
import { eq } from 'drizzle-orm';

// In-memory store for report ID to property ID mapping
const reportPropertyMapping = new Map<string, string>();

export class ReportMappingService {
  // Store mapping when report is generated
  static storeReportMapping(reportId: string, propertyId: string) {
    reportPropertyMapping.set(reportId, propertyId);
    console.log(`Stored mapping: Report ${reportId} -> Property ${propertyId}`);
  }

  // Get property ID from report ID
  static async getPropertyIdFromReportId(reportId: string): Promise<string | null> {
    // First check in-memory mapping
    let propertyId = reportPropertyMapping.get(reportId);
    
    // If not found in memory, try to find from database
    if (!propertyId) {
      try {
        const existingActivity = await db.query.reportActivity.findFirst({
          where: eq(reportActivity.reportId, reportId),
          columns: { propertyId: true }
        });
        
        if (existingActivity) {
          propertyId = existingActivity.propertyId;
          // Store in memory for future use
          reportPropertyMapping.set(reportId, propertyId);
          console.log(`Found mapping in database: Report ${reportId} -> Property ${propertyId}`);
        }
      } catch (error) {
        console.error('Error querying database for report mapping:', error);
      }
    }
    
    if (!propertyId) {
      console.log(`No mapping found for report ID: ${reportId}`);
    }
    
    return propertyId || null;
  }

  // Clean up old mappings (call periodically)
  static cleanupOldMappings() {
    console.log(`Current mappings count: ${reportPropertyMapping.size}`);
  }
}