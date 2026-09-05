import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobMessagesTable, jobsTable, usersTable, professionalsTable } from "@workspace/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreateJobMessageBody } from "@workspace/api-zod";
import { ensurePublicHandles } from "../lib/public-identity";
import { getFacePhotoMap } from "../lib/photo";

const router: IRouter = Router();

async function getJobForViewer(jobId: number, req: AuthRequest) {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) return { job: null, allowed: false };
  const userId = req.user!.userId;
  const [professional] = req.user!.role === "professional"
    ? await db.select({ id: professionalsTable.id }).from(professionalsTable).where(eq(professionalsTable.userId, userId))
    : [];
  const allowed =
    req.user!.role === "admin" ||
    job.customerId === userId ||
    professional?.id === job.selectedProfessionalId;
  return { job, allowed };
}

async function formatMessages(messages: typeof jobMessagesTable.$inferSelect[]) {
  const senderIds = [...new Set(messages.map(message => message.senderId))];
  if (senderIds.length === 0) return [];

  const users = await db
    .select({ id: usersTable.id, publicHandle: usersTable.publicHandle, role: usersTable.role })
    .from(usersTable)
    .where(inArray(usersTable.id, senderIds));
  const handles = await ensurePublicHandles(senderIds);
  const photos = await getFacePhotoMap(senderIds);
  const userMap = new Map(users.map(user => [user.id, user]));

  return messages.map(message => ({
    id: message.id,
    jobId: message.jobId,
    senderId: message.senderId,
    senderPublicName: handles.get(message.senderId) ?? userMap.get(message.senderId)?.publicHandle ?? null,
    senderRole: userMap.get(message.senderId)?.role ?? "customer",
    senderPhotoUrl: photos.get(message.senderId) ?? null,
    body: message.body,
    moderationStatus: message.moderationStatus as "visible" | "hidden",
    createdAt: message.createdAt.toISOString(),
  }));
}

router.get("/:id/messages", requireAuth, async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const { job, allowed } = await getJobForViewer(jobId, req);
  if (!job) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (!allowed) {
    res.status(403).json({ error: "Chat is only available to the client and selected provider" });
    return;
  }

  const conditions = [eq(jobMessagesTable.jobId, jobId)];
  if (req.user!.role !== "admin") {
    conditions.push(eq(jobMessagesTable.moderationStatus, "visible"));
  }
  const messages = await db
    .select()
    .from(jobMessagesTable)
    .where(and(...conditions))
    .orderBy(asc(jobMessagesTable.createdAt));

  res.json(await formatMessages(messages));
});

router.post("/:id/messages", requireAuth, async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const { job, allowed } = await getJobForViewer(jobId, req);
  if (!job) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (!allowed || !job.selectedProfessionalId) {
    res.status(403).json({ error: "Chat opens after a quote is selected" });
    return;
  }
  if (req.user!.role === "admin") {
    res.status(403).json({ error: "Admins moderate chat but do not send participant messages" });
    return;
  }

  const parsed = CreateJobMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Message must be between 1 and 2000 characters" });
    return;
  }

  const [message] = await db.insert(jobMessagesTable).values({
    jobId,
    senderId: req.user!.userId,
    body: parsed.data.body.trim(),
    moderationStatus: "visible",
  }).returning();

  const [formatted] = await formatMessages([message]);
  res.status(201).json(formatted);
});

export default router;