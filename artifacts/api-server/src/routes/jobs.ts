import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobsTable, usersTable, quotesTable, professionalsTable, paymentsTable, reviewsTable } from "@workspace/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreateJobBody, UpdateJobBody, SelectQuoteBody } from "@workspace/api-zod";
import { getFacePhotoMap, insertJobPhotos, getJobPhotos } from "../lib/photo";

const router: IRouter = Router();

function formatJob(job: typeof jobsTable.$inferSelect, customerName?: string | null, photos?: string[]) {
  return {
    id: job.id,
    customerId: job.customerId,
    category: job.category,
    service: job.service,
    description: job.description,
    location: job.location,
    timeline: job.timeline,
    status: job.status,
    selectedProfessionalId: job.selectedProfessionalId,
    createdAt: job.createdAt.toISOString(),
    customerName: customerName ?? null,
    photos: photos ?? [],
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const { status, category } = req.query;

  let jobs: typeof jobsTable.$inferSelect[] = [];

  if (role === "customer") {
    const conditions = [eq(jobsTable.customerId, userId)];
    if (status) conditions.push(eq(jobsTable.status, status as string));
    if (category) conditions.push(eq(jobsTable.category, category as string));
    jobs = await db.select().from(jobsTable).where(and(...conditions)).orderBy(sql`${jobsTable.createdAt} DESC`);
  } else if (role === "professional") {
    const conditions = [eq(jobsTable.status, "open")];
    if (category) conditions.push(eq(jobsTable.category, category as string));
    jobs = await db.select().from(jobsTable).where(and(...conditions)).orderBy(sql`${jobsTable.createdAt} DESC`);
  } else {
    jobs = await db.select().from(jobsTable).orderBy(sql`${jobsTable.createdAt} DESC`);
  }

  const customerIds = [...new Set(jobs.map(j => j.customerId))];
  const customers = customerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, customerIds))
    : [];
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  res.json(jobs.map(j => formatJob(j, customerMap.get(j.customerId))));
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (req.user!.role !== "customer") {
    res.status(403).json({ error: "Only customers can create jobs" });
    return;
  }
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [job] = await db.insert(jobsTable).values({
    customerId: userId,
    category: parsed.data.category,
    service: parsed.data.service,
    description: parsed.data.description,
    location: parsed.data.location,
    timeline: parsed.data.timeline ?? null,
    status: "open",
  }).returning();

  if (parsed.data.photos && parsed.data.photos.length > 0) {
    await insertJobPhotos(job.id, parsed.data.photos);
  }
  const photos = await getJobPhotos(job.id);

  const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  res.status(201).json(formatJob(job, customer?.name, photos));
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, job.customerId));

  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.jobId, jobId));
  const professionalIds = [...new Set(quotes.map(q => q.professionalId))];
  const professionals = professionalIds.length > 0
    ? await db.select({
        id: professionalsTable.id,
        userId: professionalsTable.userId,
        rating: professionalsTable.rating,
        verified: professionalsTable.verified,
        completedJobs: professionalsTable.completedJobs,
        experience: professionalsTable.experience,
      }).from(professionalsTable).where(inArray(professionalsTable.id, professionalIds))
    : [];
  const professionalUserIds = professionals.map(p => p.userId);
  const professionalUsers = professionalUserIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, professionalUserIds))
    : [];
  const photoMap = await getFacePhotoMap(professionalUserIds);
  const profMap = new Map(professionals.map(p => [p.id, { ...p, name: professionalUsers.find(u => u.id === p.userId)?.name, photoUrl: photoMap.get(p.userId) ?? null }]));

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.jobId, jobId));
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.jobId, jobId));
  const reviewCustomer = review ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, review.customerId)) : [];
  const photos = await getJobPhotos(jobId);

  res.json({
    id: job.id,
    customerId: job.customerId,
    category: job.category,
    service: job.service,
    description: job.description,
    location: job.location,
    timeline: job.timeline,
    status: job.status,
    selectedProfessionalId: job.selectedProfessionalId,
    createdAt: job.createdAt.toISOString(),
    customerName: customer?.name ?? null,
    photos,
    quotes: quotes.map(q => {
      const prof = profMap.get(q.professionalId);
      return {
        id: q.id,
        jobId: q.jobId,
        professionalId: q.professionalId,
        price: Number(q.price),
        timeline: q.timeline,
        message: q.message,
        items: q.items,
        createdAt: q.createdAt.toISOString(),
        professionalName: prof?.name ?? null,
        professionalRating: prof?.rating ? Number(prof.rating) : null,
        professionalVerified: prof?.verified ?? null,
        professionalCompletedJobs: prof?.completedJobs ?? null,
        professionalPhotoUrl: prof?.photoUrl ?? null,
        professionalExperience: prof?.experience ?? null,
      };
    }),
    payment: payment ? {
      id: payment.id,
      jobId: payment.jobId,
      amount: Number(payment.amount),
      status: payment.status,
      method: payment.method as "ecocash" | "bank_transfer" | "paynow",
      createdAt: payment.createdAt.toISOString(),
    } : undefined,
    review: review ? {
      id: review.id,
      jobId: review.jobId,
      customerId: review.customerId,
      professionalId: review.professionalId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      customerName: reviewCustomer[0]?.name ?? null,
    } : undefined,
  });
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.progressNote !== undefined) updates.progressNote = parsed.data.progressNote;

  const [job] = await db.update(jobsTable).set(updates).where(eq(jobsTable.id, jobId)).returning();
  const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, job.customerId));
  res.json(formatJob(job, customer?.name));
});

router.post("/:id/select-quote", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const jobId = parseInt(req.params.id);
  const parsed = SelectQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job || job.customerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [quote] = await db.select().from(quotesTable).where(and(eq(quotesTable.id, parsed.data.quoteId), eq(quotesTable.jobId, jobId)));
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  const [updated] = await db.update(jobsTable).set({
    selectedProfessionalId: quote.professionalId,
    status: "in_progress",
  }).where(eq(jobsTable.id, jobId)).returning();

  const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  res.json(formatJob(updated, customer?.name));
});

router.post("/:id/complete", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const jobId = parseInt(req.params.id);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job || job.customerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db.update(jobsTable).set({ status: "completed" }).where(eq(jobsTable.id, jobId)).returning();

  if (job.selectedProfessionalId) {
    await db.update(professionalsTable).set({
      completedJobs: sql`${professionalsTable.completedJobs} + 1`,
    }).where(eq(professionalsTable.id, job.selectedProfessionalId));
  }

  const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  res.json(formatJob(updated, customer?.name));
});

export default router;
