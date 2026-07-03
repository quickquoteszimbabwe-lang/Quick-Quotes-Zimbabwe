import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { categoriesTable } from "./categories";
import { subcategoriesTable } from "./subcategories";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("Wrench"),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  subcategoryId: integer("subcategory_id").references(() => subcategoriesTable.id),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Service = typeof servicesTable.$inferSelect;
export type InsertService = typeof servicesTable.$inferInsert;
