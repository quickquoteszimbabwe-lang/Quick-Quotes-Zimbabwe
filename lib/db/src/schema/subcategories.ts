import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { categoriesTable } from "./categories";

export const subcategoriesTable = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Subcategory = typeof subcategoriesTable.$inferSelect;
export type InsertSubcategory = typeof subcategoriesTable.$inferInsert;
