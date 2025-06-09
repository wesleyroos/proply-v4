import { db } from '../../db';
import { sql } from 'drizzle-orm';

// In-memory store for report ID to property ID mapping
// In production, this should be stored in database
const reportPropertyMapping = new Map<string, string>();

export class ReportMappingService {
  // Store mapping when report is generated
  static storeReportMapping(reportId: string, propertyId: string) {
    reportPropertyMapping.set(reportId, propertyId);
    console.log(`Stored mapping: Report ${reportId} -> Property ${propertyId}`);
  }

  // Get property ID from report ID
  static getPropertyIdFromReportId(reportId: string): string | null {
    const propertyId = reportPropertyMapping.get(reportId);
    if (!propertyId) {
      console.log(`No mapping found for report ID: ${reportId}`);
    }
    return propertyId || null;
  }

  // Clean up old mappings (call periodically)
  static cleanupOldMappings() {
    // For now, keep all mappings. In production, implement cleanup based on timestamp
    console.log(`Current mappings count: ${reportPropertyMapping.size}`);
  }
}