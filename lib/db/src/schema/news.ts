import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  imagePath: text("image_path"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNewsSchema = createInsertSchema(newsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof newsTable.$inferSelect;