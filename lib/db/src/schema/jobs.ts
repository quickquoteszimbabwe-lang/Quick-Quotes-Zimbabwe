import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  category: text("category").notNull(),
  service: text("service").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  timeline: text("timeline"),
  status: text("status").notNull().default("open"),
  selectedProfessionalId: integer("selected_professional_id"),
  progressNote: text("progress_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
