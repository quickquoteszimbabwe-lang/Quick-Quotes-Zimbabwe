import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("Package"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;
