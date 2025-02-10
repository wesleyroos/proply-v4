import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Existing tables
export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: integer("used_by"),
  expiresAt: timestamp("expires_at"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  userType: text("user_type").notNull(),
  company: text("company"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyLogo: text("company_logo"),
  subscriptionStatus: text("subscription_status").default("free").notNull(),
  subscriptionExpiryDate: timestamp("subscription_expiry_date"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionNextBillingDate: timestamp("subscription_next_billing_date"),
  pendingDowngrade: boolean("pending_downgrade").default(false),
  // PayFast integration fields
  payfastToken: text("payfast_token"),
  payfastSubscriptionStatus: text("payfast_subscription_status").default("none"),
  subscriptionPausedUntil: timestamp("subscription_paused_until"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  accessCodeId: integer("access_code_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reportsGenerated: integer("reports_generated").default(0).notNull(),

  pricelabsApiCallsTotal: integer("pricelabs_api_calls_total").default(0),
  pricelabsApiCallsMonth: integer("pricelabs_api_calls_month").default(0),
  pricelabsApiLastReset: timestamp("pricelabs_api_last_reset")
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  bedrooms: text("bedrooms").notNull(),
  bathrooms: text("bathrooms").notNull(),
  longTermRental: text("long_term_rental").notNull(),
  annualEscalation: text("annual_escalation").notNull(),
  shortTermNightly: text("short_term_nightly").notNull(),
  annualOccupancy: text("annual_occupancy").notNull(),
  managementFee: text("management_fee").notNull(),
  propertyType: text("property_type").notNull().default('rent_compare'),
  longTermMonthly: decimal("long_term_monthly", { precision: 10, scale: 2 }).notNull(),
  longTermAnnual: decimal("long_term_annual", { precision: 10, scale: 2 }).notNull(),
  shortTermMonthly: decimal("short_term_monthly", { precision: 10, scale: 2 }).notNull(),
  shortTermAnnual: decimal("short_term_annual", { precision: 10, scale: 2 }).notNull(),
  shortTermAfterFees: decimal("short_term_after_fees", { precision: 10, scale: 2 }).notNull(),
  breakEvenOccupancy: decimal("break_even_occupancy", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New tables for PropData integration
export const propdataTokens = pgTable("propdata_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const propdataListings = pgTable("propdata_listings", {
  id: serial("id").primaryKey(),
  propdataId: text("propdata_id").unique().notNull(),
  agencyId: integer("agency_id").notNull(),
  status: text("status").notNull(), // Active, Pending, Processing, etc.
  listingData: jsonb("listing_data").notNull(), // Raw PropData listing data
  address: text("address").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  propertyType: text("property_type").notNull(),
  bedrooms: decimal("bedrooms", { precision: 3, scale: 1 }).notNull(),
  bathrooms: integer("bathrooms").notNull(),
  parkingSpaces: integer("parking_spaces"),
  floorSize: integer("floor_size"), // in square meters
  landSize: integer("land_size"), // in square meters
  location: jsonb("location"), // Coordinates and location data
  features: jsonb("features"), // Property features and amenities
  images: jsonb("images"), // Array of image URLs
  agentId: text("agent_id"), // PropData agent ID
  agentPhone: text("agent_phone"),
  lastModified: timestamp("last_modified").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencySettings = pgTable("agency_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").unique().notNull(), // Links to users table
  requiresApproval: boolean("requires_approval").default(false).notNull(),
  autoProcessing: boolean("auto_processing").default(true).notNull(),
  notificationPreferences: jsonb("notification_preferences").notNull(),
  whatsappNumber: text("whatsapp_number"),
  reportSettings: jsonb("report_settings"), // Custom report settings
  billingEmail: text("billing_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Update suburbs table with more precise schema
export const suburbs = pgTable("suburbs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportTracking = pgTable("report_tracking", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(), // Links to propdata_listings
  agencyId: integer("agency_id").notNull(), // Links to agency_settings
  status: text("status").notNull(), // Generated, Sent, Error
  reportUrl: text("report_url"), // URL to the generated PDF
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  billingStatus: text("billing_status").notNull(), // Pending, Billed, Paid
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
});

// Add this new table after the existing tables but before the relations
export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").default(true).notNull(),
});

// Add new table for subscription history
export const subscriptionHistory = pgTable("subscription_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // pause, resume, cancel
  payfastToken: text("payfast_token").notNull(),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  pauseDuration: integer("pause_duration"), // in cycles, for pause actions
  reason: text("reason"),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
});

// Property analyzer schema with simplified validation
const propertyAnalyzerSchema = z.object({
  userId: z.number(),
  title: z.string(),
  address: z.string(),
  propertyUrl: z.string().optional().nullable(),
  propertyDescription: z.string().optional().nullable(),
  propertyPhoto: z.string().optional().nullable(),

  // Property Details
  purchasePrice: z.coerce.number(),
  floorArea: z.coerce.number(),
  bedrooms: z.coerce.number(),
  bathrooms: z.coerce.number(),
  parkingSpaces: z.coerce.number().optional().nullable(),

  // Financing details
  depositAmount: z.coerce.number(),
  depositPercentage: z.coerce.number(),
  interestRate: z.coerce.number(),
  loanTerm: z.coerce.number(),
  monthlyBondRepayment: z.coerce.number().optional().nullable(),

  // Operating expenses
  monthlyLevies: z.coerce.number(),
  monthlyRatesTaxes: z.coerce.number(),
  otherMonthlyExpenses: z.coerce.number(),
  maintenancePercent: z.coerce.number(),
  managementFee: z.coerce.number(),

  // Revenue performance
  shortTermNightlyRate: z.coerce.number().optional().nullable(),
  annualOccupancy: z.coerce.number().optional().nullable(),
  shortTermAnnualRevenue: z.coerce.number().optional().nullable(),
  longTermAnnualRevenue: z.coerce.number().optional().nullable(),
  shortTermGrossYield: z.coerce.number().optional().nullable(),
  longTermGrossYield: z.coerce.number().optional().nullable(),

  // Rate comparison
  ratePerSquareMeter: z.coerce.number(),

  // Analysis results - using record type for better type safety
  revenueProjections: z.record(z.unknown()).optional(),
  operatingExpenses: z.record(z.unknown()).optional(),
  netOperatingIncome: z.record(z.unknown()).optional(),
  investmentMetrics: z.record(z.unknown()).optional()
});

// Define the table
export const propertyAnalyzerResults = pgTable("property_analyzer_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  propertyUrl: text("property_url"),
  propertyDescription: text("property_description"),
  propertyPhoto: text("property_photo"),

  // Property Details
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).notNull(),
  floorArea: decimal("floor_area", { precision: 10, scale: 2 }).notNull(),
  bedrooms: decimal("bedrooms", { precision: 3, scale: 1 }).notNull(),
  bathrooms: integer("bathrooms").notNull(),
  parkingSpaces: integer("parking_spaces"),

  // Financing details
  depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }).notNull(),
  depositPercentage: decimal("deposit_percentage", { precision: 5, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  loanTerm: integer("loan_term").notNull(),
  monthlyBondRepayment: decimal("monthly_bond_repayment", { precision: 12, scale: 2 }),

  // Operating expenses
  monthlyLevies: decimal("monthly_levies", { precision: 10, scale: 2 }).notNull(),
  monthlyRatesTaxes: decimal("monthly_rates_taxes", { precision: 10, scale: 2 }).notNull(),
  otherMonthlyExpenses: decimal("other_monthly_expenses", { precision: 10, scale: 2 }).notNull(),
  maintenancePercent: decimal("maintenance_percent", { precision: 5, scale: 2 }).notNull(),
  managementFee: decimal("management_fee", { precision: 5, scale: 2 }).notNull(),

  // Revenue performance
  shortTermNightlyRate: decimal("short_term_nightly_rate", { precision: 10, scale: 2 }),
  annualOccupancy: decimal("annual_occupancy", { precision: 5, scale: 2 }),
  shortTermAnnualRevenue: decimal("short_term_annual_revenue", { precision: 12, scale: 2 }),
  longTermAnnualRevenue: decimal("long_term_annual_revenue", { precision: 12, scale: 2 }),
  shortTermGrossYield: decimal("short_term_gross_yield", { precision: 5, scale: 2 }),
  longTermGrossYield: decimal("long_term_gross_yield", { precision: 5, scale: 2 }),

  // Rate comparison
  ratePerSquareMeter: decimal("rate_per_square_meter", { precision: 10, scale: 2 }).notNull(),

  // Analysis results stored as JSON
  revenueProjections: jsonb("revenue_projections"),
  operatingExpenses: jsonb("operating_expenses"),
  netOperatingIncome: jsonb("net_operating_income"),
  investmentMetrics: jsonb("investment_metrics"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export the schema and types
export const insertPropertyAnalyzerResultSchema = propertyAnalyzerSchema;
export const selectPropertyAnalyzerResultSchema = createSelectSchema(propertyAnalyzerResults);

// Add relations for the property analyzer results
export const propertyAnalyzerResultsRelations = relations(propertyAnalyzerResults, ({ one }) => ({
  user: one(users, {
    fields: [propertyAnalyzerResults.userId],
    references: [users.id],
  }),
}));

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  accessCode: one(accessCodes, {
    fields: [users.accessCodeId],
    references: [accessCodes.id],
  }),
}));

export const accessCodesRelations = relations(accessCodes, ({ one }) => ({
  creator: one(users, {
    fields: [accessCodes.createdBy],
    references: [users.id],
  }),
  user: one(users, {
    fields: [accessCodes.usedBy],
    references: [users.id],
  }),
}));

export const propdataListingsRelations = relations(propdataListings, ({ many }) => ({
  reports: many(reportTracking),
}));

export const reportTrackingRelations = relations(reportTracking, ({ one }) => ({
  listing: one(propdataListings, {
    fields: [reportTracking.listingId],
    references: [propdataListings.id],
  }),
  agency: one(agencySettings, {
    fields: [reportTracking.agencyId],
    references: [agencySettings.id],
  }),
}));


// Add this to the relations section
export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  user: one(users, {
    fields: [apiUsage.userId],
    references: [users.id],
  }),
}));

// Add relations
export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionHistory.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertAccessCodeSchema = createInsertSchema(accessCodes);
export const selectAccessCodeSchema = createSelectSchema(accessCodes);
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPropertySchema = createInsertSchema(properties);
export const selectPropertySchema = createSelectSchema(properties);
export const insertPropdataTokenSchema = createInsertSchema(propdataTokens);
export const selectPropdataTokenSchema = createSelectSchema(propdataTokens);
export const insertPropdataListingSchema = createInsertSchema(propdataListings);
export const selectPropdataListingSchema = createSelectSchema(propdataListings);
export const insertAgencySettingsSchema = createInsertSchema(agencySettings);
export const selectAgencySettingsSchema = createSelectSchema(agencySettings);
export const insertReportTrackingSchema = createInsertSchema(reportTracking);
export const selectReportTrackingSchema = createSelectSchema(reportTracking);

// Add these to the exports section at the bottom of the file
export const insertApiUsageSchema = createInsertSchema(apiUsage);
export const selectApiUsageSchema = createSelectSchema(apiUsage);
export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory);
export const selectSubscriptionHistorySchema = createSelectSchema(subscriptionHistory);

// Types
export type InsertAccessCode = typeof accessCodes.$inferInsert;
export type SelectAccessCode = typeof accessCodes.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type SelectProperty = typeof properties.$inferSelect;
export type InsertPropdataToken = typeof propdataTokens.$inferInsert;
export type SelectPropdataToken = typeof propdataTokens.$inferSelect;
export type InsertPropdataListing = typeof propdataListings.$inferInsert;
export type SelectPropdataListing = typeof propdataListings.$inferSelect;
export type InsertAgencySettings = typeof agencySettings.$inferInsert;
export type SelectAgencySettings = typeof agencySettings.$inferSelect;
export type InsertReportTracking = typeof reportTracking.$inferInsert;
export type SelectReportTracking = typeof reportTracking.$inferSelect;

export type InsertPropertyAnalyzerResult = typeof propertyAnalyzerResults.$inferInsert;
export type SelectPropertyAnalyzerResult = typeof propertyAnalyzerResults.$inferSelect;
export type InsertApiUsage = typeof apiUsage.$inferInsert;
export type SelectApiUsage = typeof apiUsage.$inferSelect;
export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;
export type SelectSubscriptionHistory = typeof subscriptionHistory.$inferSelect;