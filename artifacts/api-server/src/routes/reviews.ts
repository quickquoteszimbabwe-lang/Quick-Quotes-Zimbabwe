import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, professionalsTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreateReviewBody } from "@workspace/api-zod";
import { ensurePublicHandles } from "../lib/public-identity";

const router: IRouter = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    jobId: parsed.data.jobId,
    customerId: userId,
    professionalId: parsed.data.professionalId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }).returning();

  const reviews = await db.select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(eq(reviewsTable.professionalId, parsed.data.professionalId));
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await db.update(professionalsTable).set({ rating: String(avgRating.toFixed(2)) })
    .where(eq(professionalsTable.id, parsed.data.professionalId));

  const [customer] = await db.select({ publicHandle: usersTable.publicHandle }).from(usersTable).where(eq(usersTable.id, userId));
  const publicHandle = (await ensurePublicHandles([userId])).get(userId) ?? customer?.publicHandle;
  res.status(201).json({
    id: review.id,
    jobId: review.jobId,
    customerId: review.customerId,
    professionalId: review.professionalId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    customerName: publicHandle ?? null,
  });
});

router.get("/professional/:professionalId", requireAuth, async (req: AuthRequest, res) => {
  const professionalId = parseInt(req.params.professionalId);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.professionalId, professionalId));

  const customerIds = [...new Set(reviews.map(r => r.customerId))];
  const customers = customerIds.length > 0
    ? await db.select({ id: usersTable.id, publicHandle: usersTable.publicHandle }).from(usersTable)
        .where(inArray(usersTable.id, customerIds))
    : [];
  const publicHandles = await ensurePublicHandles(customerIds);

  res.json(reviews.map(r => ({
    id: r.id,
    jobId: r.jobId,
    customerId: r.customerId,
    professionalId: r.professionalId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    customerName: publicHandles.get(r.customerId) ?? customers.find(c => c.id === r.customerId)?.publicHandle ?? null,
  })));
});

export default router;
