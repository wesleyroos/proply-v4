import { Router } from 'express';
import { db } from '../../db';
import { reportActivity } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Get report activity for a specific property
router.get('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Fetch all activity for this property, ordered by timestamp (most recent first)
    const activities = await db
      .select()
      .from(reportActivity)
      .where(eq(reportActivity.propertyId, propertyId))
      .orderBy(desc(reportActivity.timestamp));

    res.json(activities);
    
  } catch (error) {
    console.error('Error fetching report activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report activity',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Log a new activity (used internally by other routes)
export async function logReportActivity(activityData: {
  propertyId: string;
  reportId?: string;
  activityType: 'sent' | 'downloaded';
  recipientEmail?: string;
  recipientName?: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
}) {
  try {
    await db.insert(reportActivity).values({
      propertyId: activityData.propertyId,
      reportId: activityData.reportId,
      activityType: activityData.activityType,
      recipientEmail: activityData.recipientEmail,
      recipientName: activityData.recipientName,
      ipAddress: activityData.ipAddress,
      userAgent: activityData.userAgent,
      userId: activityData.userId,
    });
    
    console.log(`Logged ${activityData.activityType} activity for property ${activityData.propertyId}`);
  } catch (error) {
    console.error('Error logging report activity:', error);
  }
}

export default router;