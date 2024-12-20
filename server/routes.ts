import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { properties, users, accessCodes } from "@db/schema";
import { eq, and } from "drizzle-orm";
import fetch from "node-fetch";
import { crypto } from "./auth";
import { calculateYields, type PropertyData } from "../analysis-engine/calculations";

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Require authentication for all /api routes except login/register
  app.use('/api', (req, res, next) => {
    if (req.path === '/login' || req.path === '/register' || req.path === '/user') {
      return next();
    }
    if (!req.isAuthenticated()) {
      return res.status(401).send('Not authenticated');
    }
    next();
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
        Math.random().toString(36).charAt(2)
      ).join('').toUpperCase();

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
      console.error('Error generating access code:', error);
      res.status(500).json({ error: "Failed to generate access code" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    try {
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
          accessCodeUsedAt: accessCodes.usedAt
        })
        .from(users)
        .leftJoin(accessCodes, eq(users.accessCodeId, accessCodes.id));
      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/:action(suspend|unsuspend|change-plan)", async (req, res) => {
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

      const action = req.params.action as 'suspend' | 'unsuspend' | 'change-plan';
      
      if (action === 'change-plan') {
        const { plan } = req.body;
        if (!plan || !['free', 'pro'].includes(plan)) {
          return res.status(400).send("Invalid plan specified");
        }
        
        await db
          .update(users)
          .set({ 
            subscriptionStatus: plan,
            subscriptionExpiryDate: plan === 'pro' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
          })
          .where(eq(users.id, userId));

        res.json({ message: `User plan updated to ${plan} successfully` });
      } else {
        await db
          .update(users)
          .set({ subscriptionStatus: action === 'suspend' ? 'suspended' : 'free' })
          .where(eq(users.id, userId));

        res.json({ message: `User ${action}ed successfully` });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to suspend user" });
    }
  });

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
        await db
          .delete(accessCodes)
          .where(eq(accessCodes.usedBy, userId));

        // Delete any properties owned by the user
        await db
          .delete(properties)
          .where(eq(properties.userId, userId));

        // Finally, delete the user
        await db
          .delete(users)
          .where(eq(users.id, userId));

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: "Failed to delete user and associated data" });
      }
    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // PriceLabs API proxy endpoint
  app.get("/api/revenue-data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { address, bedrooms } = req.query;

    if (!address || !bedrooms) {
      return res.status(400).json({ error: "Address and bedrooms are required" });
    }

    try {
      const response = await fetch(
        `https://api.pricelabs.co/v1/revenue/estimator?version=2&address=${encodeURIComponent(String(address))}&currency=ZAR&bedroom_category=${bedrooms}`,
        {
          headers: {
            'X-API-Key': 'sNYmBNptl4gcLSlDl5GXuUtkGVVGIxiMcUjQI1MV'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`PriceLabs API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from PriceLabs:', error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  // Property comparison routes
  app.post("/api/properties", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const property = await db.insert(properties).values({
        ...req.body,
        userId: req.user!.id,
      }).returning();
      res.json(property[0]);
    } catch (error) {
      res.status(400).json({ error: "Invalid property data" });
    }
  });

  app.get("/api/properties", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Log the current user and their ID for debugging
      console.log('Fetching properties for user:', {
        userId: req.user!.id,
        email: req.user!.email,
        userType: req.user!.userType
      });

      // Strictly filter by userId for all users
      const userProperties = await db
        .select({
          id: properties.id,
          userId: properties.userId,
          title: properties.title,
          address: properties.address,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          longTermMonthly: properties.longTermMonthly,
          shortTermAnnual: properties.shortTermAnnual,
          shortTermAfterFees: properties.shortTermAfterFees,
          breakEvenOccupancy: properties.breakEvenOccupancy,
          shortTermNightly: properties.shortTermNightly,
          annualOccupancy: properties.annualOccupancy,
          createdAt: properties.createdAt
        })
        .from(properties)
        .where(eq(properties.userId, req.user!.id))
        .orderBy(properties.createdAt);
      
      // Log the number of properties found
      console.log(`Found ${userProperties.length} properties for user ${req.user!.id}`);
      
      res.json(userProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ error: "Failed to fetch properties" });
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
      await db
        .delete(properties)
        .where(eq(properties.id, propertyId));

      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Payment webhook for PayFast
  app.post("/api/payment-webhook", async (req, res) => {
    // Validate PayFast signature and update subscription
    const { user_id, subscription_status } = req.body;
    
    try {
      await db.update(users)
        .set({ 
          subscriptionStatus: subscription_status,
          subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .where(eq(users.id, user_id));
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // Update user profile
  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { firstName, lastName, companyLogo } = req.body;
    
    try {
      const [updatedUser] = await db.update(users)
        .set({ 
          firstName,
          lastName,
          companyLogo
        })
        .where(eq(users.id, req.user!.id))
        .returning();
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change password
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Verify current password
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      const isMatch = await crypto.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).send("Current password is incorrect");
      }

      // Hash new password and update
      const hashedPassword = await crypto.hash(newPassword);
      await db.update(users)
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
      console.log("\n=== Starting Property Analysis ===");
      console.log("Raw Input Data:", JSON.stringify(req.body, null, 2));

      const propertyData = {
        purchasePrice: Number(req.body.purchasePrice),
        shortTermNightlyRate: req.body.shortTermNightlyRate ? Number(req.body.shortTermNightlyRate) : null,
        annualOccupancy: req.body.annualOccupancy ? Number(req.body.annualOccupancy) : null,
        longTermRental: req.body.longTermRental ? Number(req.body.longTermRental) : null,
        leaseCycleGap: req.body.leaseCycleGap ? Number(req.body.leaseCycleGap) : null,
        propertyDescription: req.body.propertyDescription || null,
        address: req.body.address,
        deposit: Number(req.body.deposit),
        interestRate: Number(req.body.interestRate),
        loanTerm: Number(req.body.loanTerm),
        floorArea: Number(req.body.floorArea),
        ratePerSquareMeter: Number(req.body.ratePerSquareMeter),
        incomeGrowthRate: Number(req.body.incomeGrowthRate || 8),
        expenseGrowthRate: Number(req.body.expenseGrowthRate || 6),
        levies: Number(req.body.monthlyLevies || 0),
        ratesAndTaxes: Number(req.body.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: Number(req.body.otherMonthlyExpenses || 0),
        maintenancePercent: Number(req.body.maintenancePercent || 0),
        managementFee: Number(req.body.managementFee || 0)
      };

      console.log("\n=== Starting Property Analysis ===");
      console.log("Raw Input Data:", JSON.stringify(propertyData, null, 2));

      // Calculate gross monthly revenue (before platform fees)
      const grossMonthlyRevenue = propertyData.shortTermNightlyRate && propertyData.annualOccupancy
        ? (propertyData.shortTermNightlyRate * 365 * (propertyData.annualOccupancy / 100)) / 12
        : 0;

      // Fixed monthly expenses (levies + rates and taxes + other expenses)
      const fixedMonthlyExpenses = propertyData.monthlyLevies + propertyData.monthlyRatesTaxes + propertyData.otherMonthlyExpenses;

      // Revenue-based expenses (using gross revenue for percentages)
      const maintenanceExpense = grossMonthlyRevenue * (propertyData.maintenancePercent / 100);
      const managementFeeExpense = grossMonthlyRevenue * (propertyData.managementFee / 100);

      // Total monthly expenses for NOE (excluding platform fees)
      const totalMonthlyExpenses = fixedMonthlyExpenses + maintenanceExpense + managementFeeExpense;

      // Calculate NOE for Year 1 using the formula:
      // NOE = ((Fixed + Maintenance + Management) × 12) × (1 + Growth Rate)
      const baseAnnualExpenses = totalMonthlyExpenses * 12;
      const noeYear1 = baseAnnualExpenses * (1 + (propertyData.expenseGrowthRate / 100));

      // Platform fee calculation (separate from NOE)
      const platformFeeRate = propertyData.managementFee > 0 ? 0.15 : 0.03;
      const netMonthlyRevenue = grossMonthlyRevenue * (1 - platformFeeRate);

      console.log("=== Detailed Calculations ===");
      console.log("1. Revenue Calculations:", {
        grossMonthlyRevenue,
        netMonthlyRevenue,
        platformFeeRate,
        annualGrossRevenue: grossMonthlyRevenue * 12
      });

      console.log("2. Monthly Expense Components:", {
        fixed: {
          levies: propertyData.monthlyLevies,
          ratesAndTaxes: propertyData.monthlyRatesTaxes,
          otherExpenses: propertyData.otherMonthlyExpenses,
          totalFixed: fixedMonthlyExpenses
        },
        revenueBased: {
          maintenance: {
            percentage: propertyData.maintenancePercent,
            amount: maintenanceExpense
          },
          managementFee: {
            percentage: propertyData.managementFee,
            amount: managementFeeExpense
          }
        },
        total: totalMonthlyExpenses
      });

      console.log("3. NOE Calculation:", {
        monthlyExpenses: totalMonthlyExpenses,
        annualBaseExpenses: baseAnnualExpenses,
        expenseGrowthRate: propertyData.expenseGrowthRate,
        noeYear1
      });

      console.log("Converted property data:", JSON.stringify(propertyData, null, 2));
      
      const analysisResult = calculateYields(propertyData);
      console.log("Analysis complete. Result:", JSON.stringify(analysisResult, null, 2));

      res.json(analysisResult);
    } catch (error) {
      console.error("=== Analysis Error ===");
      console.error("Error details:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze property data";
      console.error("Sending error response:", { error: errorMessage });
      
      res.status(500).json({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : undefined
      });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}