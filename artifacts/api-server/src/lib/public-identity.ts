import { randomBytes } from "node:crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const HANDLE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createHandle(): string {
  const bytes = randomBytes(8);
  let suffix = "";
  for (const byte of bytes) {
    suffix += HANDLE_ALPHABET[byte % HANDLE_ALPHABET.length];
  }
  return `QQZ-${suffix}`;
}

export async function ensurePublicHandle(userId: number): Promise<string> {
  const [user] = await db
    .select({ publicHandle: usersTable.publicHandle })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (user?.publicHandle) {
    return user.publicHandle;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const handle = createHandle();
    try {
      const [updated] = await db
        .update(usersTable)
        .set({ publicHandle: handle })
        .where(and(isNull(usersTable.publicHandle), eq(usersTable.id, userId)))
        .returning({ publicHandle: usersTable.publicHandle });
      if (updated?.publicHandle) {
        return updated.publicHandle;
      }
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
    }
  }

  const fallback = `QQZ-${userId.toString(36).toUpperCase()}`;
  return fallback;
}

export async function ensurePublicHandles(userIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  for (const userId of [...new Set(userIds)]) {
    map.set(userId, await ensurePublicHandle(userId));
  }
  return map;
}