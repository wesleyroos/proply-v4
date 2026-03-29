import { randomUUID } from "crypto";
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import path from "path";
import {
  properties,
  propertyAnalyzerResults,
  users,
  accessCodes,
  agencySettings,
  type SelectUser,
  type InsertUser,
  subscriptionHistory,
  invoices,
  passwordResetTokens,
  valuationReports,
  rentalPerformanceData,
  propdataListings,
  agencyBranches,
  agencyPaymentMethods,
  agencyBillingSettings,
  agencyBillingCycles,
  agencyInvoices,
  systemSettings,
  transactionHistory,
} from "@db/schema";
import { eq, and, gte, lt, sql, desc, or, ilike } from "drizzle-orm";
import fetch from "node-fetch";
import { crypto } from "./auth";
import { calculateYields } from "../analysis-engine/calculations";
import { trackPriceLabsApiCall } from "./utils/pricelabs-tracker";
import { trackReportGeneration } from "./utils/report-tracker";
import { priceLabsUsage, reportGenerations } from "@db/schema";
import { generateInvoicePDF } from "./pdf-service";

// Function to track agency report usage for billing
async function trackAgencyReportUsage(agencyBranchId: number, userId: number, propertyAddress: string) {
  try {
    const currentDate = new Date();
    const billingPeriod = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Get or create billing cycle for this month
    let [billingCycle] = await db
      .select()
      .from(agencyBillingCycles)
      .where(
        and(
          eq(agencyBillingCycles.agencyBranchId, agencyBranchId),
          eq(agencyBillingCycles.billingPeriod, billingPeriod)
        )
      )
      .limit(1);

    if (!billingCycle) {
      // Get billing settings for pricing
      const [billingSettings] = await db
        .select()
        .from(agencyBillingSettings)
        .where(eq(agencyBillingSettings.agencyBranchId, agencyBranchId))
        .limit(1);

      const pricePerReport = parseFloat(billingSettings?.pricePerReport || "200.00");
      
      // Create new billing cycle
      [billingCycle] = await db
        .insert(agencyBillingCycles)
        .values({
          agencyBranchId,
          billingPeriod,
          reportCount: 1,
          pricePerReport: pricePerReport.toFixed(2),
          subtotal: pricePerReport.toFixed(2),
          vatAmount: (pricePerReport * 0.15).toFixed(2), // 15% VAT
          totalAmount: (pricePerReport * 1.15).toFixed(2),
          status: "pending",
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, billingSettings?.billingDay || 1)
        })
        .returning();
    } else {
      // Update existing billing cycle
      const newReportCount = billingCycle.reportCount + 1;
      const pricePerReport = parseFloat(billingCycle.pricePerReport);
      const newSubtotal = newReportCount * pricePerReport;
      const newVatAmount = newSubtotal * 0.15;
      const newTotalAmount = newSubtotal + newVatAmount;

      await db
        .update(agencyBillingCycles)
        .set({
          reportCount: newReportCount,
          subtotal: newSubtotal.toFixed(2),
          vatAmount: newVatAmount.toFixed(2),
          totalAmount: newTotalAmount.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(agencyBillingCycles.id, billingCycle.id));
    }

    console.log(`Agency billing: Tracked report usage for branch ${agencyBranchId}, period ${billingPeriod}`);
  } catch (error) {
    console.error('Error tracking agency report usage:', error);
  }
}
import propertyScraper from './routes/property-scraper';
import sgMail from '@sendgrid/mail';
import primeRateRouter from './routes/prime-rate';
import OpenAI from "openai";
import dealAdvisorRouter from './routes/deal-advisor';
import addressValidationRouter from './routes/address-validation';
import trafficDataRouter from './routes/traffic-data';
import tomtomTestRouter from './routes/tomtom-test';
import propdataListingsRouter from './routes/propdata-listings';
import fetchPropdataRouter from './routes/fetch-propdata';
import valuationRouter from './routes/valuation';
import { getRentalPerformance } from './routes/rental-performance';
import { sendPasswordResetEmail, sendDemoRequestEmail } from './services/email';
import propdataDebugRouter from './routes/propdata-debug';
import agenciesRouter from './routes/agencies';
import { imageSyncService } from './services/imageSyncService';
import sharp from 'sharp';
import propdataReportsRouter from './routes/propdata-reports';
import reportActivityRouter from './routes/report-activity';
import adminInvitationsRouter from './routes/admin-invitations';
import branchAdminRouter from './routes/branch-admin';
import agencyProfileRouter from './routes/agency-profile';

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
  
  // PDF download routes
  app.get('/api/download-pdf', (req, res) => {
    const filePath = process.cwd() + '/public/Property Risk Assessment - Proply.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Property Risk Assessment - Proply.pdf"');
    res.sendFile(filePath);
  });
  
  // Agent sample report PDF download route
  app.get('/api/download-property-analysis-pdf', (req, res) => {
    const filePath = process.cwd() + '/public/27_Leeuwen_St__Cape_Town_City_Centre__8001_analysis (23).pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Investment Analysis - 27 Leeuwen St.pdf"');
    res.sendFile(filePath);
  });

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
      req.path === "/deal-advisor/suburb-sentiment" ||
      req.path === "/deal-advisor/comparable-sales" ||
      req.path === "/deal-advisor/scrape-property24" ||
      req.path === "/deal-advisor/find-comparable" ||
      req.path === "/public-revenue-data" ||
      req.path === "/traffic-data" ||
      req.path === "/tomtom-test" ||
      req.path === "/address-validation/validate" ||
      req.path === "/address-validation/autocomplete" ||
      req.path === "/area-rate" || // New public area rate endpoint
      req.path === "/demo-request" || // Demo request endpoint
      req.path === "/download-pdf" || // PDF download endpoint
      req.path === "/download-property-analysis-pdf" || // Property analysis PDF download endpoint
      req.path.startsWith("/propdata-debug/") || // PropData debug endpoint
      req.path.startsWith("/propdata-reports/") || // PropData PDF reports
      req.path === "/pdf-test" || // PDF test endpoint
      req.path.startsWith("/pdf-generate/") || // PDF generation endpoint
      req.path === "/payfast/notify" || // PayFast webhook endpoint
      req.path.startsWith("/api/property-analyzer/shared/") || // Public shared analysis

      req.path.startsWith("/admin/invitations/") && req.method === "POST" && req.path.includes("/accept") // Admin invitation acceptance
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
          role: users.role,
          franchiseId: users.franchiseId,
          branchId: users.branchId,
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

      // Return user data with role-based fields
      const normalizedUser = {
        ...user,
        role: user.role,
        franchiseId: user.franchiseId,
        branchId: user.branchId,
        company: user.company,
        vatNumber: user.vatNumber,
        registrationNumber: user.registrationNumber,
        businessAddress: user.businessAddress,
      };

      console.log("Fetched user data:", {
        id: normalizedUser.id,
        email: normalizedUser.email,
        role: normalizedUser.role,
        franchiseId: normalizedUser.franchiseId,
        branchId: normalizedUser.branchId,
        isAdmin: normalizedUser.isAdmin
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

  // Get all transaction history (admin only)
  app.get('/api/admin/transactions', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = req.user;
    if (!user || (user.role !== 'system_admin' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const { status, agency, date } = req.query;

      // Build where conditions
      let whereConditions = [];
      
      if (status && status !== 'all') {
        whereConditions.push(eq(transactionHistory.status, status as string));
      }
      
      if (agency) {
        whereConditions.push(
          or(
            ilike(transactionHistory.agencyId, `%${agency}%`),
            ilike(agencyBranches.franchiseName, `%${agency}%`),
            ilike(agencyBranches.branchName, `%${agency}%`)
          )
        );
      }
      
      if (date) {
        const filterDate = new Date(date as string);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        whereConditions.push(
          and(
            gte(transactionHistory.processedAt, filterDate),
            lt(transactionHistory.processedAt, nextDay)
          )
        );
      }

      // Fetch transactions with agency details
      const transactions = await db
        .select({
          transactionId: transactionHistory.transactionId,
          invoiceId: transactionHistory.invoiceId,
          agencyId: transactionHistory.agencyId,
          agencyName: sql<string>`COALESCE(${agencyBranches.franchiseName}, '') || ' - ' || COALESCE(${agencyBranches.branchName}, '')`,
          amount: transactionHistory.amount,
          status: transactionHistory.status,
          payfastTransactionId: transactionHistory.payfastTransactionId,
          payfastPaymentId: transactionHistory.payfastPaymentId,
          processedAt: transactionHistory.processedAt,
          errorMessage: transactionHistory.errorMessage,
          gatewayResponse: transactionHistory.gatewayResponse,
        })
        .from(transactionHistory)
        .leftJoin(agencyBranches, eq(transactionHistory.agencyId, agencyBranches.slug))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(transactionHistory.processedAt))
        .limit(1000);

      // Calculate statistics
      const stats = await db
        .select({
          totalTransactions: sql<number>`COUNT(*)::int`,
          totalAmount: sql<number>`SUM(CAST(${transactionHistory.amount} AS DECIMAL))`,
          successfulTransactions: sql<number>`COUNT(CASE WHEN ${transactionHistory.status} = 'completed' THEN 1 END)::int`,
          failedTransactions: sql<number>`COUNT(CASE WHEN ${transactionHistory.status} = 'failed' THEN 1 END)::int`,
        })
        .from(transactionHistory)
        .leftJoin(agencyBranches, eq(transactionHistory.agencyId, agencyBranches.slug))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const statsData = stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
      };

      const successRate = statsData.totalTransactions > 0 
        ? (statsData.successfulTransactions / statsData.totalTransactions) * 100 
        : 0;

      res.json({
        transactions,
        stats: {
          ...statsData,
          successRate,
        },
      });

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
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
          role: users.role,
          accessCode: accessCodes.code,
          accessCodeUsedAt: accessCodes.usedAt,

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
    "/api/admin/users/:id/:action(suspend|unsuspend|change-plan|send-reset-link|delete)",
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

        // For password reset links, we don't need these checks
        const action = req.params.action as
          | "suspend"
          | "unsuspend"
          | "change-plan"
          | "send-reset-link"
          | "delete";
        
        if (action !== "send-reset-link") {
          if (targetUser.isAdmin && (action === "suspend" || action === "unsuspend" || action === "delete")) {
            return res.status(400).send(`Cannot ${action} admin users`);
          }

          if (targetUser.id === req.user.id && (action === "suspend" || action === "delete")) {
            return res.status(400).send(`Cannot ${action} yourself`);
          }
        }

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
        } else if (action === "send-reset-link") {
          try {
            // Import needed functions
            const { sendPasswordResetEmail } = await import("./services/email");
            
            // Create password reset token
            const [token] = await db
              .insert(passwordResetTokens)
              .values({
                userId: targetUser.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
              })
              .returning();

            // Send password reset email
            const success = await sendPasswordResetEmail(targetUser.email, token.token);

            if (success) {
              res.json({ message: `Password reset link sent to ${targetUser.email} successfully` });
            } else {
              res.status(500).json({ error: "Failed to send password reset email" });
            }
          } catch (error) {
            console.error("Error sending password reset link:", error);
            res.status(500).json({ error: "Failed to send password reset link" });
          }
        } else if (action === "delete") {
          // Handle user deletion
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
            res.status(500).json({ error: "Failed to delete user and associated data" });
          }
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
          totalApiCalls: sql`0`,
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

      // Get reports
      const reportStats = await db
        .select({
          monthlyReportsGenerated: sql`count(*) filter (where ${propertyAnalyzerResults.createdAt} >= ${startOfMonth})`,
          totalReportsGenerated: sql`count(*)`,
        })
        .from(propertyAnalyzerResults)
        .then((rows) => rows[0]);

      res.json({
        ...userStats,
        monthlyApiCalls: 0,
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

    try {
      const data = await trackPriceLabsApiCall({
        userId: req.user!.id,
        endpoint: "/api/revenue-data",
        url: `https://api.pricelabs.co/v1/revenue/estimator?version=2&address=${encodeURIComponent(String(address))}&currency=ZAR&bedroom_category=${bedrooms}`
      });

      res.json(data);
    } catch (error) {
      console.error("Error fetching from PriceLabs:", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  // Public PriceLabs API proxy endpoint for the Deal Score page
  app.get("/api/public-revenue-data", async (req, res) => {
    const { address, bedrooms, test } = req.query;
    
    console.log("Public revenue data request:", { address, bedrooms, test });
    
    // Check if test parameter was passed or if we want to force test mode
    // You can easily toggle this to control test vs production mode
    const useTestMode = test === 'true' || true; // Set to 'true' to force test mode, 'false' for production

    if (!address || !bedrooms) {
      return res
        .status(400)
        .json({ error: "Address and bedrooms are required" });
    }

    const startTime = Date.now();
    let success = false;

    try {
      console.log(`Revenue data mode: ${useTestMode ? "TEST" : "PRODUCTION"}`);
      
      if (useTestMode) {
        // Generate a consistent test response based on the property details
        console.log("Using test mode for consistent data");
        
        // Ensure bedrooms is properly formatted
        const formattedBedrooms = String(bedrooms).toLowerCase() === 'studio' ? '0' 
                                : String(bedrooms).toLowerCase() === 'room' ? '-1'
                                : String(bedrooms);
        
        // Convert address to string to handle any unexpected input types
        const addressStr = String(address);
        
        // Create test data with slight randomization based on address length for variety
        const addressFactor = (addressStr.length % 5) * 100;
        const bedroomsFactor = parseInt(formattedBedrooms) || 1;
        
        // Calculate test values that scale with property size
        const baseRate = 2000 + (bedroomsFactor * 500) + addressFactor;
        const premiumRate = baseRate * 1.15;
        
        success = true;
        
        // Return the mock data response with a structure that matches the PriceLabs API
        return res.json({
          KPIsByBedroomCategory: {
            [formattedBedrooms]: {
              adr: baseRate,
              occupancy: 60 + (bedroomsFactor * 2),
              market_occupancy: 65,
              market_adr: baseRate,
              sample_size: 15 + (bedroomsFactor * 3),
              ADR75PercentileAvg: premiumRate, // For nightlyRateValue in client
              AvgAdjustedOccupancy: 60 + (bedroomsFactor * 2)  // For occupancyValue in client
            }
          },
          address: addressStr,
          destination_id: "test-destination",
          destination_name: "Cape Town, South Africa",
          bedroom_category: parseInt(formattedBedrooms) || 0,
          status: "success",
          testMode: true
        });
      }
      
      // Uncomment this section once we confirm the endpoint is being called correctly
      /*
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
      */
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
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { currentPassword, newPassword } = req.body;
    console.log("Password change request for user:", req.user!.id);

    try {
      // Verify current password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      console.log("User found:", user ? "Yes" : "No");
      
      const isMatch = await crypto.compare(currentPassword, user.password);
      console.log("Current password matches:", isMatch);
      
      if (!isMatch) {
        return res.status(400).send("Current password is incorrect");
      }

      // Hash new password and update
      const hashedPassword = await crypto.hash(newPassword);
      console.log("New password hashed, length:", hashedPassword.length);
      
      const updateResult = await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, req.user!.id))
        .returning({ id: users.id, updatedAt: users.updatedAt });

      console.log("Database update result:", updateResult);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
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

      // Check if user belongs to an agency with billing enabled
      let shouldChargeAgency = false;
      let agencyBranchId = null;
      
      if (user?.branchId) {
        const [billingSettings] = await db
          .select()
          .from(agencyBillingSettings)
          .where(eq(agencyBillingSettings.agencyBranchId, user.branchId))
          .limit(1);
        
        if (billingSettings?.billingEnabled) {
          shouldChargeAgency = true;
          agencyBranchId = user.branchId;
        }
      }

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

      // If agency billing is enabled, track the report charge
      if (shouldChargeAgency && agencyBranchId) {
        await trackAgencyReportUsage(agencyBranchId, user.id, req.body.address);
      }

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

  // Get single property analyzer result
  app.get("/api/property-analyzer/properties/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).send("Invalid property ID");
    }

    try {
      const [property] = await db
        .select()
        .from(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.id, propertyId))
        .limit(1);

      if (!property) {
        return res.status(404).send("Property not found");
      }

      if (property.userId !== req.user.id) {
        return res.status(403).send("Not authorized to view this property");
      }

      res.json(property);
    } catch (error) {
      console.error("Error fetching property analyzer result:", error);
      res.status(500).json({
        error: "Failed to fetch property analyzer result",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // Update (re-save) a property analyzer result
  app.put("/api/property-analyzer/properties/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).send("Invalid property ID");
    }

    try {
      const [existing] = await db
        .select({ userId: propertyAnalyzerResults.userId })
        .from(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.id, propertyId))
        .limit(1);

      if (!existing) {
        return res.status(404).send("Property not found");
      }
      if (existing.userId !== req.user.id) {
        return res.status(403).send("Not authorized");
      }

      const [updated] = await db
        .update(propertyAnalyzerResults)
        .set({
          ...req.body,
          userId: req.user!.id,
          updatedAt: new Date(),
        })
        .where(eq(propertyAnalyzerResults.id, propertyId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating property analysis:", error);
      res.status(500).json({
        error: "Failed to update property analysis",
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



  // Generate a shareable link for a property analysis
  app.post("/api/property-analyzer/properties/:id/share", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).send("Invalid property ID");
    }

    try {
      const [property] = await db
        .select()
        .from(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.id, propertyId))
        .limit(1);

      if (!property) return res.status(404).send("Property not found");
      if (property.userId !== req.user.id) return res.status(403).send("Not authorized");

      // Reuse existing token or generate a new one
      const token = property.shareToken || randomUUID();

      if (!property.shareToken) {
        await db
          .update(propertyAnalyzerResults)
          .set({ shareToken: token })
          .where(eq(propertyAnalyzerResults.id, propertyId));
      }

      res.json({ token });
    } catch (error) {
      console.error("Error generating share token:", error);
      res.status(500).json({ error: "Failed to generate share link" });
    }
  });

  // Public endpoint — view a shared analysis (no auth required)
  app.get("/api/property-analyzer/shared/:token", async (req, res) => {
    try {
      const [property] = await db
        .select()
        .from(propertyAnalyzerResults)
        .where(eq(propertyAnalyzerResults.shareToken, req.params.token))
        .limit(1);

      if (!property) return res.status(404).send("Analysis not found");

      res.json(property);
    } catch (error) {
      console.error("Error fetching shared analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
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
          totalApiCalls: sql`0`,
        })
        .from(users)
        .then((rows) => rows[0]);

      // Get reports generated
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
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
        monthlyApiCalls: 0,
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

  // Contest rental estimate endpoint
  app.post("/api/contest-rental-estimate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const {
        propertyId,
        currentEstimate,
        propertyDetails,
        userFeedback,
        conversationHistory
      } = req.body;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Build conversation context
      const messages = [
        {
          role: "system" as const,
          content: `You are a property rental expert helping to refine rental estimates based on user feedback. 
          
          Current rental estimate: R${currentEstimate.min}-R${currentEstimate.max}/month
          Property details: ${propertyDetails.address}, ${propertyDetails.bedrooms} bed, ${propertyDetails.bathrooms} bath, ${propertyDetails.floorSize}m², ${propertyDetails.propertyType}, Price: R${propertyDetails.price}
          AI reasoning: ${currentEstimate.reasoning}
          
          The user is contesting this estimate. Consider their local knowledge and feedback carefully. If their concerns are valid, provide a revised estimate range. Respond conversationally and explain your reasoning.
          
          If you provide a new estimate, format it exactly like this at the end of your response:
          NEW_ESTIMATE: {"min": 15000, "max": 18000}
          
          Be helpful and acknowledge the user's local knowledge while providing professional insights.`
        },
        ...conversationHistory.slice(-5), // Include last 5 messages for context
        {
          role: "user" as const,
          content: userFeedback
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content || "";
      
      // Extract new estimate if provided
      let newEstimate = null;
      const estimateMatch = aiResponse.match(/NEW_ESTIMATE:\s*({[^}]+})/);
      if (estimateMatch) {
        try {
          newEstimate = JSON.parse(estimateMatch[1]);
        } catch (e) {
          console.error("Failed to parse new estimate:", e);
        }
      }

      // Clean response by removing the NEW_ESTIMATE part
      const cleanResponse = aiResponse.replace(/NEW_ESTIMATE:\s*{[^}]+}/, '').trim();

      res.json({
        response: cleanResponse,
        newEstimate
      });

    } catch (error) {
      console.error("Error in contest rental estimate:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Update rental performance data
  app.patch("/api/rental-performance/:propertyId/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { propertyId } = req.params;
      const { longTerm } = req.body;
      const userId = req.user.id;

      // Update the rental performance data
      await db
        .update(rentalPerformanceData)
        .set({
          longTermMinRental: longTerm.minRental,
          longTermMaxRental: longTerm.maxRental,
          longTermReasoning: longTerm.reasoning,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(rentalPerformanceData.propertyId, propertyId),
            eq(rentalPerformanceData.userId, userId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating rental performance:", error);
      res.status(500).json({ error: "Failed to update rental performance" });
    }
  });

  // Automated billing management endpoints
  app.post("/api/admin/trigger-billing", async (req, res) => {
    try {
      const { triggerManualBilling } = await import('./billing/automated-billing');
      await triggerManualBilling();
      res.json({ success: true, message: "Manual billing triggered successfully" });
    } catch (error) {
      console.error("Manual billing failed:", error);
      res.status(500).json({ error: "Failed to trigger manual billing" });
    }
  });

  app.get("/api/admin/billing-preview/:year/:month", async (req, res) => {
    try {
      const { year, month } = req.params;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 1);
      
      // Get usage data for preview
      const monthlyUsage = await db
        .select({
          agencyId: reportGenerations.agencyId,
          agencyName: reportGenerations.agencyName,
          reportCount: sql<number>`COUNT(*)::int`,
        })
        .from(reportGenerations)
        .where(
          and(
            gte(reportGenerations.timestamp, startDate),
            lt(reportGenerations.timestamp, endDate)
          )
        )
        .groupBy(reportGenerations.agencyId, reportGenerations.agencyName);

      // Calculate tiered billing for each agency
      const billingPreview = monthlyUsage.map(usage => {
        let amount = 0;
        let remaining = usage.reportCount;
        
        // Tier 1: 1-50 reports at R200 each
        if (remaining > 0) {
          const tier1Count = Math.min(remaining, 50);
          amount += tier1Count * 200;
          remaining -= tier1Count;
        }
        
        // Tier 2: 51-100 reports at R180 each
        if (remaining > 0) {
          const tier2Count = Math.min(remaining, 50);
          amount += tier2Count * 180;
          remaining -= tier2Count;
        }
        
        // Tier 3: 101-150 reports at R160 each
        if (remaining > 0) {
          const tier3Count = Math.min(remaining, 50);
          amount += tier3Count * 160;
          remaining -= tier3Count;
        }
        
        // Tier 4: 151-200 reports at R140 each
        if (remaining > 0) {
          const tier4Count = Math.min(remaining, 50);
          amount += tier4Count * 140;
          remaining -= tier4Count;
        }
        
        // Tier 5: 200+ reports at R140 each
        if (remaining > 0) {
          amount += remaining * 140;
        }
        
        return {
          agencyId: usage.agencyId,
          agencyName: usage.agencyName,
          reportCount: usage.reportCount,
          amount
        };
      });

      res.json({ billingPreview, totalAgencies: billingPreview.length });
    } catch (error) {
      console.error("Failed to generate billing preview:", error);
      res.status(500).json({ error: "Failed to generate billing preview" });
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



  // Get rental performance data for a specific property
  app.get("/api/rental-performance/:propertyId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { propertyId } = req.params;
    
    try {
      // Try multiple property ID formats for better matching
      const rentalData = await db.execute(sql`
        SELECT * FROM rental_performance_data 
        WHERE user_id = ${req.user.id} 
        AND (
          property_id = ${propertyId} 
          OR property_id = ${propertyId.toString()}
          OR property_id = ${parseInt(propertyId) || propertyId}
        )
        ORDER BY created_at DESC
        LIMIT 1
      `);

      if (!rentalData.rows || rentalData.rows.length === 0) {
        console.log(`No rental data found for property ID: ${propertyId}, user ID: ${req.user.id}`);
        return res.status(404).json({ error: "Rental data not found" });
      }

      console.log(`Found rental data for property ID: ${propertyId}`);
      res.json(rentalData.rows[0]);
    } catch (error) {
      console.error("Error fetching rental performance data:", error);
      res.status(500).json({ error: "Failed to fetch rental data" });
    }
  });

  // Register property scraper routes
  app.use("/api", propertyScraper);
  app.use('/api/deal-advisor', dealAdvisorRouter);
  app.use('/api/address-validation', addressValidationRouter);
  app.use('/api/traffic-data', trafficDataRouter);
  app.use('/api/tomtom-test', tomtomTestRouter);
  app.use('/api', propdataListingsRouter);
  app.use('/api', fetchPropdataRouter);
  app.use('/api', valuationRouter);
  app.use('/api', agenciesRouter);
  app.use('/api/admin/invitations', adminInvitationsRouter);
  app.use('/api', branchAdminRouter);
  app.use('/api', agencyProfileRouter);
  app.use('/api/propdata-debug', propdataDebugRouter);
  // PDF reports routes - integrated directly to avoid Vite routing conflicts
  // Test endpoint for basic PDF generation
  app.get('/api/pdf-test', async (req, res) => {
    try {
      console.log('Testing basic PDF generation...');
      const { SimplePdfTest } = await import('./services/simplePdfTest.js');
      const pdfBuffer = await SimplePdfTest.createTestPdf();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('PDF test failed:', error);
      res.status(500).json({ 
        error: 'Test PDF generation failed',
        details: error.message 
      });
    }
  });

  // Generate property PDF report
  app.get('/api/pdf-generate/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      console.log(`Generating PDF report for property ${propertyId}`);
      
      const { PropdataPdfService } = await import('./services/propdataPdfService.js');
      const pdfBuffer = await PropdataPdfService.generateReport(propertyId);
      
      // Log download activity
      try {
        const { logReportActivity } = await import('./routes/report-activity.js');
        await logReportActivity({
          propertyId: propertyId,
          activityType: 'downloaded',
          recipientEmail: req.user?.email || 'user@download.com',
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          userId: req.user?.id
        });
      } catch (logError) {
        console.error('Failed to log download activity:', logError);
        // Continue with download even if logging fails
      }
      
      const filename = `Proply_Report_${propertyId}_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({ 
        error: 'Failed to generate PDF report',
        details: error.message,
        propertyId: req.params.propertyId
      });
    }
  });

  // PDF reports routes - keep original router for completeness
  app.use('/api/propdata-reports', propdataReportsRouter);
  app.use('/api/report-activity', reportActivityRouter);
  
  // Image sync endpoint for comprehensive image processing
  app.post("/api/sync-missing-images", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      console.log("Starting comprehensive image sync...");
      const result = await imageSyncService.syncMissingImages();
      
      res.json({
        success: result.success,
        message: `Image sync completed: ${result.processedProperties} properties processed, ${result.totalImagesAdded} images added, ${result.errors} errors`,
        processedProperties: result.processedProperties,
        totalImagesAdded: result.totalImagesAdded,
        errors: result.errors
      });
    } catch (error) {
      console.error("Error in image sync endpoint:", error);
      res.status(500).json({ 
        error: "Failed to sync images",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Image optimization endpoint for faster loading
  app.get("/api/optimize-image", async (req, res) => {
    try {
      const { url, width, height, quality } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const targetWidth = parseInt(width as string) || 300;
      const targetHeight = parseInt(height as string) || 300;
      const targetQuality = parseInt(quality as string) || 70;

      // Fetch the original image
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(404).json({ error: "Image not found" });
      }

      const imageBuffer = await response.arrayBuffer();
      
      // Optimize the image with Sharp while preserving aspect ratio
      const optimizedImage = await sharp(Buffer.from(imageBuffer))
        .resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: targetQuality,
          progressive: true
        })
        .toBuffer();

      // Set appropriate headers for better caching and performance
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable', // 7 days cache with immutable flag
        'Content-Length': optimizedImage.length.toString(),
        'ETag': `"${Buffer.from(url).toString('base64')}-${targetWidth}x${targetHeight}-q${targetQuality}"`,
        'Vary': 'Accept-Encoding'
      });

      res.send(optimizedImage);
    } catch (error) {
      console.error("Error optimizing image:", error);
      res.status(500).json({ error: "Failed to optimize image" });
    }
  });
  
  // Public area rate endpoint that doesn't require authentication
  app.post("/api/area-rate", async (req, res) => {
    try {
      const { address, propertyType = "apartment", publicAccess, bypassAuth, luxuryRating } = req.body;
      
      // Validate that this is actually a public request
      if (!publicAccess && !bypassAuth) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized access to public endpoint"
        });
      }
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: "Address is required"
        });
      }
      
      // Import the area rate service 
      const { getAreaRate } = await import("./services/areaRateService");
      
      console.log(`Public area rate request for ${address} (${propertyType})`);
      
      // Get the area rate using the service
      const areaRate = await getAreaRate(
        address, 
        propertyType, 
        luxuryRating ? Number(luxuryRating) : undefined
      );
      
      return res.json({
        success: true,
        areaRate
      });
    } catch (error) {
      console.error("Error getting area rate:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Rental Performance API endpoint
  app.post("/api/rental-performance", getRentalPerformance);

  // Agency billing toggle endpoint  
  app.put("/api/admin/agencies/:agencyId/billing", async (req, res) => {
    try {
      console.log('Billing toggle endpoint hit:', req.params, req.body);
      console.log('User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
      
      const { agencyId } = req.params;
      const { billingEnabled } = req.body;
      
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'system_admin')) {
        console.log('Access denied - user role:', req.user?.role);
        return res.status(403).json({ error: "Admin access required" });
      }

      // Import agency billing settings from schema
      const { agencyBillingSettings, agencyBranches } = await import("@db/schema");
      
      // Find the agency branch by the slug (string ID)
      const agencyBranch = await db.query.agencyBranches.findFirst({
        where: eq(agencyBranches.slug, agencyId)
      });

      if (!agencyBranch) {
        return res.status(404).json({ error: "Agency not found" });
      }

      // If trying to enable billing, check for payment methods first
      if (billingEnabled) {
        const { agencyPaymentMethods } = await import("@db/schema");
        const paymentMethods = await db.query.agencyPaymentMethods.findMany({
          where: eq(agencyPaymentMethods.agencyBranchId, agencyBranch.id)
        });

        const activePaymentMethods = paymentMethods.filter(pm => pm.isActive);
        
        if (activePaymentMethods.length === 0) {
          return res.status(400).json({ 
            error: "Cannot enable billing without payment methods",
            message: "A valid payment method must be added by the branch or franchise administrator before billing can be enabled. Please contact your agency administrator to add payment details."
          });
        }
      }

      // Check if billing settings exist, create if not
      let billingSettings = await db.query.agencyBillingSettings.findFirst({
        where: eq(agencyBillingSettings.agencyBranchId, agencyBranch.id)
      });

      if (!billingSettings) {
        // Create initial billing settings
        await db.insert(agencyBillingSettings).values({
          agencyBranchId: agencyBranch.id,
          billingEnabled: billingEnabled,
          pricePerReport: "200.00",
          billingDay: 1,
          autoBilling: true
        });
        
        billingSettings = await db.query.agencyBillingSettings.findFirst({
          where: eq(agencyBillingSettings.agencyBranchId, agencyBranch.id)
        });
      } else {
        // Update existing billing settings
        await db.update(agencyBillingSettings)
          .set({ 
            billingEnabled: billingEnabled,
            updatedAt: new Date()
          })
          .where(eq(agencyBillingSettings.agencyBranchId, agencyBranch.id));
      }

      res.json({ 
        success: true, 
        billingEnabled,
        message: `Billing ${billingEnabled ? 'enabled' : 'disabled'} for agency`
      });
    } catch (error) {
      console.error("Error updating billing status:", error);
      res.status(500).json({ error: "Failed to update billing status" });
    }
  });

  // Test payment for agency
  app.post('/api/admin/agencies/:agencyId/test-payment', async (req, res) => {
    console.log('=== TEST PAYMENT ENDPOINT HIT ===', { 
      agencyId: req.params.agencyId, 
      body: req.body,
      authenticated: req.isAuthenticated(),
      user: req.user?.email 
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    try {
      const user = req.user;
      if (!user || (user.role !== 'system_admin' && user.role !== 'admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { agencyId } = req.params;
      const { amount } = req.body;

      if (!amount || amount < 2 || amount > 1000) {
        return res.status(400).json({ error: 'Test amount must be between R2 and R1000' });
      }

      // Find the agency branch by slug
      const agencyBranch = await db.query.agencyBranches.findFirst({
        where: eq(agencyBranches.slug, agencyId)
      });

      if (!agencyBranch) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // Get agency payment methods
      const { agencyPaymentMethods } = await import("@db/schema");
      const paymentMethods = await db.query.agencyPaymentMethods.findMany({
        where: eq(agencyPaymentMethods.agencyBranchId, agencyBranch.id)
      });

      if (paymentMethods.length === 0) {
        return res.status(400).json({ error: 'No payment methods found for this agency' });
      }

      // Use the first available payment method (agency payment methods don't have isPrimary field)
      const primaryMethod = paymentMethods[0];
      
      console.log('Payment method details:', {
        id: primaryMethod.id,
        tokenLength: primaryMethod.payfastToken?.length,
        cardLast4: primaryMethod.cardLastFour,
        isActive: primaryMethod.isActive
      });

      // Get PayFast mode setting from database
      const payfastModeSetting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'payfast_test_mode')
      });
      
      const isTestMode = payfastModeSetting?.value === 'true';
      
      // Initialize PayFast service
      const { PayFastService } = await import('./services/payfast');
      const payfast = new PayFastService(isTestMode);

      console.log('PayFast payment request details:', {
        mode: isTestMode ? 'TEST' : 'LIVE',
        amount: amount,
        hasToken: !!primaryMethod.payfastToken,
        tokenPrefix: primaryMethod.payfastToken?.substring(0, 10) + '...'
      });

      // Create PayFast ad-hoc charge
      const chargeRequest = {
        amount: amount,
        item_name: 'Test Payment',
        item_description: `Test payment for ${agencyBranch.franchiseName} - ${agencyBranch.branchName}`,
        m_payment_id: `test-${Date.now()}-${agencyId}`
      };

      console.log('PayFast charge request:', JSON.stringify(chargeRequest, null, 2));

      // First validate the token before attempting charge
      const tokenValidation = await payfast.validateToken(primaryMethod.payfastToken);
      
      if (!tokenValidation.isValid) {
        console.error('PayFast token validation failed:', tokenValidation);
        return res.status(400).json({ 
          error: `Payment method invalid: ${tokenValidation.error}. Please add a new payment method.`,
          requiresReTokenization: true
        });
      }

      console.log('PayFast token validation successful:', tokenValidation.details);

      // Charge the PayFast token
      const payfastResponse = await payfast.chargeToken(primaryMethod.payfastToken, chargeRequest);
      
      console.log('PayFast API response:', payfastResponse);

      // Handle Z2 error (amount below merchant limit)
      if (payfastResponse.code === 200 && payfastResponse.status === 'success' && 
          payfastResponse.data?.response?.code === 'Z2') {
        console.log(`PayFast authentication successful but amount R${amount} below merchant limit (Z2)`);
        return res.status(400).json({ 
          error: `Test amount R${amount} is below this merchant's minimum limit. Try R200 or higher. PayFast authentication is working correctly.`,
          code: 'Z2',
          note: 'PayFast integration is functioning - this merchant account has a higher minimum than the standard R2 platform minimum'
        });
      }

      if (payfastResponse.code !== 200 || payfastResponse.status !== 'success') {
        console.error('PayFast test payment error:', payfastResponse);
        return res.status(400).json({ 
          error: payfastResponse.message || 'Test payment failed' 
        });
      }

      // If we reach here, payment was successful
      const transactionId = payfastResponse.data?.pf_payment_id || `test-${Date.now()}`;
      
      console.log(`Test payment successful for agency ${agencyId}: R${amount} - Transaction ID: ${transactionId} - Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

      // Create manual invoice for test payment using direct SQL to match actual database schema
      const { sql } = await import("drizzle-orm");
      const currentDate = new Date();
      const invoiceNumber = `MAN-${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${agencyId.toUpperCase()}-${Date.now()}`;
      
      // Create a dummy billing cycle for manual payments to avoid linking to real cycles
      const manualCycleResult = await db.execute(sql`
        INSERT INTO agency_billing_cycles (
          agency_branch_id,
          billing_period,
          report_count,
          price_per_report,
          subtotal,
          vat_amount,
          total_amount,
          status,
          due_date,
          paid_at
        ) VALUES (
          ${agencyBranch.id},
          'MANUAL',
          0,
          ${amount},
          ${amount},
          0,
          ${amount},
          'paid',
          ${currentDate},
          ${currentDate}
        ) RETURNING id
      `);

      const cycleId = manualCycleResult.rows[0]?.id || 1;

      // Insert invoice using the manual billing cycle
      await db.execute(sql`
        INSERT INTO agency_invoices (
          agency_branch_id, 
          billing_cycle_id,
          invoice_number, 
          issue_date, 
          due_date, 
          subtotal, 
          vat_amount, 
          total_amount, 
          status, 
          paid_at, 
          invoice_type
        ) VALUES (
          ${agencyBranch.id}, 
          ${cycleId},
          ${invoiceNumber}, 
          ${currentDate}, 
          ${currentDate}, 
          ${amount.toString()}, 
          '0', 
          ${amount.toString()}, 
          'paid', 
          ${currentDate}, 
          'manual'
        )
      `);

      // Create transaction record
      const { createId } = await import("@paralleldrive/cuid2");
      const transactionRecordId = createId();
      
      await db.execute(sql`
        INSERT INTO transaction_history (
          transaction_id,
          invoice_id,
          agency_id,
          amount,
          payfast_transaction_id,
          payfast_payment_id,
          status,
          gateway_response,
          processed_at
        ) VALUES (
          ${transactionRecordId},
          ${invoiceNumber},
          ${agencyId},
          ${amount},
          ${transactionId},
          ${transactionId},
          'completed',
          ${JSON.stringify(payfastResponse)},
          ${currentDate}
        )
      `);

      console.log(`Manual invoice created: ${invoiceNumber}, Transaction recorded: ${transactionRecordId} for R${amount} - Transaction ID: ${transactionId}`);

      res.json({
        success: true,
        transactionId,
        invoiceNumber,
        amount,
        mode: isTestMode ? 'test' : 'live',
        message: `Test payment completed successfully in ${isTestMode ? 'TEST' : 'LIVE'} mode`,
        refreshCache: true // Signal frontend to refresh data
      });

    } catch (error) {
      console.error('Error processing test payment:', error);
      res.status(500).json({ error: 'Failed to process test payment' });
    }
  });

  // Get report statistics for a specific agency (for admin control panel)
  app.get('/api/agencies/:agencyId/report-stats', async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { agencyId } = req.params;
      
      // Check permissions: system admins can access all agencies, branch/franchise admins can only access their own
      if (user.role !== 'system_admin' && user.role !== 'admin') {
        if (user.role !== 'branch_admin' && user.role !== 'franchise_admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        
        // For branch/franchise admins, verify they're accessing their own agency
        if (user.branchId) {
          const userAgencyBranch = await db.query.agencyBranches.findFirst({
            where: eq(agencyBranches.id, user.branchId)
          });
          
          if (!userAgencyBranch || userAgencyBranch.slug !== agencyId) {
            return res.status(403).json({ error: 'Access denied - can only view your own agency data' });
          }
        } else {
          return res.status(403).json({ error: 'User not associated with any agency' });
        }
      }
      
      // Find the agency branch by slug
      const agencyBranch = await db.query.agencyBranches.findFirst({
        where: eq(agencyBranches.slug, agencyId)
      });

      if (!agencyBranch) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // Get the agency identifier used in report tracking
      const agencyIdentifier = `${agencyBranch.franchiseName}-${agencyBranch.branchName}`;
      const agencyName = agencyBranch.franchiseName;

      // Get monthly report stats for the last 12 months
      const monthlyStats = await db
        .select({
          month: sql`TO_CHAR(DATE_TRUNC('month', ${reportGenerations.timestamp}), 'YYYY-MM')`.as('month'),
          monthName: sql`TO_CHAR(DATE_TRUNC('month', ${reportGenerations.timestamp}), 'Mon YYYY')`.as('month_name'),
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .where(sql`(${reportGenerations.agencyId} = ${agencyIdentifier} OR ${reportGenerations.agencyName} = ${agencyName})`)
        .groupBy(sql`DATE_TRUNC('month', ${reportGenerations.timestamp})`)
        .orderBy(sql`DATE_TRUNC('month', ${reportGenerations.timestamp}) DESC`)
        .limit(12);

      // Get current month stats
      const currentMonth = await db
        .select({
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .where(sql`(${reportGenerations.agencyId} = ${agencyIdentifier} OR ${reportGenerations.agencyName} = ${agencyName}) 
                   AND DATE_TRUNC('month', ${reportGenerations.timestamp}) = DATE_TRUNC('month', CURRENT_DATE)`);

      // Get previous month stats
      const previousMonth = await db
        .select({
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .where(sql`(${reportGenerations.agencyId} = ${agencyIdentifier} OR ${reportGenerations.agencyName} = ${agencyName}) 
                   AND DATE_TRUNC('month', ${reportGenerations.timestamp}) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`);

      // Get total reports
      const totalReports = await db
        .select({
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .where(sql`(${reportGenerations.agencyId} = ${agencyIdentifier} OR ${reportGenerations.agencyName} = ${agencyName})`);

      // Get report type breakdown
      const reportTypes = await db
        .select({
          reportType: reportGenerations.reportType,
          count: sql`COUNT(*)::int`.as('count')
        })
        .from(reportGenerations)
        .where(sql`(${reportGenerations.agencyId} = ${agencyIdentifier} OR ${reportGenerations.agencyName} = ${agencyName})`)
        .groupBy(reportGenerations.reportType)
        .orderBy(sql`COUNT(*) DESC`);

      // Get invoice history from persistent agency_invoices table
      const invoicesQuery = await db.execute(
        sql`SELECT 
          ai.id,
          ai.invoice_number,
          abc.billing_period,
          abc.report_count,
          ai.total_amount,
          ai.issue_date,
          ai.status,
          ai.paid_at
        FROM agency_invoices ai 
        INNER JOIN agency_billing_cycles abc ON ai.billing_cycle_id = abc.id
        WHERE ai.agency_branch_id = ${agencyBranch.id}
        ORDER BY ai.issue_date DESC`
      );

      const invoices = invoicesQuery.rows.map((invoice: any) => {
        // Parse billing period to get month name
        const [year, month] = invoice.billing_period.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;
        
        return {
          id: invoice.invoice_number,
          month: invoice.billing_period,
          monthName,
          reportCount: invoice.report_count,
          amount: parseFloat(invoice.total_amount),
          invoiceDate: new Date(invoice.issue_date).toISOString().split('T')[0],
          status: invoice.status === 'pending' ? 'upcoming' : invoice.status,
          dueDate: new Date(invoice.issue_date).toISOString().split('T')[0] // Use issue date as billing date
        };
      });

      res.json({
        currentMonth: currentMonth[0]?.reports || 0,
        previousMonth: previousMonth[0]?.reports || 0,
        totalReports: totalReports[0]?.reports || 0,
        monthlyStats: monthlyStats.reverse(), // Reverse to show oldest to newest for charts
        reportTypes,
        invoices
      });
    } catch (error) {
      console.error('Error fetching agency report stats:', error);
      res.status(500).json({ error: 'Failed to fetch report statistics' });
    }
  });

  // Download invoice PDF endpoint
  app.get('/api/invoices/:invoiceNumber/download', async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { invoiceNumber } = req.params;

      // Get invoice details with agency information
      const invoiceQuery = await db.execute(
        sql`SELECT 
          ai.id,
          ai.invoice_number,
          ai.issue_date,
          ai.total_amount,
          ai.status,
          ai.paid_at,
          abc.billing_period,
          abc.report_count,
          ab.franchise_name,
          ab.branch_name,
          ab.company_name,
          ab.vat_number,
          ab.registration_number,
          ab.business_address,
          ab.id as agency_branch_id
        FROM agency_invoices ai 
        INNER JOIN agency_billing_cycles abc ON ai.billing_cycle_id = abc.id
        INNER JOIN agency_branches ab ON abc.agency_branch_id = ab.id
        WHERE ai.invoice_number = ${invoiceNumber}`
      );

      if (invoiceQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const invoiceData = invoiceQuery.rows[0];

      // Check permissions: only system admins or agency members can download invoices
      if (user.role !== 'system_admin' && user.role !== 'admin') {
        if (user.role !== 'branch_admin' && user.role !== 'franchise_admin') {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Verify user belongs to this agency
        if (!user.branchId || user.branchId !== invoiceData.agency_branch_id) {
          return res.status(403).json({ error: 'Access denied - can only download your own agency invoices' });
        }
      }

      // Only allow downloads for paid invoices (not upcoming/pending)
      if (invoiceData.status === 'pending') {
        return res.status(400).json({ error: 'Cannot download invoice for upcoming billing period' });
      }

      // Prepare invoice data for PDF generation
      const pdfData = {
        invoiceNumber: String(invoiceData.invoice_number),
        issueDate: String(invoiceData.issue_date),
        billingPeriod: String(invoiceData.billing_period),
        reportCount: Number(invoiceData.report_count),
        totalAmount: parseFloat(String(invoiceData.total_amount)),
        status: String(invoiceData.status),
        paidAt: invoiceData.paid_at ? String(invoiceData.paid_at) : undefined,
        agency: {
          companyName: invoiceData.company_name ? String(invoiceData.company_name) : undefined,
          franchiseName: String(invoiceData.franchise_name),
          branchName: String(invoiceData.branch_name),
          vatNumber: invoiceData.vat_number ? String(invoiceData.vat_number) : undefined,
          registrationNumber: invoiceData.registration_number ? String(invoiceData.registration_number) : undefined,
          businessAddress: invoiceData.business_address ? String(invoiceData.business_address) : undefined
        }
      };

      // Generate PDF
      const pdfBuffer = generateInvoicePDF(pdfData);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF buffer
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ error: 'Failed to generate invoice PDF' });
    }
  });

  // Get payment methods for a specific agency (for admin control panel)
  app.get('/api/agencies/:agencyId/payment-methods', async (req, res) => {
    try {
      const user = req.user;
      if (!user || (user.role !== 'system_admin' && user.role !== 'admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { agencyId } = req.params;
      
      // Find the agency branch by slug
      const agencyBranch = await db.query.agencyBranches.findFirst({
        where: eq(agencyBranches.slug, agencyId)
      });

      if (!agencyBranch) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // Fetch payment methods for this branch
      const paymentMethods = await db.query.agencyPaymentMethods.findMany({
        where: eq(agencyPaymentMethods.agencyBranchId, agencyBranch.id),
        with: {
          addedByUser: {
            columns: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Transform the data to match the expected format
      const transformedMethods = paymentMethods.map(method => ({
        id: method.id,
        cardBrand: method.cardBrand,
        cardLastFour: method.cardLastFour,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isPrimary: false, // We can add this logic later if needed
        addedAt: method.createdAt,
        addedBy: method.addedByUser ? 
          `${method.addedByUser.firstName} ${method.addedByUser.lastName}` : 
          'Unknown'
      }));

      res.json({ paymentMethods: transformedMethods });
    } catch (error) {
      console.error('Error fetching agency payment methods:', error);
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  });

  // Payment Methods API Routes for Agency Billing
  app.get('/api/payment-methods', async (req, res) => {
    try {
      // Simple user lookup - use session if available, otherwise allow ben@proply.co.za for testing
      let user = req.user;
      if (!user) {
        const [testUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, 'ben@proply.co.za'))
          .limit(1);
        user = testUser;
      }

      if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin')) {
        return res.status(403).json({ error: 'Access denied. Branch or franchise admin required.' });
      }

      // Get the user's agency branch
      let branchId = user.branchId;
      
      // For franchise admins, get the first branch of their franchise
      if (user.role === 'franchise_admin' && user.franchiseId) {
        const [firstBranch] = await db
          .select()
          .from(agencyBranches)
          .where(eq(agencyBranches.id, user.franchiseId))
          .limit(1);
        
        if (firstBranch) {
          branchId = firstBranch.id;
        }
      }

      if (!branchId) {
        return res.status(400).json({ error: "No branch associated with user" });
      }

      // Fetch payment methods for this branch
      const paymentMethods = await db.query.agencyPaymentMethods.findMany({
        where: eq(agencyPaymentMethods.agencyBranchId, branchId)
      });

      res.json({ paymentMethods });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  });









  app.delete('/api/payment-methods/:id', async (req, res) => {
    try {
      const user = req.user;
      if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin')) {
        return res.status(403).json({ error: 'Access denied. Branch or franchise admin required.' });
      }

      const paymentMethodId = parseInt(req.params.id);

      // Get the user's agency branch
      let branchId = user.branchId;
      
      // For franchise admins, get the first branch of their franchise
      if (user.role === 'franchise_admin' && user.franchiseId) {
        const [firstBranch] = await db
          .select()
          .from(agencyBranches)
          .where(eq(agencyBranches.id, user.franchiseId))
          .limit(1);
        
        if (firstBranch) {
          branchId = firstBranch.id;
        }
      }

      if (!branchId) {
        return res.status(400).json({ error: "No branch associated with user" });
      }

      // Verify payment method belongs to this branch
      const { agencyPaymentMethods } = await import("@db/schema");
      const paymentMethod = await db.query.agencyPaymentMethods.findFirst({
        where: and(
          eq(agencyPaymentMethods.id, paymentMethodId),
          eq(agencyPaymentMethods.agencyBranchId, branchId)
        )
      });

      if (!paymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      // Delete payment method
      await db
        .delete(agencyPaymentMethods)
        .where(eq(agencyPaymentMethods.id, paymentMethodId));

      res.json({ success: true, message: 'Payment method removed successfully' });

    } catch (error) {
      console.error('Error removing payment method:', error);
      res.status(500).json({ error: 'Failed to remove payment method' });
    }
  });

  // Get agency billing cycles (usage overview)
  app.get("/api/agency-billing/cycles", async (req, res) => {
    try {
      const user = req.user as SelectUser;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Only allow branch/franchise admins
      if (user.role !== 'branch_admin' && user.role !== 'franchise_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get user's branch ID
      let branchId = user.branchId;
      
      if (user.role === 'franchise_admin' && user.franchiseId) {
        const [firstBranch] = await db
          .select()
          .from(agencyBranches)
          .where(eq(agencyBranches.id, user.franchiseId))
          .limit(1);
        
        if (firstBranch) {
          branchId = firstBranch.id;
        }
      }

      if (!branchId) {
        return res.status(400).json({ error: "No branch associated with user" });
      }

      // Get billing cycles for the last 6 months
      const billingCycles = await db
        .select()
        .from(agencyBillingCycles)
        .where(eq(agencyBillingCycles.agencyBranchId, branchId))
        .orderBy(sql`${agencyBillingCycles.billingPeriod} DESC`)
        .limit(6);

      res.json({ billingCycles });
    } catch (error) {
      console.error('Error fetching billing cycles:', error);
      res.status(500).json({ error: "Failed to fetch billing cycles" });
    }
  });

  // Demo request endpoint
  app.post("/api/demo-request", async (req, res) => {
    try {
      const { fullName, email, company, phoneNumber, product, message } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !company || !phoneNumber || !product) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      console.log("Processing demo request:", {
        fullName,
        email,
        company,
        product,
      });
      
      // Send email notification
      const success = await sendDemoRequestEmail({
        fullName,
        email,
        company,
        phoneNumber,
        product,
        message: message || "No additional message provided."
      });
      
      if (success) {
        res.json({ success: true, message: "Demo request submitted successfully" });
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Error processing demo request:", error);
      res.status(500).json({ 
        error: "Failed to process demo request",
        details: error instanceof Error ? error.message : undefined 
      });
    }
  });

  // Save valuation report
  app.post("/api/valuation-reports", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { propertyId, address, price, bedrooms, bathrooms, floorSize, landSize, propertyType, parkingSpaces, valuationData, imagesAnalyzed } = req.body;

      // Calculate price per square meter
      const pricePerSquareMeter = price && floorSize ? price / floorSize : null;

      // Check if valuation already exists for this property and user
      const existingValuation = await db.query.valuationReports.findFirst({
        where: and(eq(valuationReports.propertyId, propertyId), eq(valuationReports.userId, req.user.id))
      });

      if (existingValuation) {
        // Update existing valuation - preserve financial analysis data if it exists
        const updateData: any = {
          address,
          price: price?.toString(),
          bedrooms,
          bathrooms,
          floorSize: floorSize?.toString(),
          landSize: landSize?.toString(),
          propertyType,
          parkingSpaces,
          pricePerSquareMeter: pricePerSquareMeter?.toString(),
          valuationData,
          imagesAnalyzed,
          updatedAt: new Date()
        };

        // Only update financial data fields if they don't exist (preserve existing calculations)
        if (!existingValuation.cashflowAnalysisData) {
          updateData.cashflowAnalysisData = null;
        }
        if (!existingValuation.financingAnalysisData) {
          updateData.financingAnalysisData = null;
        }
        if (!existingValuation.annualPropertyAppreciationData) {
          updateData.annualPropertyAppreciationData = null;
        }

        console.log('Preserving existing financial data for property', propertyId);

        const [updatedValuation] = await db.update(valuationReports)
          .set(updateData)
          .where(eq(valuationReports.id, existingValuation.id))
          .returning();

        res.json(updatedValuation);
      } else {
        // Create new valuation
        const [newValuation] = await db.insert(valuationReports)
          .values({
            userId: req.user.id,
            propertyId,
            address,
            price: price?.toString(),
            bedrooms,
            bathrooms,
            floorSize: floorSize?.toString(),
            landSize: landSize?.toString(),
            propertyType,
            parkingSpaces,
            pricePerSquareMeter: pricePerSquareMeter?.toString(),
            valuationData,
            imagesAnalyzed: imagesAnalyzed || 0
          })
          .returning();

        res.json(newValuation);
      }
    } catch (error) {
      console.error("Error saving valuation report:", error);
      res.status(500).json({ error: "Failed to save valuation report" });
    }
  });

  // Get valuation report for a property
  app.get("/api/valuation-reports/:propertyId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { propertyId } = req.params;
      
      // Anyone can see any valuation report for any property
      const valuation = await db.query.valuationReports.findFirst({
        where: eq(valuationReports.propertyId, propertyId)
      });

      if (valuation) {
        res.json(valuation);
      } else {
        res.status(404).json({ error: "Valuation not found" });
      }
    } catch (error) {
      console.error("Error fetching valuation report:", error);
      res.status(500).json({ error: "Failed to fetch valuation report" });
    }
  });

  // Calculate and save financial data for a property
  app.post("/api/calculate-financial-data", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { propertyId, price, valuationReport } = req.body;

      console.log(`Calculating financial data for property ${propertyId}`);
      
      // Get current financing parameters from database or use defaults
      const existingReport = await db.execute(sql`
        SELECT current_deposit_percentage, current_interest_rate, current_loan_term
        FROM valuation_reports 
        WHERE property_id = ${propertyId} AND user_id = ${req.user.id}
        LIMIT 1
      `);
      
      const financingParams = existingReport.rows[0] || {
        current_deposit_percentage: 10,
        current_interest_rate: 11.5,
        current_loan_term: 20
      };

      // 1. ANNUAL PROPERTY APPRECIATION DATA
      // Calculate correct appreciation rate from components instead of using OpenAI's potentially wrong calculation
      const components = valuationReport.propertyAppreciation?.components;
      const calculatedAppreciationRate = components ? 
        components.baseSuburbRate.rate + 
        components.locationPremium.adjustment + 
        components.propertyTypeModifier.adjustment + 
        components.visualConditionAdjustment.adjustment + 
        components.levyImpact.adjustment : 
        (valuationReport.propertyAppreciation?.annualAppreciationRate || 8.0);

      const annualPropertyAppreciationData = {
        baseSuburbRate: valuationReport.propertyAppreciation?.suburbAppreciationRate || 8.0,
        propertyAdjustments: valuationReport.propertyAppreciation?.adjustments || {},
        finalAppreciationRate: calculatedAppreciationRate,
        yearlyValues: (() => {
          const rate = calculatedAppreciationRate / 100;
          return [1, 2, 3, 4, 5, 10, 20].reduce((acc, year) => {
            acc[`year${year}`] = price * Math.pow(1 + rate, year);
            return acc;
          }, {} as Record<string, number>);
        })(),
        reasoning: valuationReport.propertyAppreciation?.reasoning || "Standard market appreciation rate applied automatically"
      };

      // 2. CASHFLOW ANALYSIS DATA
      const shortTermRevenue = valuationReport.rentalEstimates?.shortTerm?.estimatedAnnualRevenue;
      const longTermRevenue = valuationReport.rentalEstimates?.longTerm ? 
        (valuationReport.rentalEstimates.longTerm.minMonthlyRental + valuationReport.rentalEstimates.longTerm.maxMonthlyRental) / 2 * 12 
        : null;

      const cashflowAnalysisData = {
        recommendedStrategy: shortTermRevenue > (longTermRevenue || 0) ? "shortTerm" : "longTerm",
        strategyReasoning: "Automatically calculated based on available rental data",
        revenueGrowthTrajectory: {
          shortTerm: shortTermRevenue ? {
            year1: { revenue: shortTermRevenue, grossYield: (shortTermRevenue / price) * 100 },
            year2: { revenue: shortTermRevenue * 1.08, grossYield: (shortTermRevenue * 1.08 / price) * 100 },
            year3: { revenue: shortTermRevenue * Math.pow(1.08, 2), grossYield: (shortTermRevenue * Math.pow(1.08, 2) / price) * 100 },
            year4: { revenue: shortTermRevenue * Math.pow(1.08, 3), grossYield: (shortTermRevenue * Math.pow(1.08, 3) / price) * 100 },
            year5: { revenue: shortTermRevenue * Math.pow(1.08, 4), grossYield: (shortTermRevenue * Math.pow(1.08, 4) / price) * 100 }
          } : null,
          longTerm: longTermRevenue ? {
            year1: { revenue: longTermRevenue, grossYield: (longTermRevenue / price) * 100 },
            year2: { revenue: longTermRevenue * 1.08, grossYield: (longTermRevenue * 1.08 / price) * 100 },
            year3: { revenue: longTermRevenue * Math.pow(1.08, 2), grossYield: (longTermRevenue * Math.pow(1.08, 2) / price) * 100 },
            year4: { revenue: longTermRevenue * Math.pow(1.08, 3), grossYield: (longTermRevenue * Math.pow(1.08, 3) / price) * 100 },
            year5: { revenue: longTermRevenue * Math.pow(1.08, 4), grossYield: (longTermRevenue * Math.pow(1.08, 4) / price) * 100 }
          } : null
        }
      };

      // 3. FINANCING ANALYSIS DATA
      const depositPercentage = Number(financingParams.current_deposit_percentage) / 100;
      const interestRate = Number(financingParams.current_interest_rate) / 100;
      const loanTermYears = Number(financingParams.current_loan_term);
      const loanTermMonths = loanTermYears * 12;
      
      const depositAmount = price * depositPercentage;
      const loanAmount = price - depositAmount;
      const monthlyInterestRate = interestRate / 12;
      
      const monthlyPayment = (loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths))) / (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);

      const financingAnalysisData = {
        financingParameters: {
          depositAmount,
          depositPercentage: Number(financingParams.current_deposit_percentage),
          loanAmount,
          interestRate: Number(financingParams.current_interest_rate),
          loanTerm: loanTermYears,
          monthlyPayment
        },
        yearlyMetrics: [1, 2, 3, 4, 5, 10, 20].reduce((acc, year) => {
          const monthsElapsed = year * 12;
          let remainingBalance = loanAmount;
          let totalPrincipalPaid = 0;

          for (let month = 1; month <= monthsElapsed && month <= loanTermMonths; month++) {
            const interestPayment = remainingBalance * monthlyInterestRate;
            const principalPayment = monthlyPayment - interestPayment;
            totalPrincipalPaid += principalPayment;
            remainingBalance -= principalPayment;
          }

          acc[`year${year}`] = {
            monthlyPayment,
            equityBuildup: totalPrincipalPaid,
            remainingBalance: Math.max(0, remainingBalance)
          };
          return acc;
        }, {} as Record<string, { monthlyPayment: number; equityBuildup: number; remainingBalance: number }>)
      };

      // Save all financial data to database
      const updateResult = await db.execute(sql`
        UPDATE valuation_reports 
        SET 
          annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
          cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
          financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
          updated_at = NOW()
        WHERE property_id = ${propertyId} AND user_id = ${req.user.id}
      `);

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ error: `No valuation report found for property ${propertyId}` });
      }

      console.log(`Successfully saved financial data for property ${propertyId}`);
      res.json({ success: true, message: "Financial data calculated and saved successfully" });
    } catch (error) {
      console.error("Error calculating financial data:", error);
      res.status(500).json({ error: "Failed to calculate financial data" });
    }
  });

  // Property address update endpoint
  app.patch('/api/properties/:propdataId/address', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { propdataId } = req.params;
      const { address } = req.body;

      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'Address is required' });
      }

      // Update the address in propdata_listings table and mark as manually edited
      const result = await db
        .update(propdataListings)
        .set({ 
          address: address.trim(),
          addressManuallyEdited: true,
          updatedAt: new Date()
        })
        .where(eq(propdataListings.propdataId, propdataId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      res.json({ 
        message: 'Address updated successfully',
        property: result[0]
      });
    } catch (error) {
      console.error('Error updating property address:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  });

  // PriceLabs usage analytics endpoint
  app.get("/api/pricelabs-usage", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const usage = await db
        .select({
          month: sql`TO_CHAR(DATE_TRUNC('month', ${priceLabsUsage.timestamp}), 'YYYY-MM-DD')`.as('month'),
          apiCalls: sql`COUNT(*)::int`.as('api_calls'),
          successfulCalls: sql`SUM(CASE WHEN ${priceLabsUsage.success} THEN 1 ELSE 0 END)::int`.as('successful_calls'),
          failedCalls: sql`SUM(CASE WHEN NOT ${priceLabsUsage.success} THEN 1 ELSE 0 END)::int`.as('failed_calls'),
          avgResponseTime: sql`ROUND(AVG(${priceLabsUsage.responseTime}))::int`.as('avg_response_time')
        })
        .from(priceLabsUsage)
        .groupBy(sql`DATE_TRUNC('month', ${priceLabsUsage.timestamp})`)
        .orderBy(sql`DATE_TRUNC('month', ${priceLabsUsage.timestamp}) DESC`);

      res.json({
        monthlyUsage: usage,
        totalCalls: usage.reduce((sum, month) => sum + Number(month.apiCalls), 0)
      });
    } catch (error) {
      console.error("Error fetching PriceLabs usage:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });

  // Report generation analytics endpoint
  app.get("/api/report-generation-stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const stats = await db
        .select({
          month: sql`TO_CHAR(DATE_TRUNC('month', ${reportGenerations.timestamp}), 'YYYY-MM-DD')`.as('month'),
          totalReports: sql`COUNT(*)::int`.as('total_reports'),
          agencyId: reportGenerations.agencyId,
          agencyName: reportGenerations.agencyName,
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .groupBy(sql`DATE_TRUNC('month', ${reportGenerations.timestamp})`, reportGenerations.agencyId, reportGenerations.agencyName)
        .orderBy(sql`DATE_TRUNC('month', ${reportGenerations.timestamp}) DESC`);

      // Get total reports across all time
      const totalStats = await db
        .select({
          totalReports: sql`COUNT(*)::int`.as('total_reports')
        })
        .from(reportGenerations);

      // Get current month stats
      const currentMonth = await db
        .select({
          totalReports: sql`COUNT(*)::int`.as('total_reports')
        })
        .from(reportGenerations)
        .where(sql`DATE_TRUNC('month', ${reportGenerations.timestamp}) = DATE_TRUNC('month', CURRENT_DATE)`);

      // Get top agencies for current month
      const topAgencies = await db
        .select({
          agencyName: reportGenerations.agencyName,
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .where(sql`DATE_TRUNC('month', ${reportGenerations.timestamp}) = DATE_TRUNC('month', CURRENT_DATE)`)
        .groupBy(reportGenerations.agencyName)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(3);

      res.json({
        totalReports: totalStats[0]?.totalReports || 0,
        currentMonthReports: currentMonth[0]?.totalReports || 0,
        topAgencies,
        monthlyStats: stats
      });
    } catch (error) {
      console.error("Error fetching report generation stats:", error);
      res.status(500).json({ error: "Failed to fetch report stats" });
    }
  });

  // Individual agency report statistics endpoint
  app.get("/api/agency-report-stats/:agencyName", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const { agencyName } = req.params;

    try {
      // Get all reports for this agency
      const reports = await db
        .select({
          id: reportGenerations.id,
          propertyId: reportGenerations.propertyId,
          reportType: reportGenerations.reportType,
          timestamp: reportGenerations.timestamp,
          userId: reportGenerations.userId,
        })
        .from(reportGenerations)
        .where(eq(reportGenerations.agencyName, agencyName))
        .orderBy(sql`${reportGenerations.timestamp} DESC`);

      // Get monthly breakdown
      const monthlyStats = await db
        .select({
          month: sql`TO_CHAR(DATE_TRUNC('month', ${reportGenerations.timestamp}), 'YYYY-MM')`.as('month'),
          reports: sql`COUNT(*)::int`.as('reports')
        })
        .from(reportGenerations)
        .where(eq(reportGenerations.agencyName, agencyName))
        .groupBy(sql`DATE_TRUNC('month', ${reportGenerations.timestamp})`)
        .orderBy(sql`DATE_TRUNC('month', ${reportGenerations.timestamp}) DESC`)
        .limit(12);

      // Get report type breakdown
      const reportTypeStats = await db
        .select({
          reportType: reportGenerations.reportType,
          count: sql`COUNT(*)::int`.as('count')
        })
        .from(reportGenerations)
        .where(eq(reportGenerations.agencyName, agencyName))
        .groupBy(reportGenerations.reportType)
        .orderBy(sql`COUNT(*) DESC`);

      // Get total stats
      const totalReports = reports.length;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const currentMonthReports = monthlyStats.find(stat => stat.month === currentMonth)?.reports || 0;

      res.json({
        agencyName,
        totalReports,
        currentMonthReports,
        reports,
        monthlyStats,
        reportTypeStats
      });
    } catch (error) {
      console.error("Error fetching agency report stats:", error);
      res.status(500).json({ error: "Failed to fetch agency report stats" });
    }
  });

  // System Settings API endpoints
  app.get('/api/system-settings/:key', async (req, res) => {
    try {
      const user = req.user as SelectUser;
      if (!user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { key } = req.params;
      const setting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, key)
      });

      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      res.json(setting);
    } catch (error) {
      console.error('Error fetching system setting:', error);
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  app.put('/api/system-settings/:key', async (req, res) => {
    try {
      const user = req.user as SelectUser;
      if (!user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { key } = req.params;
      const { value } = req.body;

      // Update or create the setting
      await db.insert(systemSettings)
        .values({
          key,
          value,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value,
            updatedAt: new Date()
          }
        });

      const updatedSetting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, key)
      });

      res.json(updatedSetting);
    } catch (error) {
      console.error('Error updating system setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  // Yoco public key endpoint
  app.get('/api/yoco/public-key', async (req, res) => {
    try {
      const isTestMode = req.query.test === 'true';
      const publicKey = isTestMode 
        ? process.env.YOCO_TEST_PUBLIC_KEY 
        : process.env.YOCO_PUBLIC_KEY;
      
      if (!publicKey) {
        console.error('Missing Yoco public key:', { isTestMode });
        return res.status(500).json({ error: 'Yoco public key not configured' });
      }
      
      res.json({ publicKey });
    } catch (error) {
      console.error('Error getting Yoco public key:', error);
      res.status(500).json({ error: 'Failed to get public key' });
    }
  });



  // PayFast Routes
  app.get('/api/payfast/config', async (req, res) => {
    try {
      const user = req.user;
      if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin')) {
        return res.status(403).json({ error: 'Access denied. Branch or franchise admin required.' });
      }

      // For now, default to test mode - in production this would be a system setting
      const isTestMode = true;
      
      res.json({ 
        isTestMode,
        message: 'PayFast tokenization requires server-side processing'
      });

    } catch (error) {
      console.error('Error getting PayFast config:', error);
      res.status(500).json({ error: 'Failed to get payment configuration' });
    }
  });

  app.post('/api/payfast/create-tokenize-url', async (req, res) => {
    try {
      const user = req.user;
      if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin')) {
        return res.status(403).json({ error: 'Access denied. Branch or franchise admin required.' });
      }

      // Get the user's agency branch
      let branchId = user.branchId;
      
      if (user.role === 'franchise_admin' && user.franchiseId) {
        const [firstBranch] = await db
          .select()
          .from(agencyBranches)
          .where(eq(agencyBranches.id, user.franchiseId))
          .limit(1);
        
        if (firstBranch) {
          branchId = firstBranch.id;
        }
      }

      if (!branchId) {
        return res.status(400).json({ error: "No branch associated with user" });
      }

      // Import required modules
      const { createId } = await import('@paralleldrive/cuid2');
      const { payfastTokenizationSessions } = await import('@db/schema');
      
      // Create a unique session ID for tracking
      const sessionId = createId();
      
      // Store the tokenization session
      await db.insert(payfastTokenizationSessions).values({
        sessionId,
        userId: user.id,
        agencyBranchId: branchId,
        status: 'pending'
      });

      // Import PayFast service
      const { PayFastService } = await import('./services/payfast');
      const payfast = new PayFastService(true);
      
      // Use production domain for live deployment
      const baseUrl = 'https://app.proply.co.za';
      const returnUrl = `${baseUrl}/payment-setup-success?session=${sessionId}`;
      const cancelUrl = `${baseUrl}/payment-setup-cancel?session=${sessionId}`;
      
      console.log('PayFast URL configuration:', {
        baseUrl,
        returnUrl,
        cancelUrl,
        sessionId,
        userId: user.id,
        branchId
      });
      
      // Create tokenization URL (amount 0 for tokenization)
      const tokenizeUrl = await payfast.createTokenizeUrl(returnUrl, cancelUrl, 0, sessionId);
      
      res.json({ 
        success: true,
        tokenizeUrl,
        sessionId,
        message: 'Redirect user to this URL to setup payment method'
      });

    } catch (error) {
      console.error('Error creating PayFast tokenize URL:', error);
      res.status(500).json({ error: 'Failed to create tokenization URL' });
    }
  });

  // PayFast return URL handler (for success/cancel redirects)
  app.get('/api/payfast/return', async (req, res) => {
    const { token, session } = req.query;
    
    try {
      console.log('PayFast return URL accessed:', { token, session });
      
      // Determine the correct redirect URL based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction ? 'https://app.proply.co.za' : 'http://localhost:5000';
      
      if (token === 'success') {
        // Redirect to payment setup success page
        res.redirect(`${baseUrl}/payment-setup-success?session=${session}`);
      } else if (token === 'cancelled') {
        // Redirect to payment setup cancel page  
        res.redirect(`${baseUrl}/payment-setup-cancel?session=${session}`);
      } else {
        // Unknown token, redirect to settings with error
        res.redirect(`${baseUrl}/settings?error=payment_error`);
      }
    } catch (error) {
      console.error('Error handling PayFast return:', error);
      const baseUrl = process.env.NODE_ENV === 'production' ? 'https://app.proply.co.za' : 'http://localhost:5000';
      res.redirect(`${baseUrl}/settings?error=payment_error`);
    }
  });

  // PayFast webhook/notification endpoint
  app.post('/api/payfast/notify', async (req, res) => {
    console.log('\n=== PAYFAST WEBHOOK RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    try {
      const { payfastTokenizationSessions, agencyPaymentMethods } = await import('@db/schema');
      
      // PayFast sends form-encoded data in req.body
      const data = req.body || {};
      
      console.log('Parsed webhook data:', data);
      
      // Check if this is a tokenization response
      if (data.token && data.payment_status && data.m_payment_id) {
        console.log('Tokenization webhook received:', {
          token: data.token,
          payment_status: data.payment_status,
          m_payment_id: data.m_payment_id,
          signature: data.signature
        });
        
        // Find the tokenization session using m_payment_id (which is our session ID)
        const tokenizationSession = await db.query.payfastTokenizationSessions.findFirst({
          where: eq(payfastTokenizationSessions.sessionId, data.m_payment_id),
          with: {
            user: true,
            agencyBranch: true
          }
        });
        
        if (!tokenizationSession) {
          console.log('❌ No tokenization session found for m_payment_id:', data.m_payment_id);
          res.status(200).send('OK');
          return;
        }
        
        console.log('✅ Found tokenization session:', {
          sessionId: tokenizationSession.sessionId,
          userId: tokenizationSession.userId,
          branchId: tokenizationSession.agencyBranchId,
          branchName: tokenizationSession.agencyBranch?.branchName
        });
        
        // Handle successful tokenization
        if (data.payment_status === 'COMPLETE') {
          console.log('Processing successful tokenization...');
          
          // Extract card details from webhook data
          const cardLastFour = data.card_number ? data.card_number.slice(-4) : '****';
          const cardBrand = data.card_type || 'Unknown';
          
          // Store the payment method
          await db.insert(agencyPaymentMethods).values({
            agencyBranchId: tokenizationSession.agencyBranchId,
            payfastToken: data.token,
            cardLastFour: cardLastFour,
            cardBrand: cardBrand,
            expiryMonth: 12, // PayFast doesn't provide expiry in webhook
            expiryYear: 2025, // PayFast doesn't provide expiry in webhook
            addedBy: tokenizationSession.userId
          });
          
          // Update session status
          await db
            .update(payfastTokenizationSessions)
            .set({ status: 'completed' })
            .where(eq(payfastTokenizationSessions.sessionId, data.m_payment_id));
          
          console.log('✅ Payment method stored successfully:', {
            token: data.token,
            lastFour: cardLastFour,
            brand: cardBrand,
            branchId: tokenizationSession.agencyBranchId
          });
        } else {
          console.log('❌ Tokenization failed:', data.payment_status);
          
          // Update session status to failed
          await db
            .update(payfastTokenizationSessions)
            .set({ status: 'failed' })
            .where(eq(payfastTokenizationSessions.sessionId, data.m_payment_id));
        }
      }
      
      res.status(200).send('OK');
      
    } catch (error) {
      console.error('❌ Error processing PayFast webhook:', error);
      res.status(200).send('OK'); // Always respond OK to PayFast
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}