import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobsTable, usersTable, quotesTable, professionalsTable, paymentsTable, reviewsTable } from "@workspace/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreateJobBody, UpdateJobBody, SelectQuoteBody } from "@workspace/api-zod";
import { getFacePhotoMap, insertJobPhotos, getJobPhotos } from "../lib/photo";
import { ensurePublicHandles } from "../lib/public-identity";

const router: IRouter = Router();

type RequestViewer = { userId: number; role: string; professionalId?: number };
type RequestCustomer = {
  publicHandle?: string | null;
  email?: string | null;
  phone?: string | null;
};

function canViewLocation(job: typeof jobsTable.$inferSelect, viewer: RequestViewer) {
  return viewer.role === "admin" || viewer.userId === job.customerId || viewer.professionalId === job.selectedProfessionalId;
}

function canViewContact(job: typeof jobsTable.$inferSelect, viewer: RequestViewer) {
  return viewer.role === "admin" || viewer.professionalId === job.selectedProfessionalId;
}

function formatRequest(
  job: typeof jobsTable.$inferSelect,
  customer?: RequestCustomer,
  photos?: string[],
  viewer?: RequestViewer,
) {
  const locationVisible = viewer ? canViewLocation(job, viewer) : false;
  const contactVisible = viewer ? canViewContact(job, viewer) : false;
  return {
    id: job.id,
    customerId: job.customerId,
    category: job.category,
    service: job.service,
    description: job.description,
    location: locationVisible ? job.location : "Shared after a provider is selected",
    timeline: job.timeline,
    status: job.status,
    selectedProfessionalId: job.selectedProfessionalId,
    requestType: job.requestType ?? "professional_service",
    createdAt: job.createdAt.toISOString(),
    customerName: customer?.publicHandle ?? null,
    customerEmail: contactVisible ? customer?.email ?? null : null,
    customerPhone: contactVisible ? customer?.phone ?? null : null,
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
    ? await db.select({ id: usersTable.id, publicHandle: usersTable.publicHandle }).from(usersTable).where(inArray(usersTable.id, customerIds))
    : [];
  const publicHandles = await ensurePublicHandles(customerIds);

  res.json(jobs.map(j => formatRequest(
    j,
    { publicHandle: publicHandles.get(j.customerId) ?? customers.find(c => c.id === j.customerId)?.publicHandle },
    undefined,
    { userId, role },
  )));
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (req.user!.role !== "customer") {
    res.status(403).json({ error: "Only clients can create requests" });
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
    requestType: (parsed.data as any).requestType ?? "professional_service",
  }).returning();

  if (parsed.data.photos && parsed.data.photos.length > 0) {
    await insertJobPhotos(job.id, parsed.data.photos);
  }
  const photos = await getJobPhotos(job.id);

  const [customer] = await db.select({ publicHandle: usersTable.publicHandle }).from(usersTable).where(eq(usersTable.id, userId));
  const publicHandle = (await ensurePublicHandles([userId])).get(userId) ?? customer?.publicHandle;
  res.status(201).json(formatRequest(job, { publicHandle }, photos, req.user!));
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const [viewerProfessional] = req.user!.role === "professional"
    ? await db.select({ id: professionalsTable.id }).from(professionalsTable).where(eq(professionalsTable.userId, req.user!.userId))
    : [];
  const viewer = { ...req.user!, professionalId: viewerProfessional?.id };

  const [customer] = await db.select({
    publicHandle: usersTable.publicHandle,
    email: usersTable.email,
    phone: usersTable.phone,
  }).from(usersTable).where(eq(usersTable.id, job.customerId));
  const customerHandle = (await ensurePublicHandles([job.customerId])).get(job.customerId) ?? customer?.publicHandle;

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
    ? await db.select({ id: usersTable.id, publicHandle: usersTable.publicHandle }).from(usersTable).where(inArray(usersTable.id, professionalUserIds))
    : [];
  const professionalHandles = await ensurePublicHandles(professionalUserIds);
  const photoMap = await getFacePhotoMap(professionalUserIds);
  const profMap = new Map(professionals.map(p => [p.id, {
    ...p,
    name: professionalHandles.get(p.userId) ?? professionalUsers.find(u => u.id === p.userId)?.publicHandle,
    photoUrl: photoMap.get(p.userId) ?? null,
  }]));
  const selectedProfessionalUserId = professionals.find(p => p.id === job.selectedProfessionalId)?.userId ?? null;

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.jobId, jobId));
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.jobId, jobId));
  const reviewCustomer = review ? await db.select({ publicHandle: usersTable.publicHandle }).from(usersTable).where(eq(usersTable.id, review.customerId)) : [];
  const photos = await getJobPhotos(jobId);

  res.json({
    id: job.id,
    customerId: job.customerId,
    category: job.category,
    service: job.service,
    description: job.description,
    location: canViewLocation(job, viewer) ? job.location : "Shared after a provider is selected",
    timeline: job.timeline,
    status: job.status,
    selectedProfessionalId: job.selectedProfessionalId,
    selectedProfessionalUserId,
    requestType: job.requestType ?? "professional_service",
    createdAt: job.createdAt.toISOString(),
    customerName: customerHandle ?? null,
    customerEmail: canViewContact(job, viewer) ? customer?.email ?? null : null,
    customerPhone: canViewContact(job, viewer) ? customer?.phone ?? null : null,
    photos,
    quotes: quotes.map(q => {
      const prof = profMap.get(q.professionalId);
      return {
        id: q.id,
        jobId: q.jobId,
        professionalId: q.professionalId,
        professionalUserId: prof?.userId ?? null,
        price: Number(q.price),
        timeline: q.timeline,
        message: q.message,
        items: q.items,
        pricingModel: q.pricingModel ?? "fixed_price",
        discount: q.discount ? Number(q.discount) : 0,
        depositRequired: q.depositRequired ?? false,
        depositAmount: q.depositAmount ? Number(q.depositAmount) : 0,
        extras: q.extras ?? [],
        milestones: q.milestones ?? [],
        notes: q.notes ?? null,
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
      customerName: reviewCustomer[0]?.publicHandle ?? null,
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
  const [customer] = await db.select({
    publicHandle: usersTable.publicHandle,
    email: usersTable.email,
    phone: usersTable.phone,
  }).from(usersTable).where(eq(usersTable.id, job.customerId));
  const publicHandle = (await ensurePublicHandles([job.customerId])).get(job.customerId) ?? customer?.publicHandle;
  res.json(formatRequest(job, { publicHandle, email: customer?.email, phone: customer?.phone }, undefined, req.user!));
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
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  const [updated] = await db.update(jobsTable).set({
    selectedProfessionalId: quote.professionalId,
    status: "in_progress",
  }).where(eq(jobsTable.id, jobId)).returning();

  const [customer] = await db.select({
    publicHandle: usersTable.publicHandle,
    email: usersTable.email,
    phone: usersTable.phone,
  }).from(usersTable).where(eq(usersTable.id, userId));
  const publicHandle = (await ensurePublicHandles([userId])).get(userId) ?? customer?.publicHandle;
  res.json(formatRequest(updated, { publicHandle, email: customer?.email, phone: customer?.phone }, undefined, req.user!));
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

  const [customer] = await db.select({
    publicHandle: usersTable.publicHandle,
    email: usersTable.email,
    phone: usersTable.phone,
  }).from(usersTable).where(eq(usersTable.id, userId));
  const publicHandle = (await ensurePublicHandles([userId])).get(userId) ?? customer?.publicHandle;
  res.json(formatRequest(updated, { publicHandle, email: customer?.email, phone: customer?.phone }, undefined, req.user!));
});

export default router;
