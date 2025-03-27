import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  properties,
  propertyAnalyzerResults,
  users,
  accessCodes,
  agencySettings,
  type SelectUser,
  type InsertUser,
  apiUsage,
  subscriptionHistory,
  invoices,
} from "@db/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";
import { crypto } from "./auth";
import { calculateYields } from "../analysis-engine/calculations";
import { analyzeSuburb } from "./services/openai";
import { sql } from "drizzle-orm";
import { suburbs } from "@db/schema";
import propertyScraper from './routes/property-scraper';
import sgMail from '@sendgrid/mail';
import primeRateRouter from './routes/prime-rate';
import { dealAdvisorHandler } from "./routes/deal-advisor"; 
import dealAdvisorRouter from './routes/deal-advisor'; 

// Extend Express.User to include our schema
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Add this helper function at the top of the file after imports
function normalizeUserField(value: string | null, fieldName?: string): string | null {
  if (!value || value === 'null') {
    return null;
  }
  // Special case for VAT number where 'NA' is a valid value
  if (fieldName === 'vatNumber' && value === 'NA') {
    return value;
  }
  // For other fields, treat 'NA' as null
  if (value === 'NA') {
    return null;
  }
  return value;
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Require authentication for all /api routes except login/register
  app.use("/api", (req, res, next) => {
    if (
      req.path === "/login" ||
      req.path === "/register" ||
      req.path === "/user" ||
      req.path === "/calculate-deal-score" ||
      req.path === "/deal-advisor/area-rate" ||
      req.path === "/deal-advisor/deal-analysis" ||
      req.path === "/deal-advisor/rental-amount" ||
      req.path === "/public-revenue-data"
    ) {
      return next();
    }
    if (!req.isAuthenticated() && !req.path.includes("/deal-advisor/area-rate")) {
      return res.status(401).send("Not authenticated");
    }
    next();
  });

  // Update the GET /api/user route
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionStartDate: users.subscriptionStartDate,
          subscriptionNextBillingDate: users.subscriptionNextBillingDate,
          subscriptionExpiryDate: users.subscriptionExpiryDate,
          isAdmin: users.isAdmin,
          userType: users.userType,
          companyLogo: users.companyLogo,
          company: users.company,
          vatNumber: users.vatNumber,
          registrationNumber: users.registrationNumber,
          businessAddress: users.businessAddress,
          payfastSubscriptionStatus: users.payfastSubscriptionStatus,
          subscriptionPausedUntil: users.subscriptionPausedUntil,
          pendingDowngrade: users.pendingDowngrade,
          reportsGenerated: users.reportsGenerated,
        })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      // Return raw user data without normalization
      const normalizedUser = {
        ...user,
        company: user.company,
        vatNumber: user.vatNumber,
        registrationNumber: user.registrationNumber,
        businessAddress: user.businessAddress,
      };

      console.log("Fetched user data:", {
        id: normalizedUser.id,
        company: normalizedUser.company,
        vatNumber: normalizedUser.vatNumber,
        registrationNumber: normalizedUser.registrationNumber,
        businessAddress: normalizedUser.businessAddress
      });

      res.json(normalizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Subscription upgrade endpoint
  app.post("/api/subscription/upgrade", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { userId, subscriptionStatus } = req.body;

    if (!userId || !subscriptionStatus) {
      return res.status(400).send("Missing required fields");
    }

    try {
      console.log("Processing subscription upgrade:", {
        userId,
        subscriptionStatus,
        requestedBy: req.user?.id,
      });

      // Verify the user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error("User not found:", userId);
        return res.status(404).send("User not found");
      }

      // Calculate start date and next billing date
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      // Create invoice in transaction with user update
      const [updatedUser] = await db.transaction(async (tx) => {
        // Update user subscription
        const [user] = await tx
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

        // Generate invoice number (format: INV-{userId}-{timestamp})
        const invoiceNumber = `INV-${userId}-${Date.now()}`;

        // Create invoice record
        await tx.insert(invoices).values({
          userId,
          amount: 2000.00, // R2,000.00 subscription fee
          description: "Proply Pro Subscription",
          status: "paid",
          invoiceNumber,
          paidAt: new Date(),
          createdAt: new Date()
        });

        return [user];
      });

      console.log("Subscription and invoice created successfully:", {
        userId: updatedUser.id,
        newStatus: updatedUser.subscriptionStatus,
        startDate: updatedUser.subscriptionStartDate,
        nextBillingDate: updatedUser.subscriptionNextBillingDate,
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

  // Subscription pause endpoint
  app.post("/api/subscription/pause", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { cycles = 1, reason } = req.body;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user?.payfastToken) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      const merchantId = process.env.VITE_PAYFAST_MERCHANT_ID;
      const version = "v1";
      const timestamp = new Date().toISOString();
      const signature = ""; // TODO: Implement signature generation

      // Call PayFast API to pause subscription
      const response = await fetch(
        `https://api.payfast.co.za/subscriptions/${user.payfastToken}/pause`,
        {
          method: "PUT",
          headers: {
            "merchant-id": merchantId,
            version,
            timestamp,
            signature,
          },
          body: JSON.stringify({ cycles }),
        },
      );

      if (!response.ok) {
        throw new Error(`PayFast API error: ${response.statusText}`);
      }

      // Calculate pause end date
      const pauseEndDate = new Date();
      pauseEndDate.setMonth(pauseEndDate.getMonth() + cycles);

      // Send email notification to admin
      try {
        await sgMail.send({
          to: 'wesley@proply.co.za',
          from: 'notifications@proply.co.za', // Update this to your verified sender
          subject: 'Subscription Pause Notice',
          html: `
            <h2>Subscription Pause Notice</h2>
            <p>A user has paused their subscription:</p>
            <ul>
              <li><strong>User:</strong> ${user.email}</li>
              <li><strong>Company:</strong> ${user.company || 'N/A'}</li>
              <li><strong>Current Plan:</strong> ${user.subscriptionStatus}</li>
              <li><strong>Pause Duration:</strong> ${cycles} month(s)</li>
              <li><strong>Resume Date:</strong> ${pauseEndDate.toLocaleDateString()}</li>
              <li><strong>Reason:</strong> ${reason || 'No reason provided'}</li>
            </ul>
          `,
        });
      } catch (emailError) {
        console.error('Error sending pause notification email:', emailError);
        // Don't fail the request if email fails
      }

      // Update user subscription status
      await db.transaction(async (tx) => {
        // Update user record
        await tx
          .update(users)
          .set({
            payfastSubscriptionStatus: "paused",
            subscriptionPausedUntil: pauseEndDate,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.user!.id));

        // Record subscription history
        if (user?.payfastToken) {
          await tx.insert(subscriptionHistory).values({
            userId: req.user!.id,
            action: "pause",
            payfastToken: user.payfastToken,
            pauseDuration: cycles,
            success: true,
          });
        }
      });

      res.json({
        message: "Subscription paused successfully",
        resumeDate: pauseEndDate,
      });
    } catch (error) {
      console.error("Error pausing subscription:", error);
      res.status(500).json({
        error: "Failed to pause subscription",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Add these new endpoints after the existing subscription endpoints
  app.post("/api/subscription/resume", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user?.payfastToken) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const merchantId = process.env.VITE_PAYFAST_MERCHANT_ID;
      const version = "v1";
      const timestamp = new Date().toISOString();
      const signature = ""; // TODO: Implement signature generation

      // Call PayFast API to unpause subscription
      const response = await fetch(
        `https://api.payfast.co.za/subscriptions/${user.payfastToken}/unpause`,
        {
          method: "PUT",
          headers: {
            "merchant-id": merchantId,
            version,
            timestamp,
            signature,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`PayFast API error: ${response.statusText}`);
      }

      // Update user subscription status
      await db.transaction(async (tx) => {
        // Update user record
        await tx
          .update(users)
          .set({
            payfastSubscriptionStatus: "active",
            subscriptionPausedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.user!.id));

        // Record subscription history with non-null values
        if (user?.payfastToken) {
          await tx.insert(subscriptionHistory).values({
            userId: req.user!.id,
            action: "resume",
            payfastToken: user.payfastToken,
            success: true,
          });
        }
      });

      res.json({ message: "Subscription resumed successfully" });
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({
        error: "Failed to resume subscription",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Update the existing cancel endpoint to use PayFast API
  app.post("/api/subscription/cancel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { reason } = req.body;

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate next billing date as expiry date
      const nextBillingDate =
        user.subscriptionNextBillingDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const [updatedUser] = await db
        .update(users)
        .set({
          pendingDowngrade: true,
          subscriptionExpiryDate: nextBillingDate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      // Send email notification to admin
      try {
        await sgMail.send({
          to: 'wesley@proply.co.za',
          from: 'notifications@proply.co.za', // Update this to your verified sender
          subject: 'Subscription Downgrade Notice',
          html: `
            <h2>Subscription Downgrade Notice</h2>
            <p>A user has requested to downgrade their subscription:</p>
            <ul>
              <li><strong>User:</strong> ${user.email}</li>
              <li><strong>Company:</strong> ${user.company || 'N/A'}</li>
              <li><strong>Current Plan:</strong> ${user.subscriptionStatus}</li>
              <li><strong>Downgrade Effective:</strong> ${nextBillingDate.toLocaleDateString()}</li>
              <li><strong>Reason:</strong> ${reason || 'No reason provided'}</li>
            </ul>
          `,
        });
      } catch (emailError) {
        console.error('Error sending downgrade notification email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: "Subscription downgrade scheduled",
        nextBillingDate: updatedUser.subscriptionNextBillingDate,
      });
    } catch (error) {
      console.error("Error scheduling subscription downgrade:", error);
      res.status(500).json({
        error: "Failed to schedule subscription downgrade",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Add new endpoint to cancel pending downgrade
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
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.pendingDowngrade) {
        return res
          .status(400)
          .json({ error: "No pending downgrade to cancel" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          pendingDowngrade: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      console.log("Cancelled pending downgrade for user:", {
        userId: updatedUser.id,
        currentPlan: updatedUser.subscriptionStatus,
      });

      res.json({ message: "Pending downgrade cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling pending downgrade:", error);
      res.status(500).json({
        error: "Failed to cancel pending downgrade",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Get user invoices endpoint
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, req.user!.id))
        .orderBy(invoices.createdAt, "desc");

      res.json(userInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Access code routes
  app.get("/api/access-codes", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
      const codes = await db
        .select()
        .from(accessCodes)
        .orderBy(accessCodes.createdAt);

      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch access codes" });
    }
  });

  app.post("/api/access-codes", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
      const { expiryDays } = req.body;

      if (!expiryDays || isNaN(parseInt(expiryDays))) {
        return res.status(400).json({ error: "Valid expiry days required" });
      }

      // Generate a random 8-character code
      const code = Array.from({ length: 8 }, () =>
        Math.random().toString(36).charAt(2),
      )
        .join("")
        .toUpperCase();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

      // Insert the new access code
      const [accessCode] = await db
        .insert(accessCodes)
        .values({
          code,
          isUsed: false,
          createdBy: req.user.id,
          expiresAt,
          createdAt: new Date(),
        })
        .returning();

      res.json(accessCode);
    } catch (error) {
      console.error("Error generating access code:", error);
      res.status(500).json({ error: "Failed to generate access code" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
      // Modified query to include both PA and RC property counts
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          userType: users.userType,
          company: users.company,
          firstName: users.firstName,
          lastName: users.lastName,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionExpiryDate: users.subscriptionExpiryDate,
          isAdmin: users.isAdmin,
          accessCode: accessCodes.code,
          accessCodeUsedAt: accessCodes.usedAt,
          pricelabsApiCallsTotal: users.pricelabsApiCallsTotal,
          pricelabsApiCallsMonth: users.pricelabsApiCallsMonth,
          lastLoginAt: users.lastLoginAt,
          reportsGenerated: sql`(
            SELECT COUNT(*)::integer 
            FROM ${propertyAnalyzerResults} 
            WHERE ${propertyAnalyzerResults.userId} = ${users.id}
          )`,
          propertyCount: sql`(
            SELECT COUNT(*)::integer 
            FROM ${properties} 
            WHERE ${properties.userId} = ${users.id}
          )`,
          rentCompareCount: sql`(
            SELECT COUNT(*)::integer 
            FROM ${properties} 
            WHERE ${properties.userId} = ${users.id}
          )`
        })
        .from(users)
        .leftJoin(accessCodes, eq(users.accessCodeId, accessCodes.id));

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post(
    "/api/admin/users/:id/:action(suspend|unsuspend|change-plan)",
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).send("Not authorized");
      }

      const userId = parseInt(req.params.id);

      try {
        const [targetUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!targetUser) {
          return res.status(404).send("User not found");
        }

        if (targetUser.isAdmin) {
          return res.status(400).send("Cannot suspend admin users");
        }

        if (targetUser.id === req.user.id) {
          return res.status(400).send("Cannot suspend yourself");
        }

        const action = req.params.action as
          | "suspend"
          | "unsuspend"
          | "change-plan";

        if (action === "change-plan") {
          const { plan } = req.body;
          if (!plan || !["free", "pro"].includes(plan)) {
            return res.status(400).send("Invalid plan specified");
          }

          await db
            .update(users)
            .set({
              subscriptionStatus: plan,
              subscriptionExpiryDate:
                plan === "pro"
                  ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                  : null,
            })
            .where(eq(users.id, userId));

          res.json({ message: `User plan updated to ${plan} successfully` });
        } else {
          await db
            .update(users)
            .set({
              subscriptionStatus: action === "suspend" ? "suspended" : "free",
            })
            .where(eq(users.id, userId));

          res.json({ message: `User ${action}ed successfully` });
        }
      } catch (error) {
        res.status(500).json({ error: "Failed to suspend user" });
      }
    },
  );

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const userId = parseInt(req.params.id);

    try {
      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!targetUser) {
        return res.status(404).send("User not found");
      }

      if (targetUser.isAdmin) {
        return res.status(400).send("Cannot delete admin users");
      }

      if (targetUser.id === req.user.id) {
        return res.status(400).send("Cannot delete yourself");
      }

      try {
        // First, remove the access code reference from the user
        await db
          .update(users)
          .set({ accessCodeId: null })
          .where(eq(users.id, userId));

        // Then delete any associated access codes
        await db.delete(accessCodes).where(eq(accessCodes.usedBy, userId));

        // Delete any properties owned by the user
        await db.delete(properties).where(eq(properties.userId, userId));

        // Finally, delete the user
        await db.delete(users).where(eq(users.id, userId));

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res
          .status(500)
          .json({ error: "Failed to delete user and associated data" });
      }
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Add this new endpoint after the existing admin endpoints
  app.get("/api/admin/stats", async (req, res) => {
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
          activePayfastSubscriptions: sql`sum(case when ${users.payfastToken} is not null and ${users.payfastSubscriptionStatus} = 'active' then 1 else 0 end)`,
          manuallyUpgradedPro: sql`sum(case when ${users.subscriptionStatus} = 'pro' and (${users.payfastToken} is null or ${users.payfastSubscriptionStatus} != 'active') then 1 else 0 end)`,
        })
        .from(users)
        .then((rows) => rows[0]);

      // Get total properties count with logging
      const propertyStats = await db
        .select({
          totalProperties: sql`count(*)::integer`,
          paProperties: sql`count(*) filter (where property_type = 'property_analyzer')::integer`,
          rcProperties: sql`count(*) filter (where property_type = 'rent_compare')::integer`
        })
        .from(properties)
        .then((rows) => {
          console.log("Property counts:", rows[0]); // Add logging
          return rows[0];
        });

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

      // Separate query for reports
      const reportStats = await db
        .select({
          monthlyReportsGenerated: sql`count(*) filter (where ${propertyAnalyzerResults.createdAt} >= ${startOfMonth})`,
          totalReportsGenerated: sql`count(*)`,
        })
        .from(propertyAnalyzerResults)
        .then((rows) => rows[0]);

      res.json({
        ...userStats,
        monthlyApiCalls: apiStats.monthlyApiCalls,
        monthlyReportsGenerated: reportStats.monthlyReportsGenerated || 0,
        totalReportsGenerated: reportStats.totalReportsGenerated || 0,
        totalProperties: propertyStats.totalProperties || 0,
        paProperties: propertyStats.paProperties || 0,
        rcProperties: propertyStats.rcProperties || 0
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({
        error: "Failed to fetch admin statistics",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // PriceLabs API proxy endpoint
  app.get("/api/revenue-data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { address, bedrooms } = req.query;

    if (!address || !bedrooms) {
      return res
        .status(400)
        .json({ error: "Address and bedrooms are required" });
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Check if we need to reset monthly counter
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      const now = new Date();
      const lastReset = currentUser.pricelabsApiLastReset;
      const shouldResetMonthly =
        !lastReset ||
        lastReset.getMonth() !== now.getMonth() ||
        lastReset.getFullYear() !== now.getFullYear();

      // Reset monthly counter if needed
      if (shouldResetMonthly) {
        console.log("Resetting monthly API counter for user:", req.user!.id);
        await db
          .update(users)
          .set({
            pricelabsApiCallsMonth: 0,
            pricelabsApiLastReset: now,
          })
          .where(eq(users.id, req.user!.id));
      }

      const response = await fetch(
        `https://api.pricelabs.co/v1/revenue/estimator?version=2&address=${encodeURIComponent(String(address))}&currency=ZAR&bedroom_category=${bedrooms}`,
        {
          headers: {
            "X-API-Key": "sNYmBNptl4gcLSlDl5GXuUtkGVVGIxiMcUjQI1MV",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`PriceLabs API error: ${response.statusText}`);
      }

      const data = await response.json();
      success = true;

      // Increment API usage counters
      console.log("Incrementing API counters for user:", req.user!.id);
      await db
        .update(users)
        .set({
          pricelabsApiCallsTotal: sql`COALESCE(${users.pricelabsApiCallsTotal}, 0) + 1`,
          pricelabsApiCallsMonth: sql`COALESCE(${users.pricelabsApiCallsMonth}, 0) + 1`,
        })
        .where(eq(users.id, req.user!.id))
        .returning()
        .then(([updated]) => {
          console.log("Updated counters:", {
            total: updated.pricelabsApiCallsTotal,
            monthly: updated.pricelabsApiCallsMonth,
          });
        });

      res.json(data);
    } catch (error) {
      console.error("Error fetching from PriceLabs:", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    } finally {
      // Track API usage in the general tracking table
      try {
        await db.insert(apiUsage).values({
          userId: req.user!.id,
          endpoint: "/api/revenue-data",
          responseTime: Date.now() - startTime,
          success,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error logging API usage:", error);
      }
    }
  });

  // Public PriceLabs API proxy endpoint for the Deal Score page
  app.get("/api/public-revenue-data", async (req, res) => {
    const { address, bedrooms } = req.query;

    if (!address || !bedrooms) {
      return res
        .status(400)
        .json({ error: "Address and bedrooms are required" });
    }

    const startTime = Date.now();
    let success = false;

    try {
      const response = await fetch(
        `https://api.pricelabs.co/v1/revenue/estimator?version=2&address=${encodeURIComponent(String(address))}&currency=ZAR&bedroom_category=${bedrooms}`,
        {
          headers: {
            "X-API-Key": "sNYmBNptl4gcLSlDl5GXuUtkGVVGIxiMcUjQI1MV",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`PriceLabs API error: ${response.statusText}`);
      }

      const data = await response.json();
      success = true;

      // We don't track usage for public API calls
      res.json(data);
    } catch (error) {
      console.error("Error fetching from PriceLabs (public):", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  // Property comparison routes
  app.use('/api/prime-rate', primeRateRouter);
  app.post("/api/properties", async (req, res) => {
    if (!req.isAuthenticated()) {      return res.status(401).send("Not authenticated");
    }

    try {
      const property = await db
        .insert(properties)
        .values({
          ...req.body,
          userId: req.user!.id,
        })
        .returning();
      res.json(property[0]);
    } catch (error) {
      res.status(400).json({ error: "Invalid property data" });
    }
  });

  // Get all rent compare properties for the current user.
  app.get("/api/properties", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      console.log("Fetching properties for user:", req.user.id);

      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.userId, req.user.id))
        .orderBy(properties.createdAt);

      res.json(userProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({
        error: "Failed to fetch properties",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
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
        .from(properties)
        .where(eq(properties.id, propertyId));

      if (!property) {
        return res.status(404).send("Property not found");
      }

      if (property.userId !== req.user!.id) {
        return res.status(403).send("Not authorized to delete this property");
      }

      // Delete the property
      await db.delete(properties).where(eq(properties.id, propertyId));

      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Inside the payment webhook route, update the implementation:
  app.post("/api/payment-webhook", async (req, res) => {
    console.log("Received sandbox webhook payload:", req.body);

    // For sandbox testing, we'll accept all webhooks
    // In production, verify the signature here
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
      // Calculate next billing date (30 days from start date)
      const nextBillingDate = new Date(startDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      // Update user with sandbox subscription data
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

      console.log("Sandbox: Updated subscription data:", {
        userId: updatedUser.id,
        status: updatedUser.subscriptionStatus,
        token: updatedUser.payfastToken,
        startDate: updatedUser.subscriptionStartDate,
        nextBilling: updatedUser.subscriptionNextBillingDate,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Sandbox webhook error:", error);
      res.status(500).json({ error: "Failed to process sandbox webhook" });
    }
  });

  // Update user profile
  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { firstName, lastName, companyLogo, company, vatNumber, registrationNumber, businessAddress } = req.body;

    try {
      console.log("Updating profile with data:", {
        userId: req.user!.id,
        firstName,
        lastName,
        hasLogo: !!companyLogo,
        company,
        vatNumber,
        registrationNumber,
        businessAddress
      });

      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: firstName || null,
          lastName: lastName || null,
          companyLogo: companyLogo || null,
          company: company || null,
          vatNumber: vatNumber || null,
          registrationNumber: registrationNumber || null,
          businessAddress: businessAddress || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      console.log("Profile updated successfully:", {
        userId: updatedUser.id,
        hasLogo: !!updatedUser.companyLogo,
        company: updatedUser.company,
        vatNumber: updatedUser.vatNumber,
        registrationNumber: updatedUser.registrationNumber,
        businessAddress: updatedUser.businessAddress
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

      // Get current user data first
      // const [currentUser] = await db
      //   .select({
      //     propertyAnalyzerUsage: users.propertyAnalyzerUsage
      //   })
      //   .from(users)
      //   .where(eq(users.id, req.user!.id))
      //   .limit(1);

      // const newUsage = (user?.propertyAnalyzerUsage || 0) + 1;
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
  app.use('/api/deal-advisor', dealAdvisorRouter); 

  // Add the calculate-deal-score endpoint
  app.post("/api/calculate-deal-score", async (req, res) => {
    try {
      const { address, price, propertyType, bedrooms } = req.body;

      // Mock calculation for demonstration
      const marketPrice = price * 0.95; // Example: market price is 95% of asking price
      const score = Math.min(100, Math.max(0, 100 - Math.abs((price - marketPrice) / marketPrice * 100)));

      let rating;
      let color;
      if (score >= 90) {
        rating = "Excellent Deal";
        color = "bg-green-500";
      } else if (score >= 70) {
        rating = "Good Deal";
        color = "bg-blue-500";
      } else if (score >= 50) {
        rating = "Fair Deal";
        color = "bg-yellow-500";
      } else {
        rating = "Poor Deal";
        color = "bg-red-500";
      }

      res.json({
        score: Math.round(score),
        rating,
        color,
        percentageDifference: ((marketPrice - price) / price) * 100,
        askingPrice: price,
        estimatedValue: marketPrice
      });
    } catch (error) {
      console.error("Error calculating deal score:", error);
      res.status(500).json({ error: "Failed to calculate deal score" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}