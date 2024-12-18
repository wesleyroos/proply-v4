import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

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
  // Store computed results
  longTermMonthly: decimal("long_term_monthly", { precision: 10, scale: 2 }).notNull(),
  longTermAnnual: decimal("long_term_annual", { precision: 10, scale: 2 }).notNull(),
  shortTermMonthly: decimal("short_term_monthly", { precision: 10, scale: 2 }).notNull(),
  shortTermAnnual: decimal("short_term_annual", { precision: 10, scale: 2 }).notNull(),
  shortTermAfterFees: decimal("short_term_after_fees", { precision: 10, scale: 2 }).notNull(),
  breakEvenOccupancy: decimal("break_even_occupancy", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Schemas
export const insertAccessCodeSchema = createInsertSchema(accessCodes);
export const selectAccessCodeSchema = createSelectSchema(accessCodes);
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPropertySchema = createInsertSchema(properties);
export const selectPropertySchema = createSelectSchema(properties);

// Types
export type InsertAccessCode = typeof accessCodes.$inferInsert;
export type SelectAccessCode = typeof accessCodes.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type SelectProperty = typeof properties.$inferSelect;
