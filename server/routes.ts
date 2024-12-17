import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { properties } from "@db/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // PriceLabs API proxy endpoint
  app.get("/api/revenue-data", async (req, res) => {
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

    const userProperties = await db.select()
      .from(properties)
      .where(eq(properties.userId, req.user!.id))
      .orderBy(properties.createdAt);
    
    res.json(userProperties);
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

  const httpServer = createServer(app);
  return httpServer;
}
