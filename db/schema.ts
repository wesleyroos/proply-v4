import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

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
  isAdmin: boolean("is_admin").default(false).notNull(),
  accessCodeId: integer("access_code_id"),
});

export const propertyAnalysis = pgTable("property_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  propertyDescription: text("property_description"),
  propertyPhoto: text("property_photo"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  loanTerm: integer("loan_term").notNull(),
  monthlyBondRepayment: decimal("monthly_bond_repayment", { precision: 10, scale: 2 }).notNull(),
  bedrooms: text("bedrooms").notNull(),
  bathrooms: text("bathrooms").notNull(),
  floorArea: decimal("floor_area", { precision: 10, scale: 2 }),
  ratePerSquareMeter: decimal("rate_per_square_meter", { precision: 10, scale: 2 }),
  shortTermNightly: decimal("short_term_nightly", { precision: 10, scale: 2 }),
  annualOccupancy: decimal("annual_occupancy", { precision: 5, scale: 2 }),
  managementFee: decimal("management_fee", { precision: 5, scale: 2 }),
  monthlyLevies: decimal("monthly_levies", { precision: 10, scale: 2 }),
  monthlyRatesTaxes: decimal("monthly_rates_taxes", { precision: 10, scale: 2 }),
  otherMonthlyExpenses: decimal("other_monthly_expenses", { precision: 10, scale: 2 }),
  maintenancePercent: decimal("maintenance_percent", { precision: 5, scale: 2 }),
  annualPropertyAppreciation: decimal("annual_property_appreciation", { precision: 5, scale: 2 }),
  // Analysis Results
  shortTermGrossYield: decimal("short_term_gross_yield", { precision: 5, scale: 2 }),
  longTermGrossYield: decimal("long_term_gross_yield", { precision: 5, scale: 2 }),
  shortTermAnnualRevenue: decimal("short_term_annual_revenue", { precision: 10, scale: 2 }),
  longTermAnnualRevenue: decimal("long_term_annual_revenue", { precision: 10, scale: 2 }),
  // Store revenue projections as JSON
  revenueProjections: jsonb("revenue_projections"),
  operatingExpenses: jsonb("operating_expenses"),
  netOperatingIncome: jsonb("net_operating_income"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rentalComparisons = pgTable("rental_comparisons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  bedrooms: text("bedrooms").notNull(),
  bathrooms: text("bathrooms").notNull(),
  longTermRental: decimal("long_term_rental", { precision: 10, scale: 2 }).notNull(),
  shortTermNightly: decimal("short_term_nightly", { precision: 10, scale: 2 }).notNull(),
  annualOccupancy: decimal("annual_occupancy", { precision: 5, scale: 2 }).notNull(),
  managementFee: decimal("management_fee", { precision: 5, scale: 2 }).notNull(),
  // Computed results
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
  bedrooms: integer("bedrooms").notNull(),
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

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  accessCode: one(accessCodes, {
    fields: [users.accessCodeId],
    references: [accessCodes.id],
  }),
  agencySettings: one(agencySettings, {
    fields: [users.id],
    references: [agencySettings.userId],
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

// Schemas
export const insertAccessCodeSchema = createInsertSchema(accessCodes);
export const selectAccessCodeSchema = createSelectSchema(accessCodes);
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPropertyAnalysisSchema = createInsertSchema(propertyAnalysis);
export const selectPropertyAnalysisSchema = createSelectSchema(propertyAnalysis);
export const insertRentalComparisonSchema = createInsertSchema(rentalComparisons);
export const selectRentalComparisonSchema = createSelectSchema(rentalComparisons);
export const insertPropdataTokenSchema = createInsertSchema(propdataTokens);
export const selectPropdataTokenSchema = createSelectSchema(propdataTokens);
export const insertPropdataListingSchema = createInsertSchema(propdataListings);
export const selectPropdataListingSchema = createSelectSchema(propdataListings);
export const insertAgencySettingsSchema = createInsertSchema(agencySettings);
export const selectAgencySettingsSchema = createSelectSchema(agencySettings);
export const insertReportTrackingSchema = createInsertSchema(reportTracking);
export const selectReportTrackingSchema = createSelectSchema(reportTracking);

// Types
export type InsertAccessCode = typeof accessCodes.$inferInsert;
export type SelectAccessCode = typeof accessCodes.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertPropertyAnalysis = typeof propertyAnalysis.$inferInsert;
export type SelectPropertyAnalysis = typeof propertyAnalysis.$inferSelect;
export type InsertRentalComparison = typeof rentalComparisons.$inferInsert;
export type SelectRentalComparison = typeof rentalComparisons.$inferSelect;
export type InsertPropdataToken = typeof propdataTokens.$inferInsert;
export type SelectPropdataToken = typeof propdataTokens.$inferSelect;
export type InsertPropdataListing = typeof propdataListings.$inferInsert;
export type SelectPropdataListing = typeof propdataListings.$inferSelect;
export type InsertAgencySettings = typeof agencySettings.$inferInsert;
export type SelectAgencySettings = typeof agencySettings.$inferSelect;
export type InsertReportTracking = typeof reportTracking.$inferInsert;
export type SelectReportTracking = typeof reportTracking.$inferSelect;
