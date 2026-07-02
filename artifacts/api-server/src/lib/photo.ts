import { db } from "@workspace/db";
import { verificationDocumentsTable } from "@workspace/db/schema";
import { inArray, eq, and, desc } from "drizzle-orm";

export async function getFacePhotoMap(userIds: number[]): Promise<Map<number, string>> {
  if (userIds.length === 0) return new Map();

  const docs = await db
    .select({
      userId: verificationDocumentsTable.userId,
      fileData: verificationDocumentsTable.fileData,
      createdAt: verificationDocumentsTable.createdAt,
    })
    .from(verificationDocumentsTable)
    .where(and(inArray(verificationDocumentsTable.userId, userIds), eq(verificationDocumentsTable.type, "face_photo")))
    .orderBy(desc(verificationDocumentsTable.createdAt));

  const map = new Map<number, string>();
  for (const doc of docs) {
    if (!map.has(doc.userId)) {
      map.set(doc.userId, doc.fileData);
    }
  }
  return map;
}

export async function getFacePhotoForUser(userId: number): Promise<string | null> {
  const [doc] = await db
    .select({ fileData: verificationDocumentsTable.fileData })
    .from(verificationDocumentsTable)
    .where(and(eq(verificationDocumentsTable.userId, userId), eq(verificationDocumentsTable.type, "face_photo")))
    .orderBy(desc(verificationDocumentsTable.createdAt))
    .limit(1);
  return doc?.fileData ?? null;
}
