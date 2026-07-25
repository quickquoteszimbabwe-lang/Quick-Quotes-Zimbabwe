import { pgTable, serial, integer, numeric, text, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface QuoteExtra {
  description: string;
  amount: number;
}

export interface QuoteMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate?: string;
}

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  professionalId: integer("professional_id").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  timeline: text("timeline").notNull(),
  message: text("message"),
  items: jsonb("items").$type<QuoteLineItem[]>().notNull().default([]),
  pricingModel: text("pricing_model").default("fixed_price"),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  depositRequired: boolean("deposit_required").default(false),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).default("0"),
  extras: jsonb("extras").$type<QuoteExtra[]>().default([]),
  milestones: jsonb("milestones").$type<QuoteMilestone[]>().default([]),
  notes: text("notes"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({ id: true, createdAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
