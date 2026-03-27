import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const verificationDocumentsTable = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VerificationDocument = typeof verificationDocumentsTable.$inferSelect;
