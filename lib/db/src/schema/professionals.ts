import { pgTable, serial, integer, text, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const professionalsTable = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  accountType: text("account_type").notNull().default("individual"),
  services: text("services").array().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  verified: boolean("verified").notNull().default(false),
  completedJobs: integer("completed_jobs").notNull().default(0),
  bio: text("bio"),
  location: text("location"),
  experience: text("experience"),
});

export const insertProfessionalSchema = createInsertSchema(professionalsTable).omit({ id: true });
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionalsTable.$inferSelect;
