import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const jobMessagesTable = pgTable("job_messages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  senderId: integer("sender_id").notNull(),
  body: text("body").notNull(),
  moderationStatus: text("moderation_status").notNull().default("visible"),
  moderatedBy: integer("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type JobMessage = typeof jobMessagesTable.$inferSelect;