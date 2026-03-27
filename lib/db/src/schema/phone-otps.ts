import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const phoneOtpsTable = pgTable("phone_otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PhoneOtp = typeof phoneOtpsTable.$inferSelect;
