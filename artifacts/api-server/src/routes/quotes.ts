import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quotesTable, professionalsTable, usersTable, jobsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreateQuoteBody } from "@workspace/api-zod";
import { getFacePhotoForUser } from "../lib/photo";

const router: IRouter = Router();

function computeTotal(items: { quantity: number; unitPrice: number }[] | undefined): number | null {
  if (!items || items.length === 0) return null;
  return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
}

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (req.user!.role !== "professional") {
    res.status(403).json({ error: "Only professionals can submit quotes" });
    return;
  }
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.status(400).json({ error: "Professional profile required" });
    return;
  }

  const existing = await db.select().from(quotesTable).where(
    and(eq(quotesTable.jobId, parsed.data.jobId), eq(quotesTable.professionalId, prof.id))
  );
  if (existing.length > 0) {
    res.status(400).json({ error: "You already submitted a quote for this job" });
    return;
  }

  const computedTotal = computeTotal(parsed.data.items);
  const price = computedTotal !== null ? computedTotal : parsed.data.price;

  const [quote] = await db.insert(quotesTable).values({
    jobId: parsed.data.jobId,
    professionalId: prof.id,
    price: String(price),
    timeline: parsed.data.timeline,
    message: parsed.data.message ?? null,
    items: parsed.data.items ?? [],
  }).returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const photoUrl = await getFacePhotoForUser(userId);

  res.status(201).json({
    id: quote.id,
    jobId: quote.jobId,
    professionalId: quote.professionalId,
    price: Number(quote.price),
    timeline: quote.timeline,
    message: quote.message,
    items: quote.items,
    createdAt: quote.createdAt.toISOString(),
    professionalName: user?.name ?? null,
    professionalRating: prof.rating ? Number(prof.rating) : null,
    professionalPhotoUrl: photoUrl,
    professionalExperience: prof.experience ?? null,
  });
});

router.get("/my", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.json([]);
    return;
  }

  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.professionalId, prof.id));
  const jobIds = [...new Set(quotes.map(q => q.jobId))];
  const jobs = jobIds.length > 0
    ? await db.select({ id: jobsTable.id, description: jobsTable.description }).from(jobsTable)
    : [];
  const jobMap = new Map(jobs.map(j => [j.id, j.description]));

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const photoUrl = await getFacePhotoForUser(userId);

  res.json(quotes.map(q => ({
    id: q.id,
    jobId: q.jobId,
    professionalId: q.professionalId,
    price: Number(q.price),
    timeline: q.timeline,
    message: q.message,
    items: q.items,
    createdAt: q.createdAt.toISOString(),
    professionalName: user?.name ?? null,
    professionalRating: prof.rating ? Number(prof.rating) : null,
    professionalPhotoUrl: photoUrl,
    professionalExperience: prof.experience ?? null,
  })));
});

export default router;
