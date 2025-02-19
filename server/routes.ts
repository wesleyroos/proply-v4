import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  users,
  systemSettings,
  properties,
  propertyAnalyzerResults,
  apiUsage,
  suburbs
} from "@db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import propertyScraper from './routes/property-scraper';

// PayFast Configuration
const PAYFAST_CONFIG = {
  sandbox: {
    merchantId: "10000100",
    merchantKey: "46f0cd694581a",
    passphrase: "payfast",
  },
  live: {
    merchantId: process.env.VITE_PAYFAST_MERCHANT_ID,
    merchantKey: process.env.VITE_PAYFAST_MERCHANT_KEY,
    passphrase: process.env.VITE_PAYFAST_PASSPHRASE,
  }
};

// Validate PayFast configuration
function validatePayFastConfig(isSandbox: boolean): { 
  valid: boolean; 
  config: typeof PAYFAST_CONFIG.sandbox | typeof PAYFAST_CONFIG.live;
  error?: string;
} {
  const config = isSandbox ? PAYFAST_CONFIG.sandbox : PAYFAST_CONFIG.live;

  if (!config.merchantId || !config.merchantKey) {
    console.error(`PayFast ${isSandbox ? 'sandbox' : 'live'} configuration missing required fields`);
    return { 
      valid: false, 
      config,
      error: `PayFast ${isSandbox ? 'sandbox' : 'live'} mode not properly configured`
    };
  }

  return { valid: true, config };
}

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Subscription upgrade endpoint
  app.post("/api/subscription/upgrade", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { userId, subscriptionStatus } = req.body;

    if (!userId || !subscriptionStatus) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Get current PayFast mode
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "payfast_sandbox_mode"))
        .limit(1);

      const isSandbox = setting?.value === "true";
      const { valid, config, error } = validatePayFastConfig(isSandbox);

      if (!valid) {
        console.error("PayFast configuration error:", error);
        return res.status(500).json({ 
          error: "Payment system configuration error", 
          details: error 
        });
      }

      console.log("Processing subscription upgrade:", {
        userId,
        subscriptionStatus,
        requestedBy: req.user?.id,
        environment: isSandbox ? "sandbox" : "live",
        merchantId: config.merchantId,
      });

      // Verify the user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error("User not found:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate start date and next billing date
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      // Update user's subscription status and billing dates
      const [updatedUser] = await db
        .update(users)
        .set({
          subscriptionStatus,
          subscriptionStartDate: startDate,
          subscriptionNextBillingDate: nextBillingDate,
          pendingDowngrade: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      console.log("Subscription updated successfully:", {
        userId: updatedUser.id,
        newStatus: updatedUser.subscriptionStatus,
        startDate: updatedUser.subscriptionStartDate,
        nextBillingDate: updatedUser.subscriptionNextBillingDate,
        environment: isSandbox ? "sandbox" : "live",
      });

      res.json({
        message: "Subscription updated successfully",
        user: {
          id: updatedUser.id,
          subscriptionStatus: updatedUser.subscriptionStatus,
          subscriptionStartDate: updatedUser.subscriptionStartDate,
          subscriptionNextBillingDate: updatedUser.subscriptionNextBillingDate,
        },
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({
        error: "Failed to update subscription",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Update the payment webhook to check sandbox mode
  app.post("/api/payment-webhook", async (req, res) => {
    // Get current PayFast mode
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "payfast_sandbox_mode"))
      .limit(1);

    const isSandbox = setting?.value === "true";
    const { valid, config, error } = validatePayFastConfig(isSandbox);

    if (!valid) {
        console.error("PayFast configuration error:", error);
        return res.status(500).json({ error: "Payment system configuration error", details: error });
    }

    console.log("Processing payment webhook in", isSandbox ? "sandbox" : "live", "mode");

    console.log("Received webhook payload:", req.body);

    const {
      subscription_status = "active",
      token = null,
      user_id,
    } = req.body;

    try {
      // Verify the user exists first
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, user_id))
        .limit(1);

      if (!user) {
        console.log("Webhook: User not found:", user_id);
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();
      // If this is a first-time subscription, set start date to now
      const startDate = user.subscriptionStartDate || now;
      // Calculate next billing date (30 days from start date)      const nextBillingDate = new Date(startDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      // Update user with subscription data
      const [updatedUser] = await db
        .update(users)
        .set({
          subscriptionStatus: subscription_status,
          payfastToken: token,
          subscriptionStartDate: startDate,
          subscriptionNextBillingDate: nextBillingDate,
          subscriptionExpiryDate:
            subscription_status === "active" ? nextBillingDate : now,
          updatedAt: now,
        })
        .where(eq(users.id, user_id))
        .returning();

      console.log(`${isSandbox ? '[SANDBOX]' : '[LIVE]'} Updated subscription data:`, {
        userId: updatedUser.id,
        status: updatedUser.subscriptionStatus,
        token: updatedUser.payfastToken,
        startDate: updatedUser.subscriptionStartDate,
        nextBilling: updatedUser.subscriptionNextBillingDate,
      });

      res.json({ success: true });
    } catch (error) {
      console.error(`${isSandbox ? '[SANDBOX]' : '[LIVE]'} webhook error:`, error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // PayFast mode endpoints
  app.get("/api/admin/payfast-mode", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "payfast_sandbox_mode"))
        .limit(1);

      res.json({ sandbox: setting?.value === "true" });
    } catch (error) {
      console.error("Error fetching PayFast mode:", error);
      res.status(500).json({ error: "Failed to fetch PayFast mode" });
    }
  });

  app.post("/api/admin/payfast-mode", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const { sandbox } = req.body;
    if (typeof sandbox !== "boolean") {
      return res.status(400).json({ error: "Invalid sandbox mode value" });
    }

    try {
      // Validate the configuration for the requested mode first
      const { valid, error } = validatePayFastConfig(sandbox);
      if (!valid) {
        return res.status(500).json({ 
          error: "Cannot switch PayFast mode", 
          details: error 
        });
      }

      // Update or insert the setting
      const result = await db
        .update(systemSettings)
        .set({
          value: sandbox.toString(),
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, "payfast_sandbox_mode"))
        .returning();

      if (result.length === 0) {
        await db.insert(systemSettings).values({
          key: "payfast_sandbox_mode",
          value: sandbox.toString(),
        });
      }

      console.log("Updated PayFast mode:", { 
        sandbox,
        merchantId: sandbox ? PAYFAST_CONFIG.sandbox.merchantId : PAYFAST_CONFIG.live.merchantId 
      });

      res.json({ success: true, sandbox });
    } catch (error) {
      console.error("Error updating PayFast mode:", error);
      res.status(500).json({ 
        error: "Failed to update PayFast mode",
        details: error instanceof Error ? error.message : undefined
      });
    }
  });

  // Update user profile
  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { firstName, lastName, companyLogo } = req.body;

    try {
      // Validate the logo data if present
      if (companyLogo && !companyLogo.startsWith("data:image")) {
        return res.status(400).json({ error: "Invalid logo format" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          firstName,
          lastName,
          companyLogo,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      console.log("Profile updated successfully:", {
        userId: updatedUser.id,
        hasLogo: !!updatedUser.companyLogo,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Change password
  app.post("/api/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Verify current password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      const isMatch = await crypto.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).send("Current password is incorrect");
      }

      // Hash new password and update
      const hashedPassword = await crypto.hash(newPassword);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, req.user!.id));

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Property analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Get current user data first
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      // Do analysis
      console.log("\n=== Starting Property Analysis ===");
      console.log("Current User Data:", {
        id: user?.id,
        email: user?.email,
        currentAnalysisCount: user?.analysisCount || 0,
        hasUser: !!user
      });

      const propertyData = {
        purchasePrice: parseFloat(req.body.purchasePrice),
        shortTermNightlyRate: req.body.shortTermNightlyRate
          ? parseFloat(req.body.shortTermNightlyRate)
          : null,
        annualOccupancy: req.body.annualOccupancy
          ? parseFloat(req.body.annualOccupancy)
          : null,
        longTermRental: req.body.longTermRental
          ? parseFloat(req.body.longTermRental)
          : null,
        leaseCycleGap: req.body.leaseCycleGap
          ? parseInt(req.body.leaseCycleGap)
          : null,
        propertyDescription: req.body.propertyDescription || null,
        address: req.body.address,
        deposit:
          req.body.depositType === "amount"
            ? parseFloat(req.body.deposit)
            : (parseFloat(req.body.purchasePrice) *
                parseFloat(req.body.depositPercentage)) /
              100,
        interestRate: parseFloat(req.body.interestRate),
        loanTerm: parseInt(req.body.loanTerm),
        floorArea: parseFloat(req.body.floorArea),
        ratePerSquareMeter: parseFloat(
          req.body.ratePerSquareMeter || req.body.cmaRatePerSqm || 0,
        ),
        incomeGrowthRate: parseFloat(req.body.annualIncomeGrowth || 8),
        expenseGrowthRate: parseFloat(req.body.annualExpenseGrowth || 6),
        monthlyLevies: parseFloat(req.body.monthlyLevies || 0),
        monthlyRatesTaxes: parseFloat(req.body.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: parseFloat(req.body.otherMonthlyExpenses || 0),
        maintenancePercent: parseFloat(req.body.maintenancePercent || 0),
        managementFee: parseFloat(req.body.managementFee || 0),
      };

      const analysisResult = calculateYields(propertyData);
      console.log(
        "Analysis complete. Result:",
        JSON.stringify(analysisResult, null, 2),
      );


      const newCount = (user?.analysisCount || 0) + 1;

      console.log("Before incrementing analysis count:", {
        userId: user?.id,
        email: user?.email,
        currentCount: user?.analysisCount || 0
      });

      // Increment the user's analysis count
      const [updatedUser] = await db
        .update(users)
        .set({
          analysisCount: sql`CASE 
            WHEN ${users.analysisCount} IS NULL THEN 1 
            ELSE ${users.analysisCount} + 1 
          END`,
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      const analysisResponse = {
        ...analysisResult,
        previousCount: user?.analysisCount || 0,
        newCount: updatedUser.analysisCount || 0,
        change: (updatedUser.analysisCount || 0) - (user?.analysisCount || 0)
      };

      console.log("Analysis response:", analysisResponse);

      res.json(analysisResponse);
    } catch (error) {
      console.error("=== Analysis Error ===");
      console.error("Error details:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to analyze property data";
      console.error("Sending error response:", { error: errorMessage });

      res.status(500).json({
        error: errorMessage,
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Update user profile
  app.post("/api/subscription/downgrade", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Calculate the end of the current billing cycle
      // If they just upgraded, use their upgrade date as reference
      // Otherwise, use their subscription start date
      const currentDate = new Date();
      const subscriptionStartDate = user.subscriptionStartDate || currentDate;
      const monthsSinceStart =
        (currentDate.getTime() - subscriptionStartDate.getTime()) /
        (30 * 24 * 60 * 60 * 1000);
      const completedMonths = Math.floor(monthsSinceStart);

      // Calculate the next billing cycle end date
      const nextBillingDate = new Date(subscriptionStartDate);
      nextBillingDate.setMonth(
        nextBillingDate.getMonth() + completedMonths + 1,
      );

      // Update user to indicate pending downgrade
      const [updatedUser] = await db
        .update(users)
        .set({
          pendingDowngrade: true,
          subscriptionExpiryDate: nextBillingDate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      console.log("Subscription downgrade scheduled:", {
        userId: updatedUser.id,
        currentStatus: updatedUser.subscriptionStatus,
        expiryDate: updatedUser.subscriptionExpiryDate,
        pendingDowngrade: updatedUser.pendingDowngrade,
      });

      res.json({
        message: "Subscription downgrade scheduled",
        expiryDate: nextBillingDate,
      });
    } catch (error) {
      console.error("Error scheduling subscription downgrade:", error);
      res.status(500).json({
        error: "Failed to schedule subscription downgrade",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Cancel subscription downgrade endpoint
  app.post("/api/subscription/cancel-downgrade", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Remove pending downgrade and expiry date
      const [updatedUser] = await db
        .update(users)
        .set({
          pendingDowngrade: false,
          subscriptionExpiryDate: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      console.log("Subscription downgrade cancelled:", {
        userId: updatedUser.id,
        currentStatus: updatedUser.subscriptionStatus,
        pendingDowngrade: updatedUser.pendingDowngrade,
      });

      res.json({
        message: "Subscription downgrade cancelled",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error cancelling subscription downgrade:", error);
      res.status(500).json({
        error: "Failed to cancel subscription downgrade",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Property analyzer save endpoint
  app.post("/api/property-analyzer/save", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      console.log("Saving property analysis for user:", req.user.id);
      console.log("Bedrooms raw value:", req.body.bedrooms);
      console.log("Bedrooms parsed value:", parseFloat(req.body.bedrooms));
      console.log("Full request body:", JSON.stringify(req.body, null, 2));

      // Ensure bedrooms is a decimal
      const bedroomsValue = parseFloat(req.body.bedrooms);
      if (isNaN(bedroomsValue)) {
        return res.status(400).json({ error: "Invalid bedrooms value" });
      }

      const dataToSave = {
        ...req.body,
        bedrooms: parseFloat(req.body.bedrooms),
        bathrooms: parseInt(req.body.bathrooms),
        parkingSpaces: parseInt(req.body.parkingSpaces || 0),
        userId: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert analysis result with properly formatted data
      const [savedAnalysis] = await db
        .insert(propertyAnalyzerResults)
        .values({
          ...req.body,
          userId: req.user!.id,
          createdAt: new Date(),
        })
        .returning();

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error saving property analysis:", error);
      res.status(500).json({
        error: "Failed to save property analysis",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Get all property analyzer results for the current user
  app.get("/api/property-analyzer/properties", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      console.log("Fetching property analyzer results for user:", req.user.id);

      const results = await db
        .select()
        .from(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.userId, req.user.id))
        .orderBy(propertyAnalyzerResults.createdAt);

      res.json(results);
    } catch (error) {
      console.error("Error fetching property analyzer results:", error);
      res.status(500).json({
        error: "Failed to fetch property analyzer results",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Delete property analyzer result
  app.delete("/api/property-analyzer/properties/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).send("Invalid property ID");
    }

    try {
      // First check if the property exists and belongs to the user
      const [property] = await db
        .select()
        .from(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.id, propertyId))
        .limit(1);

      if (!property) {
        return res.status(404).send("Property not found");
      }

      if (property.userId !== req.user.id) {
        return res.status(403).send("Not authorized to delete this property");
      }

      // Delete the property
      await db
        .delete(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.id, propertyId));

      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({
        error: "Failed to delete property",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Market Intelligence API endpoint
  app.post("/api/market-intelligence/analyze", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const { suburb } = req.body;

    if (!suburb) {
      return res.status(400).json({ error: "Suburb name is required" });
    }

    try {
      const analysis = await analyzeSuburb(suburb);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing suburb:", error);
      res.status(500).json({
        error: "Failed to analyze suburb",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Add suburb search endpoint
  app.get("/api/suburbs/search", async (req, res) => {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }

    try {
      const matchingSuburbs = await db
        .select({
          id: suburbs.id,
          name: suburbs.name,
          city: suburbs.city,
          province: suburbs.province,
        })
        .from(suburbs)
        .where(sql`lower(${suburbs.name}) like ${`%${query.toLowerCase()}%`}`)
        .orderBy(suburbs.name)
        .limit(10);

      res.json(matchingSuburbs);
    } catch (error) {
      console.error("Error searching suburbs:", error);
      res.status(500).json({
        error: "Failed to search suburbs",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Add this new endpoint after the existing admin endpoints
  app.get("/api/analytics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
      // Get basic user stats
      const userStats = await db
        .select({
          totalUsers: sql`count(*)`,
          adminUsers: sql`sum(case when ${users.isAdmin} then 1 else 0 end)`,
          proUsers: sql`sum(case when ${users.subscriptionStatus} = 'pro' then 1 else 0 end)`,
          freeUsers: sql`sum(case when ${users.subscriptionStatus} = 'free' then 1 else 0 end)`,
          corporateUsers: sql`sum(case when ${users.userType} = 'corporate' then 1 else 0 end)`,
          individualUsers: sql`sum(case when ${users.userType} = 'individual' then 1 else 0 end)`,
          totalApiCalls: sql`sum(COALESCE(${users.pricelabsApiCallsTotal}, 0))`,
        })
        .from(users)
        .then((rows) => rows[0]);

      // Get API usage for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const apiStats = await db
        .select({
          monthlyApiCalls: sql`count(*)`,
        })
        .from(apiUsage)
        .where(sql`${apiUsage.timestamp} >= ${startOfMonth}`)
        .then((rows) => rows[0]);

      // Get reports generated
      const reportStats = await db
        .select({
          monthlyReportsGenerated: sql`count(*) filter (where ${propertyAnalyzerResults.createdAt} >= ${startOfMonth})`,
          totalReportsGenerated: sql`count(*)`,
        })
        .from(propertyAnalyzerResults)
        .then((rows) => rows[0]);

      // Get daily analytics data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyAnalytics = await db
        .select({
          date: sql`date_trunc('day', ${propertyAnalyzerResults.createdAt})::date`,
          analyses: sql`count(*)::integer`,
          properties: sql`count(distinct ${propertyAnalyzerResults.propertyId})::integer`,
        })
        .from(propertyAnalyzerResults)
        .where(sql`${propertyAnalyzerResults.createdAt} >= ${thirtyDaysAgo}`)
        .groupBy(sql`date_trunc('day', ${propertyAnalyzerResults.createdAt})`)
        .orderBy(sql`date_trunc('day', ${propertyAnalyzerResults.createdAt})`);

      res.json({
        ...userStats,
        monthlyApiCalls: apiStats.monthlyApiCalls,
        monthlyReportsGenerated: reportStats.monthlyReportsGenerated || 0,
        totalReportsGenerated: reportStats.totalReportsGenerated || 0,
        dailyAnalytics,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Add this new endpoint after the existing signup analytics endpoint
  app.get("/api/analytics/signups", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const { period } = req.query;
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0);
    }

    try {
      const signupData = await db
        .select({
          date: sql`date_trunc('day', ${users.createdAt})::date`,
          count: sql`count(*)::integer`,
        })
        .from(users)
        .where(sql`${users.createdAt} >= ${startDate}`)
        .groupBy(sql`date_trunc('day', ${users.createdAt})`)
        .orderBy(sql`date_trunc('day', ${users.createdAt})`);

      res.json(signupData);
    } catch (error) {
      console.error("Error fetching signup analytics:", error);
      res.status(500).json({
        error: "Failed to fetch signup analytics",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Force clear all sessions and cache
  app.post("/api/admin/clear-cache", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
      // Clear all sessions from MemoryStore
      if (req.sessionStore) {
        req.sessionStore.clear();
      }
      
      // Log out current user
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
      });

      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  // Add new endpoint after the existing signup analytics endpoint
  app.get("/api/analytics/reports", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const { period } = req.query;
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // For 'all' or invalid periods, get all data
        startDate = new Date(0);
    }

    try {
      const reportData = await db
        .select({
          date: sql`date_trunc('day', ${propertyAnalyzerResults.createdAt})::date`,
          count: sql`count(*)::integer`,
        })
        .from(propertyAnalyzerResults)
        .where(sql`${propertyAnalyzerResults.createdAt} >= ${startDate}`)
        .groupBy(sql`date_trunc('day', ${propertyAnalyzerResults.createdAt})`)
        .orderBy(sql`date_trunc('day', ${propertyAnalyzerResults.createdAt})`);

      res.json(reportData);
    } catch (error) {
      console.error("Error fetching report analytics:", error);
      res.status(500).json({
        error: "Failed to fetch report analytics",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Register property scraper routes
  app.use("/api", propertyScraper);


  const httpServer = createServer(app);
  return httpServer;
}