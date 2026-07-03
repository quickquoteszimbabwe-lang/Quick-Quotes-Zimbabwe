import { db } from "@workspace/db";
import { verificationDocumentsTable, jobPhotosTable } from "@workspace/db/schema";
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

export function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export function buildDataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export async function insertJobPhotos(jobId: number, dataUrls: string[]): Promise<void> {
  const rows = dataUrls
    .map(parseDataUrl)
    .filter((parsed): parsed is { mimeType: string; base64: string } => parsed !== null)
    .map((parsed) => ({
      jobId,
      fileData: parsed.base64,
      mimeType: parsed.mimeType,
    }));
  if (rows.length === 0) return;
  await db.insert(jobPhotosTable).values(rows);
}

export async function getJobPhotosMap(jobIds: number[]): Promise<Map<number, string[]>> {
  if (jobIds.length === 0) return new Map();

  const photos = await db
    .select({
      jobId: jobPhotosTable.jobId,
      fileData: jobPhotosTable.fileData,
      mimeType: jobPhotosTable.mimeType,
    })
    .from(jobPhotosTable)
    .where(inArray(jobPhotosTable.jobId, jobIds))
    .orderBy(jobPhotosTable.id);

  const map = new Map<number, string[]>();
  for (const photo of photos) {
    const list = map.get(photo.jobId) ?? [];
    list.push(buildDataUrl(photo.mimeType, photo.fileData));
    map.set(photo.jobId, list);
  }
  return map;
}

export async function getJobPhotos(jobId: number): Promise<string[]> {
  const map = await getJobPhotosMap([jobId]);
  return map.get(jobId) ?? [];
}
