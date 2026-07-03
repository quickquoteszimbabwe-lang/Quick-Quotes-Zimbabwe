import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const jobPhotosTable = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  fileData: text("file_data").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type JobPhoto = typeof jobPhotosTable.$inferSelect;
export type InsertJobPhoto = typeof jobPhotosTable.$inferInsert;
