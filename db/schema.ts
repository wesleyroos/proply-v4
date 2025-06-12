import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { createId } from '@paralleldrive/cuid2';

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
  vatNumber: text("vat_number"),
  registrationNumber: text("registration_number"),
  businessAddress: text("business_address"),
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
  role: text("role").default("user").notNull(),
  franchiseId: integer("franchise_id").references(() => agencyBranches.id),
  branchId: integer("branch_id").references(() => agencyBranches.id),
  accessCodeId: integer("access_code_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reportsGenerated: integer("reports_generated").default(0).notNull(),
  analysisCount: integer("analysis_count").default(0).notNull(),
  lastLoginAt: timestamp("last_login_at"),

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

export const agencyBranches = pgTable("agency_branches", {
  id: serial("id").primaryKey(),
  franchiseName: text("franchise_name").notNull(), // e.g., "Sotheby's", "NOX", "Pam Golding"
  slug: text("slug").notNull(), // e.g., "sothebys", "nox", "pam-golding"
  branchName: text("branch_name").notNull(), // e.g., "Sotheby's Atlantic Seaboard"
  propdataFranchiseId: text("propdata_franchise_id").notNull(), // PropData franchise ID
  propdataBranchId: text("propdata_branch_id").notNull().unique(), // PropData branch ID
  provider: text("provider").default("PropData").notNull(), // Syndication platform
  status: text("status").default("active").notNull(), // active, inactive
  autoSyncEnabled: boolean("auto_sync_enabled").default(true).notNull(),
  syncFrequency: text("sync_frequency").default("5 minutes").notNull(),
  logoUrl: text("logo_url"), // Path to uploaded agency logo
  // Company information fields
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  registrationNumber: text("registration_number"),
  businessAddress: text("business_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propdataListings = pgTable("propdata_listings", {
  id: serial("id").primaryKey(),
  propdataId: text("propdata_id").unique().notNull(),
  branchId: integer("branch_id"), // References agency_branches table
  status: text("status").notNull(), // Active, Pending, Processing, etc.
  listingData: jsonb("listing_data").notNull(), // Raw PropData listing data
  address: text("address").notNull(),
  addressManuallyEdited: boolean("address_manually_edited").default(false).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  propertyType: text("property_type").notNull(),
  bedrooms: decimal("bedrooms", { precision: 3, scale: 1 }).notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  parkingSpaces: integer("parking_spaces"),
  floorSize: integer("floor_size"), // in square meters
  landSize: integer("land_size"), // in square meters
  location: jsonb("location"), // Coordinates and location data
  features: jsonb("features"), // Property features and amenities
  images: jsonb("images"), // Array of image URLs
  agentId: text("agent_id"), // PropData agent ID
  agentName: text("agent_name"), // Agent full name from PropData agents API
  agentEmail: text("agent_email"), // Agent email
  agentPhone: text("agent_phone"),
  
  // Levy fields from PropData API
  monthlyLevy: decimal("monthly_levy", { precision: 10, scale: 2 }),
  sectionalTitleLevy: decimal("sectional_title_levy", { precision: 10, scale: 2 }),
  specialLevy: decimal("special_levy", { precision: 10, scale: 2 }),
  homeOwnerLevy: decimal("home_owner_levy", { precision: 10, scale: 2 }),

  listingDate: timestamp("listing_date"), // When the property was actually listed (mandate_start_date)
  lastModified: timestamp("last_modified").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const syncTracking = pgTable("sync_tracking", {
  id: serial("id").primaryKey(),
  syncType: text("sync_type").notNull(), // 'quick' or 'full'
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  newListings: integer("new_listings").default(0),
  updatedListings: integer("updated_listings").default(0),
  errors: integer("errors").default(0),
  errorMessage: text("error_message"),
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

// New table for password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique().$defaultFn(() => createId()),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



// PriceLabs API usage tracking
export const priceLabsUsage = pgTable("pricelabs_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
});

// Report generation tracking by agency
export const reportGenerations = pgTable("report_generations", {
  id: serial("id").primaryKey(),
  agencyId: varchar("agency_id", { length: 255 }).notNull(),
  agencyName: varchar("agency_name", { length: 255 }).notNull(),
  propertyId: varchar("property_id", { length: 255 }).notNull(),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

// Table for collecting emails from Deal Score report downloads
export const dealScoreLeads = pgTable("deal_score_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  propertyAddress: text("property_address"),
  reportType: text("report_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // paid, pending, failed
  invoiceNumber: text("invoice_number").unique().notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// AI Valuation Reports table
export const valuationReports = pgTable("valuation_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: text("property_id").notNull(), // PropData property ID
  address: text("address").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  floorSize: decimal("floor_size", { precision: 10, scale: 2 }),
  landSize: decimal("land_size", { precision: 10, scale: 2 }),
  propertyType: text("property_type"),
  parkingSpaces: integer("parking_spaces"),
  
  // Calculated fields
  pricePerSquareMeter: decimal("price_per_square_meter", { precision: 10, scale: 2 }),
  
  // Valuation results as JSON
  valuationData: jsonb("valuation_data").notNull(), // Stores the complete OpenAI response
  
  // Analysis metadata
  imagesAnalyzed: integer("images_analyzed").default(0),
  analysisModel: text("analysis_model").default("gpt-4o"),
  
  // FINANCING PARAMETERS - Current Working State (Single Source of Truth for PDF)
  // These fields store the user's current financing scenario for this property
  // Updated whenever user modifies financing details in the modal
  // PDF generation reads these values to ensure consistency with modal display
  currentDepositPercentage: decimal("current_deposit_percentage", { precision: 5, scale: 2 }).default("20.00"), // Default 20% deposit
  currentInterestRate: decimal("current_interest_rate", { precision: 5, scale: 2 }).default("11.75"), // Default prime rate
  currentLoanTerm: integer("current_loan_term").default(20), // Default 20 year loan
  
  // Derived financing values (calculated from above parameters + property price)
  // Stored to avoid recalculation during PDF generation
  currentDepositAmount: decimal("current_deposit_amount", { precision: 12, scale: 2 }),
  currentLoanAmount: decimal("current_loan_amount", { precision: 12, scale: 2 }),
  currentMonthlyRepayment: decimal("current_monthly_repayment", { precision: 10, scale: 2 }),
  
  // COMPREHENSIVE FINANCIAL ANALYSIS DATA - Saved when generating reports
  // These JSONB fields store complete calculated financial data for PDF generation
  annualPropertyAppreciationData: jsonb("annual_property_appreciation_data"), // Property appreciation projections
  cashflowAnalysisData: jsonb("cashflow_analysis_data"), // Revenue growth and cashflow analysis
  financingAnalysisData: jsonb("financing_analysis_data"), // Detailed financing calculations and metrics
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const valuationReportsRelations = relations(valuationReports, ({ one, many }) => ({
  user: one(users, {
    fields: [valuationReports.userId],
    references: [users.id],
  }),
  rentalPerformance: many(rentalPerformanceData),
}));

// Rental Performance Data table
export const rentalPerformanceData = pgTable("rental_performance_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: text("property_id").notNull(), // PropData property ID
  valuationReportId: integer("valuation_report_id"), // Link to valuation report
  
  // Property details for context
  address: text("address").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  propertyType: text("property_type"),
  price: decimal("price", { precision: 12, scale: 2 }),
  
  // Short-term rental data (PriceLabs)
  shortTermData: jsonb("short_term_data"), // Complete PriceLabs response
  
  // Long-term rental data (OpenAI generated)
  longTermMinRental: decimal("long_term_min_rental", { precision: 10, scale: 2 }),
  longTermMaxRental: decimal("long_term_max_rental", { precision: 10, scale: 2 }),
  longTermMinYield: decimal("long_term_min_yield", { precision: 5, scale: 2 }),
  longTermMaxYield: decimal("long_term_max_yield", { precision: 5, scale: 2 }),
  longTermReasoning: text("long_term_reasoning"),
  
  // Analysis metadata
  imagesAnalyzed: integer("images_analyzed").default(0),
  analysisModel: text("analysis_model").default("gpt-4o"),
  
  // Financial analysis data
  annualPropertyAppreciationData: jsonb("annual_property_appreciation_data"),
  cashflowAnalysisData: jsonb("cashflow_analysis_data"),
  financingAnalysisData: jsonb("financing_analysis_data"),
  currentDepositPercentage: text("current_deposit_percentage"),
  currentInterestRate: text("current_interest_rate"),
  currentLoanTerm: integer("current_loan_term"),
  currentDepositAmount: text("current_deposit_amount"),
  currentLoanAmount: text("current_loan_amount"),
  currentMonthlyRepayment: text("current_monthly_repayment"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const rentalPerformanceDataRelations = relations(rentalPerformanceData, ({ one }) => ({
  user: one(users, {
    fields: [rentalPerformanceData.userId],
    references: [users.id],
  }),
  valuationReport: one(valuationReports, {
    fields: [rentalPerformanceData.valuationReportId],
    references: [valuationReports.id],
  }),
}));


export const priceLabsUsageRelations = relations(priceLabsUsage, ({ one }) => ({
  user: one(users, {
    fields: [priceLabsUsage.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
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
export const insertAgencyBranchSchema = createInsertSchema(agencyBranches);
export const selectAgencyBranchSchema = createSelectSchema(agencyBranches);
export const insertAgencySettingsSchema = createInsertSchema(agencySettings);
export const selectAgencySettingsSchema = createSelectSchema(agencySettings);
export const insertReportTrackingSchema = createInsertSchema(reportTracking);
export const selectReportTrackingSchema = createSelectSchema(reportTracking);


export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory);
export const selectSubscriptionHistorySchema = createSelectSchema(subscriptionHistory);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const selectPasswordResetTokenSchema = createSelectSchema(passwordResetTokens);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const selectInvoiceSchema = createSelectSchema(invoices);
export const insertDealScoreLeadSchema = createInsertSchema(dealScoreLeads);
export const selectDealScoreLeadSchema = createSelectSchema(dealScoreLeads);


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
export type InsertAgencyBranch = typeof agencyBranches.$inferInsert;
export type SelectAgencyBranch = typeof agencyBranches.$inferSelect;
export type InsertAgencySettings = typeof agencySettings.$inferInsert;
export type SelectAgencySettings = typeof agencySettings.$inferSelect;
export type InsertReportTracking = typeof reportTracking.$inferInsert;
export type SelectReportTracking = typeof reportTracking.$inferSelect;

export type InsertPropertyAnalyzerResult = typeof propertyAnalyzerResults.$inferInsert;
export type SelectPropertyAnalyzerResult = typeof propertyAnalyzerResults.$inferSelect;

export type InsertPriceLabsUsage = typeof priceLabsUsage.$inferInsert;
export type SelectPriceLabsUsage = typeof priceLabsUsage.$inferSelect;

export type InsertReportGeneration = typeof reportGenerations.$inferInsert;
export type SelectReportGeneration = typeof reportGenerations.$inferSelect;

export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;
export type SelectSubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type SelectInvoice = typeof invoices.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type SelectPasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertDealScoreLead = typeof dealScoreLeads.$inferInsert;
export type SelectDealScoreLead = typeof dealScoreLeads.$inferSelect;

// Add property listings table for scraped data
export const propertyListings = pgTable("property_listings", {
  id: serial("id").primaryKey(),
  listingId: varchar("listing_id", { length: 100 }).unique().notNull(), // Property24 listing ID
  title: text("title").notNull(),
  address: text("address").notNull(),
  suburb: varchar("suburb", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  parking: integer("parking"),
  propertyType: varchar("property_type", { length: 50 }).notNull(), // Flat, House, etc.
  category: varchar("category", { length: 50 }).notNull(), // For Sale, For Rent, etc.
  area: decimal("area", { precision: 10, scale: 2 }), // Floor area in square meters
  erfSize: decimal("erf_size", { precision: 10, scale: 2 }), // Land size in square meters
  description: text("description"),
  amenities: text("amenities").array(),
  imageUrls: text("image_urls").array(),
  agent: jsonb("agent"), // Agent contact information
  listedDate: date("listed_date"),
  soldDate: date("sold_date"), // If available
  priceHistory: jsonb("price_history"), // Historical price changes
  source: varchar("source", { length: 50 }).default("property24").notNull(), // Data source
  url: text("url").notNull(), // Original listing URL
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export type InsertPropertyListing = typeof propertyListings.$inferInsert;
export type SelectPropertyListing = typeof propertyListings.$inferSelect;

// Report activity tracking table
export const reportActivity = pgTable("report_activity", {
  id: serial("id").primaryKey(),
  propertyId: text("property_id").notNull(), // PropData property ID
  reportId: text("report_id"), // For downloads, references the temp file
  activityType: text("activity_type").notNull(), // 'sent' or 'downloaded'
  recipientEmail: text("recipient_email"), // For sends, the email address
  recipientName: text("recipient_name"), // For sends, the recipient name
  ipAddress: text("ip_address"), // For downloads, partial IP for privacy
  userAgent: text("user_agent"), // Browser info for downloads
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id"), // User who initiated the send (for sent activities)
});

export const insertReportActivitySchema = createInsertSchema(reportActivity);
export const selectReportActivitySchema = createSelectSchema(reportActivity);
export type InsertReportActivity = typeof reportActivity.$inferInsert;
export type SelectReportActivity = typeof reportActivity.$inferSelect;

export const insertSyncTrackingSchema = createInsertSchema(syncTracking);
export const selectSyncTrackingSchema = createSelectSchema(syncTracking);
export type InsertSyncTracking = typeof syncTracking.$inferInsert;
export type SelectSyncTracking = typeof syncTracking.$inferSelect;

// Role permissions table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin invitations table
export const adminInvitations = pgTable("admin_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  agencyId: text("agency_id"), // Store PropData agency ID as string
  franchiseId: integer("franchise_id").references(() => agencyBranches.id),
  branchId: integer("branch_id").references(() => agencyBranches.id),
  token: text("token").unique().notNull().$defaultFn(() => createId()),
  invitedBy: integer("invited_by").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  // No direct relations needed for this lookup table
}));

export const adminInvitationsRelations = relations(adminInvitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [adminInvitations.invitedBy],
    references: [users.id],
  }),
  franchise: one(agencyBranches, {
    fields: [adminInvitations.franchiseId],
    references: [agencyBranches.id],
  }),
  branch: one(agencyBranches, {
    fields: [adminInvitations.branchId],
    references: [agencyBranches.id],
  }),
}));

export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export const selectRolePermissionSchema = createSelectSchema(rolePermissions);
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
export type SelectRolePermission = typeof rolePermissions.$inferSelect;

export const insertAdminInvitationSchema = createInsertSchema(adminInvitations);
export const selectAdminInvitationSchema = createSelectSchema(adminInvitations);
export type InsertAdminInvitation = typeof adminInvitations.$inferInsert;
export type SelectAdminInvitation = typeof adminInvitations.$inferSelect;

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agency billing tables
export const agencyBillingSettings = pgTable("agency_billing_settings", {
  id: serial("id").primaryKey(),
  agencyBranchId: integer("agency_branch_id").notNull().references(() => agencyBranches.id),
  billingEnabled: boolean("billing_enabled").default(false),
  pricePerReport: text("price_per_report").default("200.00").notNull(),
  billingContactEmail: text("billing_contact_email"),
  billingDay: integer("billing_day").default(1).notNull(), // day of month to bill
  autoBilling: boolean("auto_billing").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyPaymentMethods = pgTable("agency_payment_methods", {
  id: serial("id").primaryKey(),
  agencyBranchId: integer("agency_branch_id").notNull().references(() => agencyBranches.id),
  yocoToken: text("yoco_token").notNull(),
  cardLastFour: text("card_last_four").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cardBrand: text("card_brand"), // visa, mastercard, etc
  isActive: boolean("is_active").default(true),
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyBillingCycles = pgTable("agency_billing_cycles", {
  id: serial("id").primaryKey(),
  agencyBranchId: integer("agency_branch_id").notNull().references(() => agencyBranches.id),
  billingPeriod: text("billing_period").notNull(), // YYYY-MM format
  reportCount: integer("report_count").default(0),
  pricePerReport: text("price_per_report").notNull(),
  subtotal: text("subtotal").notNull(),
  vatAmount: text("vat_amount").notNull(),
  totalAmount: text("total_amount").notNull(),
  status: text("status").default("pending").notNull(), // pending, paid, failed, cancelled
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  yocoPaymentId: text("yoco_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyInvoices = pgTable("agency_invoices", {
  id: serial("id").primaryKey(),
  agencyBranchId: integer("agency_branch_id").notNull().references(() => agencyBranches.id),
  billingCycleId: integer("billing_cycle_id").notNull().references(() => agencyBillingCycles.id),
  invoiceNumber: text("invoice_number").unique().notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: text("subtotal").notNull(),
  vatAmount: text("vat_amount").notNull(),
  totalAmount: text("total_amount").notNull(),
  status: text("status").default("draft").notNull(), // draft, sent, paid, overdue
  pdfPath: text("pdf_path"),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for billing tables
export const agencyBillingSettingsRelations = relations(agencyBillingSettings, ({ one }) => ({
  agencyBranch: one(agencyBranches, {
    fields: [agencyBillingSettings.agencyBranchId],
    references: [agencyBranches.id],
  }),
}));

export const agencyPaymentMethodsRelations = relations(agencyPaymentMethods, ({ one }) => ({
  agencyBranch: one(agencyBranches, {
    fields: [agencyPaymentMethods.agencyBranchId],
    references: [agencyBranches.id],
  }),
  addedByUser: one(users, {
    fields: [agencyPaymentMethods.addedBy],
    references: [users.id],
  }),
}));

export const agencyBillingCyclesRelations = relations(agencyBillingCycles, ({ one, many }) => ({
  agencyBranch: one(agencyBranches, {
    fields: [agencyBillingCycles.agencyBranchId],
    references: [agencyBranches.id],
  }),
  invoices: many(agencyInvoices),
}));

export const agencyInvoicesRelations = relations(agencyInvoices, ({ one }) => ({
  agencyBranch: one(agencyBranches, {
    fields: [agencyInvoices.agencyBranchId],
    references: [agencyBranches.id],
  }),
  billingCycle: one(agencyBillingCycles, {
    fields: [agencyInvoices.billingCycleId],
    references: [agencyBillingCycles.id],
  }),
}));

// Schemas for billing tables
export const insertAgencyBillingSettingsSchema = createInsertSchema(agencyBillingSettings);
export const selectAgencyBillingSettingsSchema = createSelectSchema(agencyBillingSettings);
export type InsertAgencyBillingSettings = typeof agencyBillingSettings.$inferInsert;
export type SelectAgencyBillingSettings = typeof agencyBillingSettings.$inferSelect;

export const insertAgencyPaymentMethodSchema = createInsertSchema(agencyPaymentMethods);
export const selectAgencyPaymentMethodSchema = createSelectSchema(agencyPaymentMethods);
export type InsertAgencyPaymentMethod = typeof agencyPaymentMethods.$inferInsert;
export type SelectAgencyPaymentMethod = typeof agencyPaymentMethods.$inferSelect;

export const insertAgencyBillingCycleSchema = createInsertSchema(agencyBillingCycles);
export const selectAgencyBillingCycleSchema = createSelectSchema(agencyBillingCycles);
export type InsertAgencyBillingCycle = typeof agencyBillingCycles.$inferInsert;
export type SelectAgencyBillingCycle = typeof agencyBillingCycles.$inferSelect;

export const insertAgencyInvoiceSchema = createInsertSchema(agencyInvoices);
export const selectAgencyInvoiceSchema = createSelectSchema(agencyInvoices);
export type InsertAgencyInvoice = typeof agencyInvoices.$inferInsert;
export type SelectAgencyInvoice = typeof agencyInvoices.$inferSelect;

// System settings schemas
export const insertSystemSettingSchema = createInsertSchema(systemSettings);
export const selectSystemSettingSchema = createSelectSchema(systemSettings);
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type SelectSystemSetting = typeof systemSettings.$inferSelect;