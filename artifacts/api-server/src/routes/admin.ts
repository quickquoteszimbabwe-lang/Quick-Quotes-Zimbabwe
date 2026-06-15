import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, professionalsTable, jobsTable, paymentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", async (_req, res) => {
  const users = await db.select().from(usersTable);
  const professionals = await db.select().from(professionalsTable);
  const profMap = new Map(professionals.map(p => [p.userId, p]));
  res.json(users.map(u => {
    const prof = profMap.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      suspended: u.suspended,
      createdAt: u.createdAt.toISOString(),
      professionalId: prof?.id ?? null,
      professionalVerified: prof?.verified ?? null,
    };
  }));
});

router.post("/users/:id/suspend", async (req, res) => {
  const userId = parseInt(req.params.id);
  await db.update(usersTable).set({ suspended: true }).where(eq(usersTable.id, userId));
  res.json({ message: "User suspended" });
});

router.post("/users/:id/unsuspend", async (req, res) => {
  const userId = parseInt(req.params.id);
  await db.update(usersTable).set({ suspended: false }).where(eq(usersTable.id, userId));
  res.json({ message: "User unsuspended" });
});

router.post("/professionals/:id/approve", async (req, res) => {
  const profId = parseInt(req.params.id);
  const [prof] = await db.update(professionalsTable).set({ verified: true }).where(eq(professionalsTable.id, profId)).returning();
  res.json({
    id: prof.id,
    userId: prof.userId,
    services: prof.services,
    rating: prof.rating ? Number(prof.rating) : null,
    verified: prof.verified,
    completedJobs: prof.completedJobs,
    bio: prof.bio,
    location: prof.location,
  });
});

router.get("/jobs", async (_req, res) => {
  const jobs = await db.select().from(jobsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u.name]));
  res.json(jobs.map(j => ({
    id: j.id,
    customerId: j.customerId,
    category: j.category,
    service: j.service,
    description: j.description,
    location: j.location,
    timeline: j.timeline,
    status: j.status,
    selectedProfessionalId: j.selectedProfessionalId,
    createdAt: j.createdAt.toISOString(),
    customerName: userMap.get(j.customerId) ?? null,
  })));
});

router.get("/payments", async (_req, res) => {
  const payments = await db.select().from(paymentsTable);
  res.json(payments.map(p => ({
    id: p.id,
    jobId: p.jobId,
    amount: Number(p.amount),
    status: p.status as "pending" | "paid" | "released",
    method: p.method as "ecocash" | "bank_transfer" | "paynow",
    createdAt: p.createdAt.toISOString(),
    jobDescription: null,
  })));
});

export default router;
