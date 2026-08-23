import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quotesTable, professionalsTable, usersTable, jobsTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreateQuoteBody } from "@workspace/api-zod";
import { getFacePhotoForUser } from "../lib/photo";

const router: IRouter = Router();

function computeItemsTotal(items: { quantity: number; unitPrice: number }[] | undefined): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
}

function computeExtrasTotal(extras: { amount: number }[] | undefined): number {
  if (!extras || extras.length === 0) return 0;
  return extras.reduce((sum, e) => sum + Number(e.amount), 0);
}

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (req.user!.role !== "professional") {
    res.status(403).json({ error: "Only providers can submit offers" });
    return;
  }
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.status(400).json({ error: "Provider profile required" });
    return;
  }

  const existing = await db.select().from(quotesTable).where(
    and(eq(quotesTable.jobId, parsed.data.jobId), eq(quotesTable.professionalId, prof.id))
  );
  if (existing.length > 0) {
    res.status(400).json({ error: "You already submitted an offer for this request" });
    return;
  }

  const body = parsed.data as any;
  const itemsTotal = computeItemsTotal(body.items);
  const extrasTotal = computeExtrasTotal(body.extras);
  const discount = Number(body.discount) || 0;
  const computedTotal = Math.max(0, itemsTotal + extrasTotal - discount);
  const price = computedTotal > 0 ? computedTotal : (parsed.data.price ?? 0);

  // Enrich items with unit field if present
  const enrichedItems = (body.items ?? []).map((item: any) => ({
    description: item.description ?? "",
    quantity: Number(item.quantity) || 0,
    unit: item.unit ?? "",
    unitPrice: Number(item.unitPrice) || 0,
  }));

  const [quote] = await db.insert(quotesTable).values({
    jobId: parsed.data.jobId,
    professionalId: prof.id,
    price: String(price),
    timeline: parsed.data.timeline,
    message: parsed.data.message ?? null,
    items: enrichedItems,
    pricingModel: body.pricingModel ?? "fixed_price",
    discount: body.discount ? String(body.discount) : "0",
    depositRequired: body.depositRequired ?? false,
    depositAmount: body.depositAmount ? String(body.depositAmount) : "0",
    extras: (body.extras ?? []).map((e: any) => ({
      description: e.description ?? "",
      amount: Number(e.amount) || 0,
    })),
    milestones: (body.milestones ?? []).map((m: any) => ({
      title: m.title ?? "",
      description: m.description ?? "",
      amount: Number(m.amount) || 0,
    })),
    notes: body.notes ?? null,
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
    pricingModel: quote.pricingModel ?? "fixed_price",
    discount: Number(quote.discount) || 0,
    depositRequired: quote.depositRequired ?? false,
    depositAmount: Number(quote.depositAmount) || 0,
    extras: quote.extras ?? [],
    milestones: quote.milestones ?? [],
    notes: quote.notes ?? null,
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
    ? await db.select({ id: jobsTable.id, description: jobsTable.description }).from(jobsTable).where(inArray(jobsTable.id, jobIds))
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
    pricingModel: q.pricingModel ?? "fixed_price",
    discount: Number(q.discount) || 0,
    depositRequired: q.depositRequired ?? false,
    depositAmount: Number(q.depositAmount) || 0,
    extras: q.extras ?? [],
    milestones: q.milestones ?? [],
    notes: q.notes ?? null,
    createdAt: q.createdAt.toISOString(),
    professionalName: user?.name ?? null,
    professionalRating: prof.rating ? Number(prof.rating) : null,
    professionalPhotoUrl: photoUrl,
    professionalExperience: prof.experience ?? null,
    jobDescription: jobMap.get(q.jobId) ?? null,
  })));
});

export default router;
