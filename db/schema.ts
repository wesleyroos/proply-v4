import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  subscriptionStatus: text("subscription_status").default("free").notNull(),
  subscriptionExpiryDate: timestamp("subscription_expiry_date"),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  address: text("address").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  longTermRental: decimal("long_term_rental").notNull(),
  annualEscalation: decimal("annual_escalation").notNull(),
  shortTermNightly: decimal("short_term_nightly").notNull(),
  annualOccupancy: decimal("annual_occupancy").notNull(),
  managementFee: decimal("management_fee").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPropertySchema = createInsertSchema(properties);
export const selectPropertySchema = createSelectSchema(properties);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type SelectProperty = typeof properties.$inferSelect;
